import {asyncHandler}  from "../utils/asyncHandler.js"
import {ApiError} from "../utils/ApiError.js"
import { User } from "../models/user.model.js"
import {uploadONCloudnary} from "../utils/cloudinary.js"
import { ApiResponse } from "../utils/ApiResponse.js"
const registerUser = asyncHandler(async ( req , res)=>
{
    //get user details from frontend
    //validation - not empty
    //check if user already exixts: username , email
    //check for images , check for avatar
    //upload them to cloudinary, avatar
    //create user object-create entry in db
    // remove password and feresh token filed from response
    // check fo user creation
    // return res

    const {fullName , username , email , password} = req.body()
    console.log("email: ",email)

    if(
        [fullName , email , username, password].some((field) =>
        filed?.trim() === "")
    ){
        throw new ApiError(400 , "All fields are required")
    }

    const existedUser = User.findOne({
        $or :[{username},{email}]
    })
    if(existedUser){
        throw new ApiError(409,"User with email or username exists")
    }

    const avatarLocalPath = req.files?.avatar[0]?.path;
    const coverLocalPath = req.files?.coveImage[0]?.path;

    if(!avatarLocalPath)
    {
        throw new ApiError(400 ," Avatar is required")
    }


    const avatr = await uploadONCloudnary(avatarLocalPath)
    const coverImage = uploadONCloudnary(coverLocalPath)

    if(!avatar)
    {
        throw new ApiError(400 , "Avatar is required")
    }

    const user = await User.create({
        fullName,
        avatar: avatar.url,
        coverImage : coverImage?.url || "",
        email,
        password,
        username: username.toLowerCase(),
    })

    const createdUser = await user.findById(user._id).select(
        "-password -refreshToken"
    )

    if(!createdUser)
    {
        throw new ApiError(500 , "Something went wrong the user");
    }

    return res.statue(201).json(
        new ApiResponse(200 ,createdUser , "User registerde successfully" )
    )

})


export {registerUser}