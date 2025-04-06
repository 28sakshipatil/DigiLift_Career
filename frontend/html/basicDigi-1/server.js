const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const multer = require("multer");
const fs = require("fs");
const Tesseract = require("tesseract.js");

const app = express();
app.use(express.json());
app.use(cors());

const PORT = 5000;

// ✅ MongoDB Connection with Debug Logs
mongoose.connect(
    "mongodb://localhost:27017/",
    { useNewUrlParser: true, useUnifiedTopology: true }
)
    .then(() => console.log("✅ MongoDB Connected Successfully"))
    .catch(err => console.error("❌ MongoDB Connection Error:", err));

const userSchema = new mongoose.Schema({
    aadhaar: String,
    phone: String,
    password: String,
    role: String
});

const documentSchema = new mongoose.Schema({
    filename: String,
    fileUrl: String,
    uploadedBy: String,
    extractedText: String,
    label: String,  // ✅ New field for document labeling
    uploadedAt: { type: Date, default: Date.now } // ✅ Timestamp for history tracking
});

const User = mongoose.model("UserDIGI", userSchema);
const Document = mongoose.model("DocumentDIGI", documentSchema);

const predefinedAdmin = {
    aadhaar: "000000000000",
    phone: "9999999999",
    password: "admin123",
    role: "admin"
};


// ✅ User Login with Debug Logs
app.post("/login", async (req, res) => {
    try {
        console.log("🔹 Login Attempt:", req.body);
        const { aadhaar, password } = req.body;

        if (aadhaar === predefinedAdmin.aadhaar && password === predefinedAdmin.password) {
            console.log("✅ Admin Logged In");
            return res.json({ token: "admin-token", role: "admin" });
        }

        const user = await User.findOne({ aadhaar });
        if (!user) {
            console.warn("❌ Login Failed: User Not Found");
            return res.status(400).json({ message: "Invalid Credentials" });
        }

        if (!(await bcrypt.compare(password, user.password))) {
            console.warn("❌ Login Failed: Incorrect Password");
            return res.status(400).json({ message: "Invalid Credentials" });
        }

        console.log("✅ Citizen Logged In:", user.aadhaar);
        res.json({ token: "user-token", role: "citizen", aadhaar: user.aadhaar });
    } catch (error) {
        console.error("❌ Error in /login:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
});

// ✅ User Sign-Up with Debug Logs
app.post("/signup", async (req, res) => {
    try {
        console.log("🔹 Sign-Up Attempt:", req.body);
        const { aadhaar, phone, password, role } = req.body;

        if (role === "admin") {
            console.warn("❌ Admin Sign-Up Blocked");
            return res.status(403).json({ message: "Admin sign-up is not allowed." });
        }

        const existingUser = await User.findOne({ aadhaar });
        if (existingUser) {
            console.warn("❌ Sign-Up Failed: User Already Exists");
            return res.status(400).json({ message: "User already exists" });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = new User({ aadhaar, phone, password: hashedPassword, role });
        await newUser.save();

        console.log("✅ User Registered Successfully:", aadhaar);
        res.json({ message: "User Registered Successfully" });
    } catch (error) {
        console.error("❌ Error in /signup:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
});

// ✅ Multer Storage for File Uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        if (!fs.existsSync("uploads")) fs.mkdirSync("uploads");
        cb(null, "uploads/");
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + "-" + file.originalname);
    }
});
const upload = multer({ storage });

// ✅ Upload Document & Extract Text with Debug Logs
app.post("/upload", upload.single("file"), async (req, res) => {
    try {
        console.log("🔹 File Upload Attempt:", req.file.filename);
        const { uploadedBy, label } = req.body; // ✅ Label is now correctly extracted

        if (!label) {
            return res.status(400).json({ message: "Label is required" });
        }

        const extractedText = await Tesseract.recognize(req.file.path, "eng")
            .then(({ data: { text } }) => text)
            .catch(err => {
                console.error("❌ OCR Error:", err);
                return "";
            });

        const newDocument = new Document({
            filename: req.file.filename,
            fileUrl: `http://localhost:5000/uploads/${req.file.filename}`,
            uploadedBy,
            extractedText,
            label, // ✅ Store the label in MongoDB
        });

        await newDocument.save();
        console.log("✅ File Uploaded & Labeled:", label);
        res.json({ message: "File Uploaded", extractedText });
    } catch (error) {
        console.error("❌ Error in /upload:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
});


// ✅ Get All Documents for Admin
app.get("/documents", async (req, res) => {
    try {
        console.log("🔹 Fetching All Documents...");
        const documents = await Document.find();
        res.json(documents);
    } catch (error) {
        console.error("❌ Error in /documents:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
});

// ✅ Get User Documents
app.get("/documents/:aadhaar", async (req, res) => {
    try {
        console.log("🔹 Fetching Documents for Aadhaar:", req.params.aadhaar);
        const documents = await Document.find({ uploadedBy: req.params.aadhaar });
        res.json(documents);
    } catch (error) {
        console.error("❌ Error in /documents/:aadhaar:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
});

// ✅ Delete Document (Admin)
app.delete("/delete/:id", async (req, res) => {
    try {
        const document = await Document.findById(req.params.id);
        if (!document) return res.status(404).json({ message: "Document not found" });

        await Document.findByIdAndDelete(req.params.id);
        res.json({ message: "Document Deleted" });
    } catch (error) {
        console.error("Error deleting document:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
});


// ✅ Rename File API
app.put("/rename/:id", async (req, res) => {
    const { newFilename } = req.body;
    const doc = await Document.findById(req.params.id);
    if (!doc) return res.status(404).json({ message: "Document not found" });

    const oldPath = `uploads/${doc.filename}`;
    const newPath = `uploads/${newFilename}`;

    fs.rename(oldPath, newPath, async (err) => {
        if (err) return res.status(500).json({ message: "Error renaming file" });

        doc.filename = newFilename;
        doc.fileUrl = `http://localhost:5000/uploads/${newFilename}`;
        await doc.save();
        res.json({ message: "File renamed successfully" });
    });
});

// ✅ Serve Uploads
app.use("/uploads", express.static("uploads"));

// ✅ Start Server with Debug Log
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
