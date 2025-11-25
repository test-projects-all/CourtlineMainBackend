// routes/auth.js
import express from "express";
import { authMiddleware } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/me", authMiddleware, (req, res) => {
  res.json({ authenticated: true, user: req.user });
});

export default router;
