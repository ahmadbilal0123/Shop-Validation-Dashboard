import express from "express";
import { 
  registerUser, 
  loginUser, 
  getUsers, 
  getAllUsers, 
  updateUser, 
  getAssignedShopsForAuditor 
} from "../controllers/user.controller.js";
import { protect } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.post("/login", loginUser);

// Admin creates admin via Postman, so no auth on this route:
router.post("/admin-create", registerUser);

// Protected route to create other users
router.post("/register", protect, registerUser);

// Get users routes
router.post("/get-users", protect, getUsers);
router.get("/get-all-users", protect, getAllUsers);

// Update user
router.put("/update-user/:id", protect, updateUser);

// Get assigned shops for auditor
router.get("/get-assigned-shops-for-auditor/:auditorId", protect, getAssignedShopsForAuditor);

export default router;
