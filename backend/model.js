// Import mongoose at the top of the file
import mongoose, { Schema, model } from "mongoose";

// User Schema
const UserSchema = new Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    unique: true,
    required: true,
  },
  password: {
    type: String,
    required: true,
  },
  username: {
    type: String,
    unique: true,
    required: true,
  },
  test_result: {
    type: String,
    required: false,
  },
});

// Export UserModel
export const UserModel = model("user", UserSchema);

// Counselor Schema
const CounselorSchema = new Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    unique: true,
    required: true,
  },
  username: {
    type: String,
    unique: true,
    required: true,
  },
  password: {
    type: String,
    required: true,
  },
  highestQualification: {
    type: String,
    required: true,
  },
  experience: {
    type: String,
    required: true,
  },
});

// Export CounselorModel
export const CounselorModel = model("counselor", CounselorSchema);

// Counseling Request Schema
const CounselingRequestSchema = new mongoose.Schema({
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: "user", required: true },
  counselorId: { type: mongoose.Schema.Types.ObjectId, ref: "counselor", required: true },
  status: { type: String, enum: ["Pending", "Accepted", "Declined"], default: "Pending" },
  meetingDetails: String,
  date: { type: String },
  time: { type: String },
}, { timestamps: true });

// ✅ Indexes added for optimized query performance
CounselingRequestSchema.index({ studentId: 1 });
CounselingRequestSchema.index({ counselorId: 1 });

export const CounselingRequestModel = mongoose.model("counselingRequest", CounselingRequestSchema);






// Feedback Schema
const FeedbackSchema = new Schema({
  counselorId: {
    type: Schema.Types.ObjectId,
    ref: "counselor",
    required: true,
  },
  userId: {
    type: Schema.Types.ObjectId,
    ref: "user",
    required: true,
  },
  feedbackText: {
    type: String,
    required: true,
  },
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5,
  },
});

// Export FeedbackModel
export const FeedbackModel = model("feedback", FeedbackSchema);

// Video Schema
const VideoSchema = new Schema({
  title: {
    type: String,
    required: true,
  },
  url: {
    type: String,
    required: true,
  },
  uploadedBy: {
    type: Schema.Types.ObjectId,
    ref: "counselor",
    required: true,
  },
  description: {
    type: String,
  },
});

// Export VideoModel
export const VideoModel = model("video", VideoSchema);



//Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('Connected to MongoDB'))
.catch((err) => console.error('Failed to connect to MongoDB:', err));
