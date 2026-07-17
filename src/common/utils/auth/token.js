import jwt from "jsonwebtoken";
import { randomUUID } from "node:crypto";
import { config } from "../../../DB/config/configServices.js";

export const generateAccessToken = (
  payload,
  // expiresIn = config.jwt.access_expiresIn,
) => {
  const jwtId = randomUUID();
  return jwt.sign(payload, config.jwt.access_key, { expiresIn:900, jwtid: jwtId });
};
export const generateRefreshToken = (
  payload,
  expiresIn = config.jwt.refresh_expiresIn,
) => {
  const jwtId = randomUUID();
  return jwt.sign(payload, config.jwt.refresh_key, {
    expiresIn,
    jwtid: jwtId,
  });
};

export const verifyRefreshToken = (token) => {
  try {
    return jwt.verify(token, config.jwt.refresh_key);
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      throw new Error("Token has expired");
    }
    if (error.name === "JsonWebTokenError") {
      throw new Error("Invalid token");
    }
    throw new Error("Token verification failed");
  }
};
export const verifyAccessToken = (token) => {
  try {
    return jwt.verify(token, config.jwt.access_key);
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      throw new Error("Token has expired");
    }
    if (error.name === "JsonWebTokenError") {
      throw new Error("Invalid token");
    }
    throw new Error("Token verification failed");
  }
};
export const createTokenPayload = (user) => {
  console.log(user.role);
  
  return {
    userId: user._id.toString(),
    email: user.email,
    sub: user.email,
    role: user.role,
  }; //sub: refers to the holder of the token
};

export const decodeToken = async ({ token } = {}) => {
  const decoded = jwt.decode(token);
  return decoded
};
export const extractTokenFromHeader = (authHeader) => {
  if (!authHeader.startsWith("bearer ")) {
    return null;
  }
  return authHeader.split(" ")[1];
};
export const baseRevokeToken = async (userId) => {
  return `${userId}::`;
};
export const revokeToken = async(userId, jti) => {
  return `${userId}::${jti}`;
};
