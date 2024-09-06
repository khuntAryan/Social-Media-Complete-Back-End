import mongoose, { Schema } from "mongoose";


const subscriptionSchema = new Schema({
    followers: {
        type: mongoose.Types.ObjectId,
        ref: "User"
    },
    channel: {
        type: mongoose.Types.ObjectId,
        ref: "User"
    }

    // here both of them are user only
}, { timestamps: true })

export const Subscription = mongoose.model("Subscription", subscriptionSchema)