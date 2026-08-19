const express = require("express");
const multer = require("multer");
const cloudinary = require("../config/cloudinary");
const { ObjectId } = require("mongodb");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

// Multer — store file in memory before pushing to Cloudinary
const storage = multer.memoryStorage();
const upload = multer({ storage });

// ── UPLOAD ──────────────────────────────────────────────
router.post("/upload", authMiddleware, upload.single("file"), async (req, res) => {
  const db = req.app.locals.db;
  const { parentId } = req.body;

  try {
    const file = req.file;

    // Upload to Cloudinary using buffer
    const uploadResult = await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          resource_type: "auto", // handles images, videos, pdfs, etc
          folder: "driveapp",    // organizes files in Cloudinary
          public_id: `${Date.now()}-${file.originalname}`,
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      );
      stream.end(file.buffer);
    });

    // Save metadata to MongoDB
    const fileDoc = {
      ownerId: new ObjectId(req.user.userId),
      name: file.originalname,
      type: "file",
      mimeType: file.mimetype,
      size: file.size,
      parentId: parentId ? new ObjectId(parentId) : null,
      storageKey: uploadResult.public_id,   // Cloudinary public_id
      fileUrl: uploadResult.secure_url,      // direct URL
      isTrashed: false,
      isStarred: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await db.collection("files").insertOne(fileDoc);

    // Update user's storageUsed
    await db.collection("users").updateOne(
      { _id: new ObjectId(req.user.userId) },
      { $inc: { storageUsed: file.size } }
    );

    res.status(201).json({
      message: "File uploaded successfully",
      file: { ...fileDoc, _id: result.insertedId },
    });

  } catch (err) {
    console.error("Upload error:", err);
    res.status(500).json({ error: "Upload failed" });
  }
});

// ── LIST FILES (My Drive) ────────────────────────────────
router.get("/", authMiddleware, async (req, res) => {
  const db = req.app.locals.db;
  const { parentId } = req.query;

  try {
    const query = {
      ownerId: new ObjectId(req.user.userId),
      isTrashed: false,
      parentId: parentId ? new ObjectId(parentId) : null,
    };

    const files = await db.collection("files")
      .find(query)
      .sort({ createdAt: -1 })
      .toArray();

    res.json({ files });

  } catch (err) {
    console.error("List files error:", err);
    res.status(500).json({ error: "Failed to fetch files" });
  }
});

// ── RECENT FILES ─────────────────────────────────────────
router.get("/recent", authMiddleware, async (req, res) => {
  const db = req.app.locals.db;

  try {
    const files = await db.collection("files")
      .find({
        ownerId: new ObjectId(req.user.userId),
        isTrashed: false,
      })
      .sort({ updatedAt: -1 })
      .limit(20)
      .toArray();

    res.json({ files });

  } catch (err) {
    console.error("Recent files error:", err);
    res.status(500).json({ error: "Failed to fetch recent files" });
  }
});

// ── SHARED FILES ─────────────────────────────────────────
router.get("/shared", authMiddleware, async (req, res) => {
  const db = req.app.locals.db;

  try {
    // Find all shares where current user is the recipient
    const shares = await db.collection("shares")
      .find({ sharedWith: new ObjectId(req.user.userId) })
      .toArray();

    const fileIds = shares.map((s) => s.fileId);

    const files = await db.collection("files")
      .find({ _id: { $in: fileIds }, isTrashed: false })
      .toArray();

    // Attach sharedBy info to each file
    const result = files.map((file) => {
      const share = shares.find((s) => s.fileId.equals(file._id));
      return { ...file, sharedBy: share.ownerId, sharedAt: share.createdAt };
    });

    res.json({ files: result });

  } catch (err) {
    console.error("Shared files error:", err);
    res.status(500).json({ error: "Failed to fetch shared files" });
  }
});

// ── TRASH (soft delete) ───────────────────────────────────
router.patch("/trash/:id", authMiddleware, async (req, res) => {
  const db = req.app.locals.db;

  try {
    await db.collection("files").updateOne(
      {
        _id: new ObjectId(req.params.id),
        ownerId: new ObjectId(req.user.userId),
      },
      {
        $set: { isTrashed: true, trashedAt: new Date() },
      }
    );

    res.json({ message: "File moved to trash" });

  } catch (err) {
    console.error("Trash error:", err);
    res.status(500).json({ error: "Failed to move file to trash" });
  }
});

// ── GET TRASHED FILES ─────────────────────────────────────
router.get("/trash", authMiddleware, async (req, res) => {
  const db = req.app.locals.db;

  try {
    const files = await db.collection("files")
      .find({
        ownerId: new ObjectId(req.user.userId),
        isTrashed: true,
      })
      .sort({ trashedAt: -1 })
      .toArray();

    res.json({ files });

  } catch (err) {
    console.error("Trash list error:", err);
    res.status(500).json({ error: "Failed to fetch trash" });
  }
});

// ── RESTORE FROM TRASH ────────────────────────────────────
router.patch("/restore/:id", authMiddleware, async (req, res) => {
  const db = req.app.locals.db;

  try {
    await db.collection("files").updateOne(
      {
        _id: new ObjectId(req.params.id),
        ownerId: new ObjectId(req.user.userId),
      },
      {
        $set: { isTrashed: false, trashedAt: null },
      }
    );

    res.json({ message: "File restored" });

  } catch (err) {
    console.error("Restore error:", err);
    res.status(500).json({ error: "Failed to restore file" });
  }
});

// ── PERMANENT DELETE ──────────────────────────────────────
router.delete("/:id", authMiddleware, async (req, res) => {
  const db = req.app.locals.db;

  try {
    // Find file first to get storageKey
    const file = await db.collection("files").findOne({
      _id: new ObjectId(req.params.id),
      ownerId: new ObjectId(req.user.userId),
    });

    if (!file) return res.status(404).json({ error: "File not found" });

    // Delete from Cloudinary
    await cloudinary.uploader.destroy(file.storageKey, {
      resource_type: "auto",
    });

    // Delete from MongoDB
    await db.collection("files").deleteOne({ _id: new ObjectId(req.params.id) });

    // Update storageUsed
    await db.collection("users").updateOne(
      { _id: new ObjectId(req.user.userId) },
      { $inc: { storageUsed: -file.size } }
    );

    res.json({ message: "File permanently deleted" });

  } catch (err) {
    console.error("Delete error:", err);
    res.status(500).json({ error: "Failed to delete file" });
  }
});

module.exports = router;