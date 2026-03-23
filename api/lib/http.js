import mongoose from "mongoose";
import { ApiError } from "./auth.js";

export function methodNotAllowed(req, res, methods) {
  if (!methods.includes(req.method)) {
    res.setHeader("Allow", methods);
    res.status(405).json({ message: `Method ${req.method} not allowed` });
    return true;
  }
  return false;
}

export function readBody(req) {
  if (req.body == null || req.body === "") {
    return {};
  }

  if (typeof req.body === "object") {
    return req.body;
  }

  try {
    return JSON.parse(req.body);
  } catch (_error) {
    throw new ApiError("Invalid JSON body", 400);
  }
}

export function ensureObjectId(id, fieldName = "id") {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ApiError(`Invalid ${fieldName}`, 400);
  }
}

export function sendError(res, error) {
  const statusCode = error.statusCode || 500;
  const message = error.message || "Internal Server Error";
  res.status(statusCode).json({ message });
}

export function sanitizeUser(userDoc) {
  const user = userDoc.toObject ? userDoc.toObject() : { ...userDoc };
  delete user.password;
  delete user.__v;
  return user;
}
