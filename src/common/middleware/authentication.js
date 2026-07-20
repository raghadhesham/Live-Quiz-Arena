import { userModel } from "../../DB/models/user.model.js";
import { getRedisValue } from "../../DB/redis/redis.services.js";
import { findById } from "../../DB/repository/database.repository.js";
import {
  extractTokenFromHeader,
  revokeToken,
  verifyAccessToken,
} from "../utils/auth/token.js";

const getSocketToken = (socket) => {
  const auth = socket.handshake.auth || {};
  const authHeader =
    auth.authorization || auth.token || socket.handshake.headers.authorization;
  if (!authHeader) {
    return null;
  }
  const token = extractTokenFromHeader(authHeader);
  return token || authHeader;
};

export const authenticate = async (req, res, next) => {
  try {
    const token = extractTokenFromHeader(req.headers.authorization);
    if (!token) {
      return res.status(401).json({
        message: "Access denied. No token provided.",
      });
    }

    const decoded = verifyAccessToken(token);
    req.userId = decoded.userId;
    req.role = decoded.role;
    req.userEmail = decoded.email;
    req.user = decoded; // Full decoded token

    const key = await revokeToken(req.userId, decoded.jti);
    const user = await findById({
      model: userModel,
      id: req.userId,
    });
    if (!user) {
      throw new Error("user doesn't exist");
    }

    if (user.changeCredential?.getTime() > decoded.iat * 1000) {
      throw new Error("invalid token");
    }
    const revokedToken = await getRedisValue(key);
    if (revokedToken) {
      throw new Error("Token has been revoked");
    }

    next();
  } catch (error) {
    return res.status(401).json({
      message: "Invalid or expired token",
      error: error.message,
    });
  }
};

export const authenticateSocket = async (socket, next) => {
  try {
    const token = getSocketToken(socket);
    if (!token) {
      return next(new Error("Access denied. No token provided."));
    }

    const decoded = verifyAccessToken(token);
    const key = await revokeToken(decoded.userId, decoded.jti);
    const user = await findById({
      model: userModel,
      id: decoded.userId,
    });
    if (!user) {
      throw new Error("user doesn't exist");
    }

    if (user.changeCredential?.getTime() > decoded.iat * 1000) {
      throw new Error("invalid token");
    }
    const revokedToken = await getRedisValue(key);
    if (revokedToken) {
      throw new Error("Token has been revoked");
    }

    socket.user = decoded;
    socket.userId = decoded.userId;
    socket.role = decoded.role;
    next();
  } catch (error) {
    next(new Error(`Unauthorized: ${error.message}`));
  }
};
