import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  throw new Error("JWT_SECRET is not defined. Set it in your environment variables.");
}

export class ApiError extends Error {
  constructor(message, statusCode = 500) {
    super(message);
    this.statusCode = statusCode;
  }
}

export function signToken(user) {
  return jwt.sign(
    {
      userId: user._id.toString(),
      role: user.role,
      email: user.email
    },
    JWT_SECRET,
    { expiresIn: "7d" }
  );
}

export function requireAuth(req, allowedRoles = []) {
  const authHeader = req.headers.authorization || req.headers.Authorization;

  if (!authHeader || typeof authHeader !== "string" || !authHeader.startsWith("Bearer ")) {
    throw new ApiError("Unauthorized", 401);
  }

  const token = authHeader.slice(7).trim();

  if (!token) {
    throw new ApiError("Unauthorized", 401);
  }

  let decoded;
  try {
    decoded = jwt.verify(token, JWT_SECRET);
  } catch (_error) {
    throw new ApiError("Invalid token", 401);
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(decoded.role)) {
    throw new ApiError("Forbidden", 403);
  }

  return decoded;
}
