import { create, findById, findOne } from "../../DB/database.repository.js";
import { getRedisValue } from "../../DB/redis/redis.services.js";
import { revokeTokenModel } from "../../models/revokeToken.model.js";
import { userModel } from "../../models/user.model.js";
import {
  extractTokenFromHeader,
  revokeToken,
  verifyAccessToken,
} from "../utils/auth/token.js";

export const authenticate = async (req, res, next) => {
  try {
    // Extract token from header
    const token = extractTokenFromHeader(req.headers.authorization);
    if (!token) {
      return res.status(401).json({
        message: "Access denied. No token provided.",
      });
    }
    // Verify token
    // Attach user info to request
    const decoded = verifyAccessToken(token);
    req.userId = decoded.userId;
    req.role = decoded.role;
    req.userEmail = decoded.email;
    req.user = decoded; // Full decoded token
    // console.log(decoded);
    const key = await revokeToken(req.userId, decoded.jti);
    // console.log(key);

    const user = await findById({
      model: userModel,
      id: req.userId,
    });
    if (!user) {
      throw new Error("user doesn't exist");
    }
    //e7na lma elmethod logOut tget called, bncareat document fe revoketoken model feha eltokenId, so? law la2ena eltoken dah def elmodel yeb2a howa 3amal log out fa keda baz (revoked)

    if (user.changeCredential?.getTime() > decoded.iat * 1000) {
      throw new Error("invalid token");
    } //change credential btrga3 date in days fa get time btrga3 in milliseconds, w iat btrga3 in seconds, 3shan kda darabt iat * 1000 3shan a7awlo l milliseconds
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
