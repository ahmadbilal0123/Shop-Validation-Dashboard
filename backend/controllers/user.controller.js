// controllers/user.controller.js
import User from "../models/user.model.js";
import { generateToken } from "../utils/generateToken.js";

export const registerUser = async (req, res) => {
  const { name, username, email, password, role } = req.body;

  const creatorRole = req.user?.role || "admin"; // In case of initial admin-create

  const roleHierarchy = {
    admin: ["admin", "manager", "supervisor", "executive", "auditor"],
    manager: ["supervisor", "executive", "auditor"],
    supervisor: ["executive", "auditor"],
    executive: ["auditor"],
    user: [],
  };

  if (!roleHierarchy[creatorRole].includes(role)) {
    return res.status(403).json({ message: `You can't create role: ${role}` });
  }

  const userExists = await User.findOne({ username });
  if (userExists)
    return res.status(400).json({ message: "Username already taken" });

  const user = await User.create({ name, username, email, password, role });
  res.status(201).json({
    _id: user._id,
    name: user.name,
    username: user.username,
    role: user.role,
    token: generateToken(user),
  });
};

export const loginUser = async (req, res) => {
  try {
    const { username, password } = req.body;

    // Validate request body
    if (!username || !password) {
      return res.status(400).json({ message: "Username and password are required" });
    }

    // Find user
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(401).json({ message: "Invalid username or password" });
    }

    // Check password
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid username or password" });
    }

    // Successful login
    res.status(200).json({
      _id: user._id,
      name: user.name,
      username: user.username,
      role: user.role,
      token: generateToken(user),
    });
  } catch (error) {
    console.error("Error logging in:", error);
    res.status(500).json({ message: "Server error. Please try again later." });
  }
};

// Get all users (for admin/manager user management)
export const getUsers = async (req, res) => {
  try {
    const users = await User.find().select("-password");
    res.status(200).json({
      message: "Users fetched successfully",
      count: users.length,
      data: users,
    });
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ message: "Error fetching users", error: error.message });
  }
};

// Get all users (alternative endpoint)
export const getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select("-password");
    res.status(200).json({
      message: "Users fetched successfully",
      count: users.length,
      data: users,
    });
  } catch (error) {
    console.error("Error fetching all users:", error);
    res.status(500).json({ message: "Error fetching all users", error: error.message });
  }
};

// Update user
export const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // Remove password from updates if it's empty
    if (updates.password === "") {
      delete updates.password;
    }

    const user = await User.findByIdAndUpdate(id, updates, { new: true }).select("-password");
    
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({
      message: "User updated successfully",
      data: user,
    });
  } catch (error) {
    console.error("Error updating user:", error);
    res.status(500).json({ message: "Error updating user", error: error.message });
  }
};

// Get assigned shops for auditor
export const getAssignedShopsForAuditor = async (req, res) => {
  try {
    const { auditorId } = req.params;
    
    // Import Shop model
    const Shop = (await import("../models/shop.model.js")).default;
    
    const assignedShops = await Shop.find({ assignedTo: auditorId });
    
    res.status(200).json({
      message: "Assigned shops fetched successfully",
      count: assignedShops.length,
      data: assignedShops,
    });
  } catch (error) {
    console.error("Error fetching assigned shops:", error);
    res.status(500).json({ message: "Error fetching assigned shops", error: error.message });
  }
};
