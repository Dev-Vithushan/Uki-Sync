import dbConnect from "../lib/dbConnect.js";
import { ApiError, requireAuth } from "../lib/auth.js";
import { methodNotAllowed, readBody, sanitizeUser, sendError } from "../lib/http.js";
import User from "../lib/models/User.js";

const ROLES = ["Admin", "Lecturer", "Student"];

export default async function handler(req, res) {
  if (methodNotAllowed(req, res, ["POST"])) {
    return;
  }

  try {
    await dbConnect();

    const usersCount = await User.countDocuments();
    const isBootstrap = usersCount === 0;
    let authUser = null;

    if (!isBootstrap) {
      authUser = requireAuth(req, ["Admin", "Lecturer"]);
    }

    const body = readBody(req);
    const name = (body.name || "").trim();
    const email = (body.email || "").trim().toLowerCase();
    const password = body.password || "";

    if (!name || !email || !password) {
      throw new ApiError("name, email, and password are required", 400);
    }

    if (password.length < 6) {
      throw new ApiError("password must be at least 6 characters", 400);
    }

    const requestedRole = ROLES.includes(body.role) ? body.role : "Student";
    let role = requestedRole;

    if (isBootstrap) {
      role = "Admin";
    } else if (authUser?.role === "Lecturer") {
      if (requestedRole !== "Student") {
        throw new ApiError("Lecturer can only create Student users", 403);
      }
      role = "Student";
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      throw new ApiError("Email already exists", 409);
    }

    const user = await User.create({
      name,
      email,
      password,
      role
    });

    res.status(201).json({
      message: isBootstrap ? "Bootstrap admin created" : "User created",
      user: sanitizeUser(user)
    });
  } catch (error) {
    sendError(res, error);
  }
}
