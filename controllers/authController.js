import bcrypt from "bcrypt";
import HttpError from "../helpers/HttpErrors.js";
import User from "../models/user.js";
import ctrlWrapper from "../decorators/ctrlWrapper.js";
import { nanoid } from "nanoid";
import jwt from "jsonwebtoken";

const { JWT_SECRET } = process.env;

const getCurrentUser = async (req, res) => {
  const { email } = req.user;

  res.json({
    email,
  });
};

const signUp = async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });
  if (user) {
    throw HttpError(409, `${email} already in use`);
  }

  const hashPassword = await bcrypt.hash(password, 10);
  const verificationToken = nanoid();

  const newUser = await User.create({
    ...req.body,
    password: hashPassword,
    verificationToken,
  });

  res.status(201).json({
    email: newUser.email,
  });
};

const signIn = async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });
  if (!user) {
    throw HttpError(401, "Email or password invalid");
  }

  const passwordCompare = await bcrypt.compare(password, user.password);
  if (!passwordCompare) {
    throw HttpError(401, "Email or password invalid");
  }

  const payload = {
    id: user._id,
  };

  const token = jwt.sign(payload, JWT_SECRET, { expiresIn: "23h" });
  await User.findByIdAndUpdate(user._id, { token });

  res.json({
    token,
  });
};

const signout = async (req, res) => {
  const { _id } = req.user;
  await User.findByIdAndUpdate(_id, { token: "" });

  res.json({
    message: "Signout success",
  });
};

export default {
  getCurrentUser: ctrlWrapper(getCurrentUser),
  signUp: ctrlWrapper(signUp),
  signIn: ctrlWrapper(signIn),
  signout: ctrlWrapper(signout),
};
