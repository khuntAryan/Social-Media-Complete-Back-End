import mongoose, { Schema } from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2"


const postSchema = new Schema({
    media: {
        type: String,
        required: true
    },
    owner: {
        type: mongoose.Types.ObjectId,
        ref: "User"   //getting the info from the user module
    },
    title: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    views: {
        type: Number,
        default: 0
    },
    isPublished: {
        type: Boolean,
        default: 0
    }
}, { timestamps: true })

postSchema.plugin(mongooseAggregatePaginate)
export const Post = mongoose.model("Post", postSchema)