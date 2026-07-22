import { v2 as cloudinary } from "cloudinary"
import fs from "fs"

cloudinary.config({
    cloud_name:  process.env.CLOUDINARY_CLOUD_NAME,
    api_key:  process.env.CLOUDINARY_API_KEY,
    api_secret:  process.env.CLOUDINARY_API_SECRET,
})

const removeLocalFile = (localFilePath) => {
    if (localFilePath && fs.existsSync(localFilePath)) {
        fs.unlinkSync(localFilePath)
    }
}

const uploadONCloudnary = async (localFilePath) => {
    try {
        if (!localFilePath) return null

        const response = await cloudinary.uploader.upload(localFilePath, {
            resource_type: "auto"
        })
        removeLocalFile(localFilePath)
        console.log("file is uploaded on cloudinary", response.url)
        return response
    } catch (error) {
        removeLocalFile(localFilePath)
        console.log("Cloudinary upload failed:", error.message)
        return null
    }
}

export { uploadONCloudnary }
