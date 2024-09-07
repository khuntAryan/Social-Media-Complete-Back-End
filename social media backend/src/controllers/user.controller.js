import { asyncHandler } from "../utils/asyncHandler";
import { ApiError } from "../utils/ApiError.js"
import { User } from "../models/user.modles.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import jwt from "jsonwebtoken"
import { v2 as cloudinary } from "cloudinary"
import mongoose from "mongoose";

const generateAccessAndRefreshToken = async((userId) => {
    try {
        const user = User.findById(userId)
        const accessToken = generateAccessToken()
        const refreshToken = generateRefreshToken()

        // here we have generated the Tokens 
        // but in the case of refresh Token we need to save it to DB 
        // so that it can be accessed later 

        user.refeshToken = refreshToken
        // here we have save the token to the object ( user model )
        user.save({ validateBeforeSave: false })
        // here we are saveing the token to the DB
        // so here due to mongoose when we save the refresh token it also saves everything
        // from the object, includes password etc but we dont want that
        // so here we use validate-Before-Save which let us save only Token

        return { accessToken, refreshToken }


    } catch (error) {
        throw new ApiError(500, "something went wrong while generating cookie")
    }
})

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

    //getting input from the user on the below fields 
    const { fullname, username, email, password } = req.body
    //get info of the user 
    //body is where the user will provide the info and will be accessed by us 
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
    const avatarLocalPath = req.file?.avatar[0]?.path;

    //here files means we are taking multiple media from the user
    //e.g-> avatar , cover image etc...
    //when we want single media we use file 
    //in our case we only want one media or image 
    //therefore we we will use req.file

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
    // with this we have successfully created obj in DB and commit in the DB
    // now once obj is made mongoo DB alway create a special ID with each obj
    // we can use that ID to check whether the obj has been made properly or not
    const createdUser = await User.findById(user._id).select(
        "-password -refeshToken"
    ) // this is also know as API call and we can use .select() to remove imp info
    if (!createdUser) {
        throw new ApiError(400, "something went wrong while registring the user!!")
    }

    return res.status(200).json(
        new ApiResponse(200, createdUser, "user created successfully!!")
    )
    //res is used by frontend developer and res also contain the data whuch user will see
})

const loginUser = asyncHandler(async (req, res) => {
    // get data
    // username -> email
    // find the user in DB
    // check password
    // generate access and refresh token
    // send cookie 
    // return res

    const { username, email, password } = req.body



    if (
        [username, email].some((field) => field?.trim() === "")
    ) {
        throw new ApiError(400, "Username or password is requird!!")
    }


    // other way to check whether the field is empty or not
    /*if(!(username || email)){
        throw new ApiError(400,"one of the firld is required!!")
    }*/

    //finding the user from the DB
    const user = User.findOne({
        $or: [{ username }, { email }]
    })

    if (!user) {
        throw new ApiError(404, "user does not exist!!")
    }

    const passwordValid = await user.isPasswordCorrect(password);

    if (!passwordValid) {
        throw new ApiError(400, "password is wrong!!")
    }

    // now we will generate Access Token and Refresh Token
    // but first we will create an method cause we can use it multiple time 
    // we did not need to write again and again

    const { accessToken, refreshToken } = await generateAccessAndRefreshToken(user._id)

    //here we are again making a DB query because the current user don't have refreshtoken
    const loggedInUser = await User.findById(user._id).select("-password -refeshToken")

    // sending cookies
    const options = {
        httpOnly: true,
        secure: true
    }

    return res.status(200)
        .cookie("accessToken", accessToken)
        .cookie("refreshToken", refreshToken)
        .json(
            new ApiResponse(200, { user: loggedInUser, accessToken, refreshToken }, "user logged in successfully")
        )
})

const logoutUser = asyncHandler(async (req, res, next) => {

    await User.findByIdAndUpdate(
        req.user._id  // providing the user // here we are direting the path not the user directly
        ,
        {
            $set: { refeshToken: undefined }  // $set is an operator
        },
        {
            new: true
        }
    )

    //sendind cookies so that we can clear then in res
    const options = {
        httpOnly: true,
        secure: true
    }

    return res
        .status(200)
        .clearCookie("accessToken", options)
        .clearCookie("refreshToken", options)
        .json(
            new ApiResponse(200, {}, "user logged out successFully!!")
        )

})

//now once the refresh token is expire and user want to use the app
//we don't want user to login in again
//so the user will hit a endpoint where his refresh token will be compared
//compared to the refresh token saved in DB 
//if it is same a new set of token will be made 
//and the access token will be activated 
//means user will be able to access the app or use the app

const refreshAccessToken = asyncHandler(async (req, res) => {
    const inCommingRefreshToken = req.cookies.refeshToken || req.body.refeshToken
    if (!inCommingRefreshToken) {
        throw new ApiError(400, "unauthorized user")
    }
    try {
        const decodedToken = jwt.verify(inCommingRefreshToken, process.env.REFRESH_TOKEN_SECRET)
        const user = await User.findById(decodedToken?._id)
        if (!user) {
            throw new ApiError(400, "invlaid user!!")
        }
        if (decodedToken !== user?.refeshToken) {
            throw new ApiError(400, "refresh token expired!!")
        }
        const { accessToken, newRefreshToken } = await generateAccessAndRefreshToken(user._id)
        const options = {
            httpOnly: true,
            secure: true
        }
        return res
            .status(200)
            .cookie("accessToken", accessToken, options)
            .cookie("refreshToken", newRefreshToken, options)
            .json(
                new ApiResponse(200, { accessToken, newRefreshToken }, "Access token refreshed")
            )
    } catch (error) {
        throw new ApiError(400, error?.message || "invalid refresh token!!")
    }
})

const changeCurrentPassword = asyncHandler(async (req, res) => {
    //get the user
    //access the password
    //remove the password(replace)

    const { newPassword } = req.body
    const user = await User.findById(req.user?._id)
    if (!user) {
        throw new ApiError(400, "invalid user!!")
    }
    user.password = newPassword
    await user.save({ validateBeforeSave: false })

    return res
        .status(200)
        .json(
            new ApiResponse(200, {}, "password changed Successfully!!")
        )
})

const currentUser = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user?._id)
    return user
    /* 
    return res
    .status(200)
    .json(
        new apiResponse(200,{req.user},"current user fetched successfully!!")
    )
    */
})

const updateAccountDetails = asyncHandler(async (req, res) => {
    //get the data we want to update
    //find the user
    //access old data
    //replace the data with new one
    //save the data
    //return res

    const { fullname, email, newFullName, newEmail } = req.body
    if (!fullname || !email) {
        throw new ApiError(400, "fields cannot be empty!!")
    }

    const user = await User.findOne(
        { $or: [{ fullname }, { email }] }
    ).select("-password")

    user.fullname = newFullName
    user.email = newEmail

    user.save({ validateBeforeSave: false })

    return res
        .status(200)
        .json(
            new ApiResponse(200, user, "details changed successfully!!")
        )
})

const updateUserAvatar = asyncHandler(async (req, res) => {
    //deleting the pre existing image before updating it

    const currentUser = await User.findById(req.user?._id)
    const oldImageUrl = currentUser.avatar
    //here we have access to old image 

    //this line of code give us the file path already uploaded by the user
    const avatarLocalPath = req.file?.path;
    //multer take the file from the user and we access the path here 
    if (!avatarLocalPath) {
        throw new ApiError(400, "file path missing!!")
    }

    //here we are uploading the image to the cloudinary
    const avatar = await uploadOnCloudinary(avatarLocalPath)

    if (oldImageUrl) {
        const publicId = extractPublicId(oldImageUrl)
        await cloudinary.uploader.destroy(publicId)
    }

    if (!avatar.url) {
        throw new ApiError(400, "file path not found!!")
    }
    //here we are updating the url in the DB
    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                avatar: avatar.url
            }
        },
        { new: true }
    )

    return res
        .status(200)
        .json(
            new ApiResponse(200, user, "avatar updated successFully!!")
        )
})

const getUserChannelProfile = asyncHandler(async (req, res) => {
    const { username } = req.params
    if (!username) {
        throw new ApiError(400, "User does not exist!!")
    }
    const channel = await User.aggregate([

        //first pipeline which finds the particular user using the username
        {
            $match: {
                username: username?.toLowerCase()
            }
        },


        //pipleline for calculating the followers
        {
            $lookup: {
                from: "subscriptions",
                localField: "_id",
                foreignField: "following",
                as: "followers"
            }
        },


        //pipeline for calculating the following
        {
            $lookup: {
                from: "subscriptions",
                localField: "_id",
                foreignField: "followers",
                as: "following"
            }
        },



        //pipeline for counting the documents and also followed or not
        {
            $addFields: {
                followersCount: {
                    $size: "$followers"
                },
                followingCount: {
                    $size: "$following"
                },
                isFollowed: {
                    $cond: {
                        if: { $in: [req.user?._id, "$follower.follower"] },
                        then: true,
                        else: false
                    }
                }
            }
        },



        //passing values which we want to show , selected values 
        {
            $project: {
                username: 1,
                fullname: 1,
                avatar: 1,
                followersCount: 1,
                followingCount: 1,
                isFollowed: 1
            }
        }


    ])
    if (!channel?.length) {
        throw new ApiError(400, "channel does not exist!!")
    }
    return res
        .status(200)
        .json(
            new ApiResponse(200, channel[0], "channel details fetched successfully!!")
        )
        //this channel[0] will be used in frontend to display the info.
})

const getWatchHistory = asyncHandler(async(req,res)=>{
    const user = await User.aggregate([
        {
            $match:{
                _id: new mongoose.Types.ObjectId(req.user._id)
            }
        },
        {
            $lookup:{
                from:"posts",
                localField:"watchHistory",
                foreignField:"_id",
                as:"watchHistory",
                pipeline:[
                    {
                        $lookup:{
                            from:"users",
                            localField:"owner",
                            foreignField:"_id",
                            as:"owner",
                            pipeline:[
                                {
                                    $project:{
                                        fullname:1,
                                        username:1,
                                        avatar:1
                                    }
                                }
                            ]
                        }
                    },
                    {
                        $addFields:{
                            $first: "owner"
                        }
                    }
                ]
            }
        }
    ])
})
export {
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken,
    changeCurrentPassword,
    currentUser,
    updateAccountDetails,
    updateUserAvatar,
    getUserChannelProfile,
    getWatchHistory
}