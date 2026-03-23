import dbConnect from "../lib/dbConnect.js";
import { ApiError, requireAuth } from "../lib/auth.js";
import { methodNotAllowed, sanitizeUser, sendError } from "../lib/http.js";
import User from "../lib/models/User.js";

export default async function handler(req, res) {
  if (methodNotAllowed(req, res, ["GET"])) {
    return;
  }

  try {
    await dbConnect();
    const authUser = requireAuth(req);

    const user = await User.findById(authUser.userId);

    if (!user) {
      throw new ApiError("User not found", 404);
    }

    res.status(200).json({ user: sanitizeUser(user) });
  } catch (error) {
    sendError(res, error);
  }
}
