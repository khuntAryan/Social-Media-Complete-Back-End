import mongoose, { Schema } from "mongoose"
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";

const userSchema = new Schema({
    username: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
        index: true,
    },
    fullname: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
        index: true,
    },
    email: {
        type: String,
        required: true,
        lowercase: true,
        trim: true,
        unique: true
    },
    password: {
        type: String,
        unique: true,
        requirdd: true
    },
    refeshToken: {
        type: String
    },
    profilePicture: {
        type: String,
        required: true
    }
}, { timestamps: true })






//hashing the password and these are known as hooks
userSchema.pre("save", async function (next) {
    if (!this.isModified("password")) return next();
    this.password = await bcrypt.hash(this.password, 10);
    next();
});





//checking password entered by user for logging in
userSchema.methods.isPasswordCorrect = function (password) { 
    return bcrypt.compare(password , this.password);
 };





 //generating access token and refresh token using methods itself
 userSchema.methods.generateAccessToken = async function (){
    jwt.sign({
        _id: this._id,
    },
    process.env.ACCESS_TOKEN_SECRET,
    {
        expiresIn: process.env.ACCESS_TOKEN_EXPIRY
    }
    );
 };

 userSchema.methods.generateRefreshToken = async function (){
    jwt.sign({
        _id: this._id,
    },
    process.env.REFRESH_TOKEN_SECRET,
    {
        expiresIn: process.env.REFRESH_TOKEN_EXPIRY
    }
    );
 };




export const User = mongoose.model("User", userSchema);