import { asyncHandler } from "../utils/asyncHandler";
import { ApiError } from "../utils/ApiError.js"
import { User } from "../models/user.modles.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js"
import {ApiResponse} from "../utils/ApiResponse.js"

const registerUser = asyncHandler(async (req, res) => {
    // get info of user -> nodemon
    // check if the info is empty or not
    // validate user -> new account or existing user
    // check for avatar 
    // upload avatar to cloudinary
    // create user and push it to DB
    // remove password and refrsh token from the response // once user is created it give response and it contain all the info and we don't want to give all info back
    // check for user creation
    // retrun res


    const { fullname, username, email, password } = req.body
    //get info of the user 
    if (
        [fullname, username, email, password].some((field) => field?.trim() === "")
    ) {
        throw new ApiError(400, "all fields are required!!")
    }
    //checking if user provided all the details required from the front-end




    // now we are ckecking if the user is already there or not 
    // we will make a call to DB to check to find the document with same email or username 
    // if there aren't any it means that the user is new 
    // if we get any it means user is already logged in 
    const existedUser = User.findOne({
        $or: [{ username }, { email }]
    })

    if (existedUser) {
        throw new ApiError(400, "User already logged in!!")
    }



    // now we want path of the avatar so that we can upload it in cloudinary
    // we can do that using req.files a new extension provided by multer
    // it allow access to files uploaded
    const avatarLocalPath = req.files?.avatar[0]?.path;

    if (!avatarLocalPath) {
        throw new ApiError(400, "avatar is required!!")
    }

    // uploading avatar to cloudinary
    const avatar = await uploadOnCloudinary(avatarLocalPath);

    // checking if the upload has been successfull or not
    if (!avatar) {
        throw new ApiError(400, "avatar didn't uploaded!!")
    }

    // now we will create an object so that same object we can pass on the DB
    // User is the one thorugh which we can talk to DB
    // while creating object we will pass the data we want to store in DB
    const user = await User.create({
        fullname,
        avatar: avatar.url,
        email,
        password,
        username: username.toLowerCase()
    })
    // with this we have successfully created obj in DB
    // now once obj is made mongoo DB alway create a special ID with each obj
    // we can use that ID to check whether the obj has been made properly or not
    const createdUser = await User.findById(user._id).select(
        "-password -refeshToken"
    ) // this is also know as API call and we can user .select() to remove imp info
    if (!createdUser) {
        throw new ApiError(400, "something went wrong while registring the user!!")
    }

    return res.status(200).json(
        new ApiResponse(200, createdUser, "user created successfully!!")
    )
})

export { registerUser }