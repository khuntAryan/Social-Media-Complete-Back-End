import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import jwt from "jsonwebtoken"
import { User } from "../models/user.modles.js";
import { ApiResponse } from "../utils/ApiResponse";


export const verifyJWT = asyncHandler(async (req, res, next) => {
try {
        //get Token 
        //decode the Token
        //add to req.user
    
        // accessing token from the website or the app(custom)
        const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ", "")
    
        if (!token) {
            throw new ApiError(400, "unauthorized request!!")
        }
    
        // decoding token or simply verifying the token
        const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET)
    
        const user = await User.findById(decodedToken?._id).select("-password -refeshToken")
    
        if (!user) {
            throw new ApiError(400, "user does not exist!!")
        }
    
        req.user = user;
        next()
} catch (error) {
        throw new ApiError(401,"invalid user!!")
}

})


//Generally all the middleWare are used in routes