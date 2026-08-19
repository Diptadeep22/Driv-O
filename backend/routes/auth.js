const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { ObjectId } = require("mongodb");

const router = express.Router();

// ── SIGNUP ──────────────────────────────────────────────
router.post("/signup", async (req, res) => {
  const db = req.app.locals.db;
  const { name, email, password } = req.body;

  try {
    // Check if user already exists
    const existingUser = await db.collection("users").findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: "Email already registered" });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Insert user
    const result = await db.collection("users").insertOne({
      name,
      email,
      passwordHash,
      storageUsed: 0,
      storageLimit: 15368709120, // 15GB in bytes
      createdAt: new Date(),
    });

    // Generate JWT
    const token = jwt.sign(
      { userId: result.insertedId.toString(), email },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.status(201).json({
      message: "Account created successfully",
      token,
      user: {
        id: result.insertedId,
        name,
        email,
      },
    });

  } catch (err) {
    console.error("Signup error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ── LOGIN ───────────────────────────────────────────────
router.post("/login", async (req, res) => {
  const db = req.app.locals.db;
  const { email, password } = req.body;

  try {
    // Find user
    const user = await db.collection("users").findOne({ email });
    if (!user) {
      return res.status(400).json({ error: "Invalid email or password" });
    }

    // Check password
    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(400).json({ error: "Invalid email or password" });
    }

    // Generate JWT
    const token = jwt.sign(
      { userId: user._id.toString(), email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({
      message: "Login successful",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
      },
    });

  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;