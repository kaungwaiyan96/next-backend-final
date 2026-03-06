import jwt from "jsonwebtoken";
import { NextResponse } from "next/server";

const JWT_SECRET = process.env.JWT_SECRET || "mydefaulyjwtsecret";

export function verifyToken(req) {
  const token = req.cookies.get("token")?.value;
  if (!token) return null;
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (err) {
    return null;
  }
}

export function authResponse(req, allowedRoles = []) {
  const decoded = verifyToken(req);
  if (!decoded) {
    return {
      error: NextResponse.json({ message: "Unauthorized" }, { status: 401 }),
    };
  }
  if (allowedRoles.length > 0 && !allowedRoles.includes(decoded.role)) {
    return {
      error: NextResponse.json({ message: "Forbidden" }, { status: 403 }),
    };
  }
  return { user: decoded };
}
