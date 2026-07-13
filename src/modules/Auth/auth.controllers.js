import express from "express";
import { signUp, login, confirmEmail } from "./auth.services.js";

const router = express.Router();

const runService = async (handler, req, res) => {
  try {
    await handler(req, res);
  } catch (error) {
    if (!res.headersSent) {
      res.status(500).json({
        error: error.message || "Request failed.",
      });
    }
  }
};

router.post("/signup", (req, res) => runService(signUp, req, res));
router.post("/login", (req, res) => runService(login, req, res));
router.post("/confirm-email", (req, res) => runService(confirmEmail, req, res));

export default router;
