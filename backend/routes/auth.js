const express = require("express");
const passport = require("passport");
const User = require("../models/user");
require("dotenv").config();

const router = express.Router();

// Admin credentials from .env
const ADMIN_CREDENTIALS = {
  username: process.env.ADMIN_USERNAME,
  password: process.env.ADMIN_PASSWORD,
  role: "admin",
};

// Signup Route (Only for Doctors & Patients)
router.post("/signup", async (req, res) => {
  const { username, email, password, role } = req.body;
  if (role === "admin") return res.status(403).json({ message: "Cannot register as admin" });

  try {
    const user = new User({ username, email, role });
    await User.register(user, password);
    res.status(201).json({ message: "User registered successfully" });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Login Route (for Admin, Doctor, Patient)
router.post("/login", (req, res, next) => {
  const { username, password, role } = req.body;

  console.log("Received login request:", username, password, role);
  console.log("ENV Admin:", process.env.ADMIN_USERNAME, process.env.ADMIN_PASSWORD, process.env.ADMIN_ID);

  if (
    username === process.env.ADMIN_USERNAME &&
    password === process.env.ADMIN_PASSWORD &&
    role === "admin"
  ) {
    const adminUser = {
      id: process.env.ADMIN_ID, // Taking ID from .env
      username,
      role: "admin",
    };

    req.logIn(adminUser, (err) => {
      if (err) return res.status(500).json({ error: err.message });
      console.log("Admin logged in:", adminUser);
      return res.json({ user: adminUser });
    });
  } else {
    passport.authenticate("local", (err, user, info) => {
      if (err) return res.status(500).json({ error: err.message });
      if (!user) return res.status(401).json({ error: "Invalid username or password" });

      if (user.role !== role) {
        return res.status(403).json({ error: "Role mismatch" });
      }

      req.logIn(user, (err) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ user });
      });
    })(req, res, next);
  }
});


router.get("/logout", (req, res) => {
  req.logout(() => {
    res.clearCookie("connect.sid"); // Clear session cookie (if using sessions)
    res.json({ message: "Logged out successfully" });
  });
});


module.exports = router;
