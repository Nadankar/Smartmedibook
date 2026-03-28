import jwt from "jsonwebtoken";

export const signJwt = (payload) => {
  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "30d",
  });
};

export const verifyJwt = (token) => {
  return jwt.verify(token, process.env.JWT_SECRET);
}; 