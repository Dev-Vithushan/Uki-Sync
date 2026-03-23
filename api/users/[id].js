import dbConnect from "../lib/dbConnect.js";
import { ApiError, requireAuth } from "../lib/auth.js";
import {
  ensureObjectId,
  methodNotAllowed,
  readBody,
  sanitizeUser,
  sendError
} from "../lib/http.js";
import User from "../lib/models/User.js";

const ROLES = ["Admin", "Lecturer", "Student"];

export default async function handler(req, res) {
  if (methodNotAllowed(req, res, ["GET", "PUT", "DELETE"])) {
    return;
  }

  try {
    await dbConnect();

    const authUser = requireAuth(req, ["Admin"]);

    const idParam = Array.isArray(req.query.id) ? req.query.id[0] : req.query.id;
    ensureObjectId(idParam, "user id");

    if (req.method === "GET") {
      const user = await User.findById(idParam);
      if (!user) {
        throw new ApiError("User not found", 404);
      }
      res.status(200).json({ user: sanitizeUser(user) });
      return;
    }

    if (req.method === "PUT") {
      const body = readBody(req);
      const user = await User.findById(idParam).select("+password");

      if (!user) {
        throw new ApiError("User not found", 404);
      }

      if (body.name !== undefined) {
        const nextName = String(body.name).trim();
        if (!nextName) {
          throw new ApiError("name cannot be empty", 400);
        }
        user.name = nextName;
      }

      if (body.email !== undefined) {
        const nextEmail = String(body.email).trim().toLowerCase();
        if (!nextEmail) {
          throw new ApiError("email cannot be empty", 400);
        }

        const emailOwner = await User.findOne({ email: nextEmail, _id: { $ne: user._id } });
        if (emailOwner) {
          throw new ApiError("Email already exists", 409);
        }
        user.email = nextEmail;
      }

      if (body.role !== undefined) {
        if (!ROLES.includes(body.role)) {
          throw new ApiError("Invalid role", 400);
        }
        user.role = body.role;
      }

      if (body.password !== undefined) {
        const nextPassword = String(body.password);
        if (nextPassword.length < 6) {
          throw new ApiError("password must be at least 6 characters", 400);
        }
        user.password = nextPassword;
      }

      await user.save();
      res.status(200).json({ user: sanitizeUser(user) });
      return;
    }

    if (authUser.userId === idParam) {
      throw new ApiError("You cannot delete your own admin account", 400);
    }

    const deleted = await User.findByIdAndDelete(idParam);

    if (!deleted) {
      throw new ApiError("User not found", 404);
    }

    res.status(200).json({ message: "User deleted" });
  } catch (error) {
    sendError(res, error);
  }
}
