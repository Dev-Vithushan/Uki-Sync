import dbConnect from "../lib/dbConnect.js";
import { ApiError, requireAuth } from "../lib/auth.js";
import { methodNotAllowed, sanitizeUser, sendError } from "../lib/http.js";
import User from "../lib/models/User.js";

const ROLES = ["Admin", "Lecturer", "Student"];

export default async function handler(req, res) {
  if (methodNotAllowed(req, res, ["GET"])) {
    return;
  }

  try {
    await dbConnect();
    const authUser = requireAuth(req, ["Admin", "Lecturer"]);

    const roleFilter = req.query.role;
    const query = {};

    if (authUser.role === "Lecturer") {
      if (roleFilter && roleFilter !== "Student") {
        throw new ApiError("Lecturer can only view Student users", 403);
      }
      query.role = "Student";
    } else if (roleFilter) {
      if (!ROLES.includes(roleFilter)) {
        throw new ApiError("Invalid role filter", 400);
      }
      query.role = roleFilter;
    }

    const users = await User.find(query).sort({ createdAt: -1 });

    res.status(200).json({
      users: users.map((user) => sanitizeUser(user))
    });
  } catch (error) {
    sendError(res, error);
  }
}
