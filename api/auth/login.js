import dbConnect from "../lib/dbConnect.js";
import { ApiError, signToken } from "../lib/auth.js";
import { methodNotAllowed, readBody, sanitizeUser, sendError } from "../lib/http.js";
import User from "../lib/models/User.js";

export default async function handler(req, res) {
  if (methodNotAllowed(req, res, ["POST"])) {
    return;
  }

  try {
    await dbConnect();

    const body = readBody(req);
    const email = (body.email || "").trim().toLowerCase();
    const password = body.password || "";

    if (!email || !password) {
      throw new ApiError("email and password are required", 400);
    }

    const user = await User.findOne({ email }).select("+password");

    if (!user) {
      throw new ApiError("Invalid email or password", 401);
    }

    const passwordMatches = await user.matchPassword(password);

    if (!passwordMatches) {
      throw new ApiError("Invalid email or password", 401);
    }

    const token = signToken(user);

    res.status(200).json({
      token,
      user: sanitizeUser(user)
    });
  } catch (error) {
    sendError(res, error);
  }
}
