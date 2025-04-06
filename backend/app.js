import express from "express";
import dotenv from "dotenv";
import mongoose from "mongoose";
import cors from "cors";
import bcrypt from "bcrypt";
import { CounselorModel, UserModel, VideoModel, FeedbackModel,CounselingRequestModel } from "./model.js"; // Ensure all models are imported
import path from "path";
import { fileURLToPath } from "url";
// const fs = require("fs");
// const Tesseract = require("tesseract.js");
dotenv.config();
import fs from "fs";
import Tesseract from "tesseract.js";
import multer from "multer";
import { exec } from "child_process";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


const app = express();

app.use(cors());
app.use(express.json());

// Middleware: To log incoming requests
app.use((req, res, next) => {
  console.log(req.method, req.path);
  next();
});

const MONGO_URI = process.env.MONGO_URI;
const port = process.env.PORT || 4000;

// Root route
app.get("/", (req, res) => {
  res.status(200).json({ message: "Hello World" });
});

// User registration endpoint
// app.post("/user/register", async (req, res) => {
//   const { name, email, password, username } = req.body;
//   if (!name || !email || !password || !username) {
//     res.status(400).json({ message: "All fields are required" });
//     return;
//   }
//   if (password.length < 6) {
//     res.status(400).json({ message: "Password must be at least 6 characters" });
//     return;
//   }

//   try {
//     const existingUser = await UserModel.findOne({ $or: [{ email }, { username }] });
//     if (existingUser) {
//       res.status(400).json({ message: "User already exists" });
//       return;
//     }

//     // Hash the password before storing it
//     const hashedPassword = await bcrypt.hash(password, 10);

//     await UserModel.create({ name, email, password: hashedPassword, username });
//     res.status(200).json({ message: "User registered" });
//   } catch (error) {
//     console.error("Error during registration:", error);
//     res.status(500).json({ message: "Internal server error" });
//   }
// });


// ✅ **Student Registration Endpoint**
app.post("/student/register", async (req, res) => {
  const { name, email, password, username } = req.body;

  if (!name || !email || !password || !username) {
    return res.status(400).json({ message: "All fields are required" });
  }

  if (password.length < 6) {
    return res.status(400).json({ message: "Password must be at least 6 characters" });
  }

  try {
    const existingUser = await UserModel.findOne({ $or: [{ email }, { username }] });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    await UserModel.create({ name, email, password: hashedPassword, username });

    res.status(201).json({ message: "Student registered successfully!" });
  } catch (error) {
    console.error("Error during student registration:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

app.post("/student/login", async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ message: "All fields are required" });
  }

  try {
    const user = await UserModel.findOne({ username });

    if (!user) {
      return res.status(400).json({ message: "Student not found" });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(400).json({ message: "Invalid password" });
    }

    res.json({
      message: "Login successful!",
      userID: user._id.toString(),
      name: user.name,       // Include name
      email: user.email      // Include email
    });

  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});



// User login endpoint
// app.post("/user/login", async (req, res) => {
//   const { username, password } = req.body;
//   if (!username || !password) {
//     res.status(400).json({ message: "All fields are required" });
//     return;
//   }

//   try {
//     const user = await UserModel.findOne({ username });

//     if (!user) {
//       res.status(400).json({ message: "User not found" });
//       return;
//     }

//     // Check the password using bcrypt
//     const isPasswordValid = await bcrypt.compare(password, user.password);
//     if (!isPasswordValid) {
//       res.status(400).json({ message: "Invalid password" });
//       return;
//     }

//     // Return user ID upon successful login
//     res.status(200).json({ message: "Login successful", userId: user._id });
//   } catch (error) {
//     console.error("Error during login:", error);
//     res.status(500).json({ message: "Internal server error" });
//   }
// });

// Endpoint to store aptitude test results
// app.post("/user/save-result", async (req, res) => {
//   const { userId, testResult } = req.body;

//   if (!userId || !testResult) {
//     res.status(400).json({ message: "User ID and test result are required" });
//     return;
//   }

//   try {
//     const user = await UserModel.findById(userId);
//     if (!user) {
//       res.status(404).json({ message: "User not found" });
//       return;
//     }

//     // Update user's test result
//     user.test_result = testResult;
//     await user.save();

//     res.status(200).json({ message: "Test result saved successfully" });
//   } catch (error) {
//     console.error("Error saving test result:", error);
//     res.status(500).json({ message: "Internal server error" });
//   }
// });

// // Endpoint to check if a user has submitted a test result
// app.get('/user/test-submission/:userId', async (req, res) => {
//   const userId = req.params.userId;

//   try {
//     const user = await UserModel.findById(userId);
//     if (!user) {
//       return res.status(404).json({ message: "User not found" });
//     }

//     const userTestRecord = user.test_result;
//     res.json({ hasSubmitted: !!userTestRecord });
//   } catch (error) {
//     console.error("Error checking test submission:", error);
//     res.status(500).json({ message: "Internal server error" });
//   }
// });

//COUNSELOR ENDPOINTS /////

// Counselor registration endpoint
app.post("/counselor/register", async (req, res) => {
  const { name, email, password, username, highestQualification, experience } = req.body;
  if (!name || !email || !password || !username || !highestQualification || !experience) {
    res.status(400).json({ message: "All fields are required" });
    return;
  }
  if (password.length < 6) {
    res.status(400).json({ message: "Password must be at least 6 characters" });
    return;
  }

  try {
    const existingCounselor = await CounselorModel.findOne({ $or: [{ email }, { username }] });
    if (existingCounselor) {
      res.status(400).json({ message: "Counselor already exists" });
      return;
    }

    // Hash the password before storing it
    const hashedPassword = await bcrypt.hash(password, 10);

    await CounselorModel.create({
      name,
      email,
      password: hashedPassword,
      username,
      highestQualification,
      experience,
    });
    res.status(200).json({ message: "Counselor registered" });
  } catch (error) {
    console.error("Error during registration:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// // Counselor login endpoint
// app.post("/counselor/login", async (req, res) => {
//   const { username, password } = req.body;
//   if (!username || !password) {
//     res.status(400).json({ message: "All fields are required" });
//     return;
//   }

//   try {
//     const counselor = await CounselorModel.findOne({ username });

//     if (!counselor) {
//       res.status(400).json({ message: "Counselor not found" });
//       return;
//     }

//     // Check the password using bcrypt
//     const isPasswordValid = await bcrypt.compare(password, counselor.password);
//     if (!isPasswordValid) {
//       res.status(400).json({ message: "Invalid password" });
//       return;
//     }

//     // Return counselor ID upon successful login
//     res.status(200).json({ message: "Login successful", counselorId: counselor._id });
//   } catch (error) {
//     console.error("Error during login:", error);
//     res.status(500).json({ message: "Internal server error" });
//   }
// });


// Counselor login endpoint
app.post("/counselor/login", async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    res.status(400).json({ message: "All fields are required" });
    return;
  }

  try {
    // Use case-insensitive search for username
    const counselor = await CounselorModel.findOne({ username: new RegExp(`^${username}$`, "i") });

    if (!counselor) {
      res.status(400).json({ message: "Counselor not found" });
      return;
    }

    // Check the password using bcrypt
    const isPasswordValid = await bcrypt.compare(password, counselor.password);
    if (!isPasswordValid) {
      res.status(400).json({ message: "Invalid password" });
      return;
    }

    // Return counselor ID upon successful login
    res.status(200).json({ message: "Login successful", counselorId: counselor._id.toString() });
  } catch (error) {
    console.error("Error during login:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});
// Get all counselors
app.get("/counselors", async (req, res) => {
  try {
    const counselors = await CounselorModel.find({}, "name email highestQualification experience");
    res.status(200).json(counselors);
  } catch (error) {
    res.status(500).json({ message: "Error fetching counselors", error });
  }
});
// Student sends a counseling request
app.post("/request-counseling", async (req, res) => {
  try {
    const { studentId, counselorId } = req.body;

    if (!studentId || !counselorId) {
      return res.status(400).json({ message: "Missing studentId or counselorId" }); // ✅ Added `return`
    }

    const newRequest = new CounselingRequestModel({ studentId, counselorId, status: "Pending" });
    await newRequest.save();

    return res.status(201).json({ message: "Request sent successfully" }); // ✅ Added `return`
  } catch (error) {
    return res.status(500).json({ message: "Error requesting counseling", error }); // ✅ Added `return`
  }
});

// Counselors view student requests
app.get("/counselor-requests/:counselorId", async (req, res) => {
  try {
    const requests = await CounselingRequestModel.find({
      counselorId: req.params.counselorId,
      status: "Pending",
    }).populate("studentId", "name email");
    res.status(200).json(requests);
  } catch (error) {
    res.status(500).json({ message: "Error fetching requests", error });
  }
});
// Counselor accepts or declines requests
// const crypto = require("crypto");

app.post("/counselor-response", async (req, res) => {
  const { requestId, response, meetingDetails, date, time } = req.body;

  try {
    const request = await CounselingRequestModel.findById(requestId);
    if (!request) return res.status(404).json({ message: "Request not found" });

    if (response === "Accepted") {
      if (!date || !time) {
        return res.status(400).json({ message: "Date and time are required for session acceptance." });
      }

      request.status = "Accepted";
      request.date = date;
      request.time = time;
      request.meetingDetails = meetingDetails || `Video Call Code: ${crypto.randomBytes(8).toString("hex")}`;
    } else {
      request.status = "Declined";
      request.meetingDetails = "Counselor is unavailable.";
      request.date = null; // Clear date & time if declined
      request.time = null;
    }

    await request.save();
    res.status(200).json({ message: `Request ${response.toLowerCase()} successfully!` });
  } catch (error) {
    res.status(500).json({ message: "Error updating request", error });
  }
});

// Student checks their requests
app.get("/student-requests/:studentId", async (req, res) => {
  console.log("Fetching requests for studentId:", req.params.studentId); // Debugging

  try {
    const requests = await CounselingRequestModel.find({ studentId: req.params.studentId })
      .populate("counselorId", "name email");

    console.log("Requests found:", requests); // Debugging
    res.status(200).json(requests);
  } catch (error) {
    console.error("Error fetching student requests:", error);
    res.status(500).json({ message: "Error fetching student requests", error });
  }
});


// ✅ Fetch upcoming sessions for "View Schedule"
app.get("/counselor-sessions/:counselorId", async (req, res) => {
  try {
    const counselorId = req.params.counselorId;

    // Validate if counselorId is a valid ObjectId
    if (!mongoose.Types.ObjectId.isValid(counselorId)) {
      return res.status(400).json({ message: "Invalid Counselor ID" });
    }

    const sessions = await CounselingRequestModel.find({
      counselorId: new mongoose.Types.ObjectId(counselorId), // ✅ Convert to ObjectId
      status: "Accepted",
    }).populate("studentId", "name");

    res.json(sessions);
  } catch (error) {
    console.error("Error fetching counselor sessions:", error);
    res.status(500).json({ message: "Error fetching schedule", error });
  }
});


// ✅ Modify an accepted session (Edit Meeting Details)
app.put("/modify-session/:sessionId", async (req, res) => {
  const { sessionId } = req.params;
  const { date, time, meetingDetails } = req.body;

  try {
    const updatedSession = await CounselingRequestModel.findByIdAndUpdate(
      sessionId,
      { date, time, meetingDetails },
      { new: true }
    );

    if (!updatedSession) {
      return res.status(404).json({ message: "Session not found" });
    }

    res.json({ message: "Session updated successfully", session: updatedSession });
  } catch (error) {
    console.error("Error modifying session:", error);
    res.status(500).json({ message: "Error modifying session", error });
  }
});


// ✅ Cancel an accepted session
app.delete("/cancel-session/:sessionId", async (req, res) => {
  const { sessionId } = req.params;

  try {
    const deletedSession = await CounselingRequestModel.findByIdAndDelete(sessionId);

    if (!deletedSession) {
      return res.status(404).json({ message: "Session not found" });
    }

    res.json({ message: "Session cancelled successfully" });
  } catch (error) {
    console.error("Error cancelling session:", error);
    res.status(500).json({ message: "Error cancelling session", error });
  }
});





const requests = await CounselingRequestModel.find();
console.log("All Counseling Requests:", requests);

//end of counselling part 





// Route to get total number of counselors, students, videos, and feedback
app.get('/api/stats', async (req, res) => {
  try {
    const counselorCount = await CounselorModel.countDocuments();
    const studentCount = await UserModel.countDocuments(); // Assuming UserModel is for students
    const videoCount = await VideoModel.countDocuments(); // Assuming VideoModel is for videos
    const feedbackCount = await FeedbackModel.countDocuments(); // Assuming FeedbackModel is for feedbacks

    return res.status(200).json({
      totalCounselors: counselorCount,
      totalStudents: studentCount,
      totalVideos: videoCount,
      totalFeedbacks: feedbackCount,
    });
  } catch (error) {
    console.error('Error fetching counts:', error);
    return res.status(500).json({ message: 'Server error' });
  }
});

// Feedback submission route
app.post("/submit-feedback", async (req, res) => {
  try {
    const { userId, counselorId, feedbackText, rating } = req.body;

    // Validate inputs
    if (!userId || !counselorId || !feedbackText || !rating) {
      return res.status(400).json({ error: "All fields are required" });
    }

    // Create a new feedback document
    const feedback = new FeedbackModel({
      userId,
      counselorId,
      feedbackText,
      rating,
    });

    // Save the feedback to the database
    await feedback.save();
    res.status(201).json({ message: "Feedback submitted successfully", feedback });
  } catch (error) {
    console.error("Error submitting feedback:", error);
    res.status(500).json({ error: "An error occurred while submitting feedback" });
  }
});

// // Endpoint to get all counselors
// app.get("/api/counselors", async (req, res) => {
//   try {
//     const counselors = await CounselorModel.find();
//     return res.status(200).json(counselors);
//   } catch (error) {
//     console.error("Error fetching counselors:", error);
//     return res.status(500).json({ message: "Server error" });
//   }
// });

// // Endpoint to get all students (assuming UserModel represents students)
// app.get("/api/students", async (req, res) => {
//   try {
//     const students = await UserModel.find();
//     return res.status(200).json(students);
//   } catch (error) {
//     console.error("Error fetching students:", error);
//     return res.status(500).json({ message: "Server error" });
//   }
// });

// Endpoint to get all videos
app.get("/api/videos", async (req, res) => {
  try {
    const videos = await VideoModel.find();
    return res.status(200).json(videos);
  } catch (error) {
    console.error("Error fetching videos:", error);
    return res.status(500).json({ message: "Server error" });
  }
});

// Endpoint to get all feedback
app.get("/api/feedback", async (req, res) => {
  try {
    const feedbacks = await FeedbackModel.find()
      .populate("userId") // Populating userId to get user details
      .populate("counselorId"); // Populating counselorId to get counselor details
    return res.status(200).json(feedbacks);
  } catch (error) {
    console.error("Error fetching feedback:", error);
    return res.status(500).json({ message: "Server error" });
  }
});

app.use(express.static(path.join(__dirname, "../frontend/html")));

// Serve dashboard pages correctly
app.get("/dashboard/:page", (req, res) => {
  res.sendFile(path.join(__dirname, `../frontend/html/dashboard/${req.params.page}`));
});



//Digilocker backend Start

const digiuserSchema = new mongoose.Schema({
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

const digiUser = mongoose.model("UserDIGI", digiuserSchema);
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

      const user = await digiUser.findOne({ aadhaar });
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

      const existingUser = await digiUser.findOne({ aadhaar });
      if (existingUser) {
          console.warn("❌ Sign-Up Failed: User Already Exists");
          return res.status(400).json({ message: "User already exists" });
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      const newUser = new digiUser({ aadhaar, phone, password: hashedPassword, role });
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
          fileUrl: `http://localhost:4000/uploads/${req.file.filename}`,
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
  const ext = path.extname(doc.filename); // Get original file extension
  const newPath = `uploads/${newFilename}${ext}`; // Ensure extension remains

  fs.rename(oldPath, newPath, async (err) => {
    if (err) return res.status(500).json({ message: "Error renaming file" });

    doc.filename = newFilename + ext; // Update DB with the correct filename
    doc.fileUrl = `http://localhost:4000/uploads/${newFilename}${ext}`;
    await doc.save();
    res.json({ message: "File renamed successfully" });
  });
});

// ✅ Function to Analyze a Marksheet
// ✅ Function to Analyze a Marksheet
async function analyzeMarksheet(filePath) {
  return new Promise((resolve, reject) => {
    exec(`python extract.py "${filePath}"`, (error, stdout) => {
      if (error) {
        console.error("❌ OCR Error:", error);
        reject("Analysis Failed");
      } else {
        resolve(JSON.parse(stdout));  // ✅ Parse JSON response
      }
    });
  });
}

// ✅ New Endpoint: Analyze a Marksheet (Citizen Triggers)
app.post("/analyze", async (req, res) => {
  const { fileUrl } = req.body;
  const filePath = path.join(__dirname, "uploads", path.basename(fileUrl));

  try {
    const extractedData = await analyzeMarksheet(filePath);
    res.json(extractedData);
  } catch (error) {
    res.status(500).json({ error: "Failed to analyze document" });
  }
});

// ✅ Serve Uploads
app.use("/uploads", express.static("uploads"));

// ✅ Start Server with Debug Log
// app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));


//Digilocker backend End























































// Connect to MongoDB and start the server
mongoose
  .connect(MONGO_URI)
  .then(() => {
    app.listen(port, () => {
      console.log(`Server is running on http://localhost:${port}`);
    });
  })
  .catch((error) => {
    console.error("Error connecting to MongoDB:", error);
  });
