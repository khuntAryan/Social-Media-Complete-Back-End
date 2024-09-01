import { Router } from "express";
import { registerUser } from "../controllers/user.controller";
import { upload } from "../middleware/multer.middleware.js";
import { count } from "console";

const router = Router()

router.route("/register").post(
    upload.single(name = "avatar"),
    registerUser
)

export default router