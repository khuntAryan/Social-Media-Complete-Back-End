import { v2 as cloudinary } from "cloudinary"
import { response } from "express";
import fs from "fs"


// configuration is the step where it will allow to set media to upload
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

// uploading files to cloudinary and also checking for errors
const uploadOnCloudinary = async (localFilePath) => {
    try {
        if (!localFilePath) return null; // checking if not empty request has been made
        const resource = await cloudinary.uploader.upload(localFilePath, {
            resource_type: "auto"        // uploading file once user send it to local server
        })
        // console.log("FIle uploaded successfully!!", response.url)
        // now we will unlink the media means will remove it from the local server 
        fs.unlink(localFilePath)
        return response;
    }
    catch (error) {
        fs.unlinkSync(localFilePath) // removing the media from the local server once it is failed to upload 
        return null;
    }
}

export {uploadOnCloudinary}