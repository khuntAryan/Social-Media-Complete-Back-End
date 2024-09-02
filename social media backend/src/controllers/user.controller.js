import { asyncHandler } from "../utils/asyncHandler";
import { ApiError } from "../utils/ApiError.js"
import { User } from "../models/user.modles.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js"
import { ApiResponse } from "../utils/ApiResponse.js"

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
    .cookie("access token",accessToken)
    .cookie("refresh token",refreshToken)
    .json(
        new ApiResponse(200,{user: loggedInUser , accessToken , refreshToken } , "user logged in successfully")
    )
})

export { registerUser }