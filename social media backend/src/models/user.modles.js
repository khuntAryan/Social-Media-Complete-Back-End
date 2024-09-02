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
    return bcrypt.compare(password, this.password);
};
// here PASSWORD is given by the user 
// THIS.PASSWORD is check from the DB 





//generating access token and refresh token using methods itself
userSchema.methods.generateAccessToken = async function () {
    jwt.sign({
        _id: this._id,
    },
        process.env.ACCESS_TOKEN_SECRET,
        {
            expiresIn: process.env.ACCESS_TOKEN_EXPIRY
        }
    );
};

userSchema.methods.generateRefreshToken = async function () {
    jwt.sign({
        _id: this._id,
    },
        process.env.REFRESH_TOKEN_SECRET,
        {
            expiresIn: process.env.REFRESH_TOKEN_EXPIRY
        }
    );
};


// Access token and Refresh token
// access token are the short lived 
// it gives access to user where the authentication is required before going any task
// i.e-> changing passowrd , editing profile etc
// to do so first user have to verify himself so to make user login again and again 
// ACCESS TOKEN comes into play , it gives access to user to directly aceess the feature


// Refresh token comes into play when Access token get expire 
// if user want to make any change but aceess token is expired 
// now the reftresh token comes where it is avaiable to both Db and the user 
// so in this case user is supposed to hit an end point where the refresh token from the user will be checked with the DB
// if it is correct imidiately new Aceess token will be generated and user will access the feature



export const User = mongoose.model("User", userSchema);