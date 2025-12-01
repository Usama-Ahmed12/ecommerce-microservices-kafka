const express = require("express");
const router = express.Router();
const { authenticate } = require("../middleware/authMiddleware");
const { getUserProfile, deleteUser } = require("../controllers/userController");

//  Profile route (Protected)
router.get("/profile", authenticate, getUserProfile);

//  User khud apna account delete kare
router.delete("/delete", authenticate, deleteUser);

//  Admin kisi bhi user ko delete kare (email ke sath)
router.delete("/delete/:id", authenticate, deleteUser);

module.exports = router;
