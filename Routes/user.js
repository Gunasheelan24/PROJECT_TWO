import Express from "express";
import adminController, {
    createAccountController,
    forgetPasswordController,
    resetPasswordController,
    signInController
} from "../controller/UserController.js";

const userRouter = Express.Router();

userRouter.post("/createuser", createAccountController);
userRouter.get("/signin", signInController);
userRouter.get("/forgetPassword", forgetPasswordController);
userRouter.patch("/resetPassword/:email/:otp/:password/:confirmPassword", resetPasswordController);
userRouter.post("/sellerLogin", adminController)

export default userRouter;