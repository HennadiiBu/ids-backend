import express from "express";
import authController from "../../controllers/authController.js";
import authenticate from "../../middlewares/authenticate.js";
import validateBody from "../../decorators/validateBody.js";
import { userSigninSchema, userSignupSchema } from "../../utils/validations/userValidationSchemas.js";

const authRouter = express.Router();

const userSigninValidate = validateBody(userSigninSchema);
const userSignupValidate = validateBody(userSignupSchema);

authRouter.get("/current", authenticate, authController.getCurrentUser);

authRouter.post("/signup", userSignupValidate, authController.signUp);

authRouter.post("/signin", userSigninValidate, authController.signIn);

authRouter.post("/signout", authenticate, authController.signout);

export default authRouter;
