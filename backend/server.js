require("dotenv").config();
const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");

const authRoutes = require("./routes/auth");
const fileRoutes = require("./routes/files");

const app = express();

app.use(cors({ origin: "http://localhost:5173", credentials: true }));
app.use(express.json());

// Connect MongoDB and attach db to app.locals
connectDB().then((db) => {
  app.locals.db = db;

  // Routes
  app.use("/api/auth", authRoutes);
  app.use("/api/files", fileRoutes);

  app.listen(process.env.PORT, () => {
    console.log(`Server running on port ${process.env.PORT}`);
  });
}).catch((err) => {
  console.error("DB connection failed:", err);
  process.exit(1);
});