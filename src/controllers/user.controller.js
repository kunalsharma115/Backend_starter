import { asyncHandler } from "../utils/asyncHandler.js"
import { ApiError } from "../utils/ApiError.js"
import { User } from "../models/user.model.js"
import { uploadONCloudnary } from "../utils/cloudinary.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import jwt from "jsonwebtoken"

const generatedAccessAndRefreshToknes = async(userId) =>
{
    try {
        const user = await User.findById(userId)
        const accessToken = user.generateAccessToken()
        const refreshToken = user.generateRefreshToken()

        user.refreshToken = refreshToken
        user.save({validateBeforeSave : false})

        return {accessToken , refreshToken}
    } catch (error) {
        throw new ApiError(500 , "Spmething went wrong while genrating refrsh and access token")
        
    }
}
const registerUser = asyncHandler(async (req, res) => {
    //get user details from frontend
    //validation - not empty
    //check if user already exixts: username , email
    //check for images , check for avatar
    //upload them to cloudinary, avatar
    //create user object-create entry in db
    // remove password and feresh token filed from response
    // check fo user creation
    // return res
console.log("Request object exists:", !!req);
console.log("req.body:", req.body);
console.log("req.files:", req.files);
console.log("Headers:", req.headers);

    const { fullName, username, email, password } = req.body || {}

    if (
        [fullName, email, username, password].some((field) =>
            !field || field.trim() === ""
        )
    ) {
        throw new ApiError(400, "All fields are required")
    }

  

    const existedUser = await User.findOne({
        $or: [{ username }, { email }]
    })
    if (existedUser) {
        throw new ApiError(409, "User with email or username exists")
    }

    const avatarLocalPath = req.files?.avatar?.[0]?.path;
    // const coverLocalPath = req.files?.coverImage[0]?.path;

    let coverLocalPath;

    if (req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0) {
        coverLocalPath = req.files.coverImage[0].path;
    }
    // return coverLocalPath;

    if (!avatarLocalPath) {
        throw new ApiError(400, " Avatar is required")
    }


    const avatar = await uploadONCloudnary(avatarLocalPath)

    if (!avatar) {
        throw new ApiError(400, "Avatar upload failed")
    }

    const coverImage = await uploadONCloudnary(coverLocalPath)

    const user = await User.create({
        fullName,
        avatar: avatar.url,
        coverImage: coverImage?.url || "",
        email,
        password,
        username: username.toLowerCase(),
    })

    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    )

    if (!createdUser) {
        throw new ApiError(500, "Something went wrong the user");
    }

    return res.status(201).json(
        new ApiResponse(200, createdUser, "User registerde successfully")
    )

})


const loginUser = asyncHandler(async(req , res)=>{
    // req body -> data
    // username or email 
    // find the user
    // password check 
    // access and refresh token
    // send cookie

    const {email, username , password} = req.body

    if(!(username || email))
    {
        throw new ApiError(400 , "username or email is required")
    }


    const user = await User.findOne({
        $or:[{username} , {email }]
    })

    if(!user)
    {
        throw new ApiError(404 , "user does not exist")
    }

    const isPassValid = await user.isPasswordCorrect(password )

    if(!isPassValid)
    {
        throw new ApiError(404 , "Invalid user credentials")
    }

    const {accessToken , refreshToken } = await generatedAccessAndRefreshToknes(user._id)
     
    const loggedInUser = await User.findById(user>_id).select("-password  -refreshToken")

    const options = {
        httpOnly : true,
        secure : true
    }

    return res
    .status(200)
    .cookie("accessToken ", accessToken)
    .cookie("refreshToken ", refreshToken)
    .json(
        new ApiResponse(
            200,
            {
                user: loggedInUser , accessToken , refreshToken
            },
            "user logged  in successfully"
        )
    )

})

const logoutuser = asyncHandler(async(req , res) =>{
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $set:{
                refreshToke : undefined
            }
        },
        {
            new : true
        }
    )

    const options =
    {
        httpOnly : true,
        secure : true,
    }

    return res
    .status(200)
    .clearCookie("refreshToken", refreshToken)
    .clearCookie("accessToken", accessToken )
    .json(new ApiResponse(200 , {}, "User Logged Out"))
})

const refreshAccessToken = asyncHandler(async(req , res) =>
{
    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken

    if(!incomingRefreshToken)
    {
        throw new ApiError(401 , " unauthorized request")
    }

try {
        const decodedToken = jwt.verify(
            incomingRefreshToken,
            process.env.REFRESH_TOKEN_SECRET
        )
    
        const user = await User.findById(decodedToken?._id)
    
        if(!user)
        {
            throw new ApiError(401 , "Invalid refresh token")
        }
    
        if(incomingRefreshToken !== user?.refreshToken)
        {
            throw new ApiError(401 , "Refresh token is expired or Used ")
        }
    
        const options = {
            httpOnly : true,
            secure: true
        }
    
        const {accessToken , newrefreshToken}  = await generatedAccessAndRefreshToknes(user._id)
    
        return res
        .status
        .cookie("accessToken", accessToken)
        .cookie("refreshToken", newrefreshToken)
        .json(
            new ApiResponse(
                200,
                {accessToken, refreshToken: newrefreshToken},
                "Access token refreshed"
            )
        )
    } catch (error) {
        throw new ApiError(401 , error?.message || "Invalid refresh token")
    }
})

const changeCurrentPassword = asyncHandler(async(req , res)=>
{
    const {oldPassword , newPassword} = req.body;

    const user = await User.findById(req.user?._id)

    const isPasswordCorrect = await user.isPasswordCorrect(oldPassword)
    if(!isPasswordCorrect)
    {
        throw new ApiError(400 , "Invalid old Password")
    }

    user.password = newPassword
    await user.save({validateBeforeSave: false})

    return res
    .status(200)
    .json(new ApiResponse(200 , {} , "Password changes successfully"))
})

const getCurrentUser = asyncHandler(async(req , res)=>
{
    return res
    .status(200)
    .json(200 , req.user , "current user fetched successfully")
})

const updateAccountDetails = asyncHandler(async(req, res)=>
{
    const {fullName , email} = req.body

    if(!fullName || !email )
    {
        throw new ApiError(400 , "All fields are required")
    }

    const user = User.findByIdAndUpdate(
        req.user?._id,
        {
            $set:{
                fullName,
                email : email,
            }
        },
        {new: true}
    ).select("-password")

    return res
    .status(200)
    .json(new ApiResponse(200 , user , "Account Details updated successfully"))
})

const updateUserAvatar = asyncHandler(async(req ,res)=>
{
   const avatarLocalPath = req.file?.path

   if(!avatarLocalPath)
   {
    throw new ApiError(400 , "Avatar file is missing")
   }

   const avatar= await uploadONCloudnary(avatarLocalPath)

   if(!avatar.url)
   {
        throw new ApiError(400 , "error while uploading on avatar")
   }

   const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set:{
                avatar:avatar.url
            }
        },
        {new: true}
   ).select("-password")

   return res
   .status(200)
   .json(
    new ApiResponse(200, "avatr image uploaded successfully")
   )
})

const updateCoverImage = asyncHandler(async(req ,res)=>
{
   const coverImageLocalPath = req.file?.path

   if(!coverImageLocalPath)
   {
    throw new ApiError(400 , "cover Image file is missing")
   }

   const coverImage= await uploadONCloudnary(coverImageLocalPath)

   if(!coverImage.url)
   {
        throw new ApiError(400 , "error while coverImage on avatar")
   }

   const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set:{
                coverImage:coverImage.url
            }
        },
        {new: true}
   ).select("-password")


   return res
   .status(200)
   .json(
    new ApiResponse(200 , "Cover Image uploadee successfully")
   )
})

const getUserChannelProfile = asyncHandler(async(req , res )=>{

    const {username} = req.params

    if(!username?.trim()){
        throw new ApiError(400)
    }

    const channel = await User.aggregate([
            {
                $match:{
                    username : username?.toLowerCase()
                },
            },

            {
                $lookup:{
                    from: "subscriptions",
                    localField:"_id",
                    foreignField:"channel",
                    as:"subscribes",
                }
            },

            { 
                $lookup:
                {
                    from:"subscriptions",
                    localField:"_id",
                    foreignField:"subscribers",
                    as :"subscribedTo",
                }
            },

            {
                $addFields:
                {
                    subscribersCount:
                    {
                        $size : "$subscribers"
                    },
                    channelsSubscribedToCount:
                    {
                        $size : "$subscribedTo"
                    },
                    isSubscribed: 
                    {
                        $cond:{
                            if : {$in :[req.user?._id, "&subscribers.subscriber"]},
                            then:true,
                            else:false,
                        }
                    }
                }
                
            },

            {
                $project:
                {
                    fullName:1,
                    username:1,
                    isSubscribed:1,
                    subscribersCount:1,
                    channelsSubscribedToCount:1,
                    avatar:1,
                    coverImage:1,
                    email:1,

                }
            }

         
        
    ])

    if(!channel?.length)
    {
        throw new ApiError(404, "Channel doesnt exists")
    }
}
)

export { 
    registerUser ,
    loginUser,
    logoutuser,
    refreshAccessToken,
    changeCurrentPassword,
    getCurrentUser,
    updateAccountDetails,
    updateUserAvatar,
    updateCoverImage,
    getUserChannelProfile
}
