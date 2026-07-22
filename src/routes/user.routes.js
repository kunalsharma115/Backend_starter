import { Router } from "express";
import { logoutuser,loginUser, registerUser, refreshAccessToken } from "../controllers/user.controller.js";
import {upload} from "../middlewares/multer.middelware.js"
import { verifyJWT } from "../middlewares/auth.middleare.js";
const router = Router()

router.route("/register").post(
    upload.fields([
        {
            name : "avatar",
            maxCount:1,
        },
        {
            name: "coverImage",
            maxCount :1,
        }
    ]),
    registerUser
)

router.route("/login").post(loginUser)

router.route("/logout").post(verifyJWT
    ,logoutuser)

router.route("/refresh-token").post(refreshAccessToken)
export default router