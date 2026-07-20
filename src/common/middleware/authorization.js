export const authorize =
  (...allowedRoles) =>
  (req, res, next) => {
    if (!req.role || !allowedRoles.includes(req.role)) {
      return res.status(403).json({
        message: "Forbidden: insufficient permissions.",
      });
    }
    next();
  };

export const authorizeSocket =
  (...allowedRoles) =>
  (socket, next) => {
    if (!socket.role || !allowedRoles.includes(socket.role)) {
      return next(new Error("Forbidden: insufficient permissions."));
    }
    next();
  };
