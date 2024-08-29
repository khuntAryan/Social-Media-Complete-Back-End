import mongoose, { Schema } from "mongoose"

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

export const User = mongoose.model("User", userSchema);