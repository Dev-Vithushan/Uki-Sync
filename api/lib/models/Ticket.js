import mongoose from "mongoose";

const STATUSES = ["To Do", "In Progress", "Review", "Done"];
const PRIORITIES = ["Low", "Medium", "High"];

const commentSchema = new mongoose.Schema(
  {
    text: {
      type: String,
      required: true,
      trim: true
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  },
  { _id: true, id: false }
);

const ticketSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true
    },
    description: {
      type: String,
      required: true,
      trim: true
    },
    status: {
      type: String,
      enum: STATUSES,
      default: "To Do"
    },
    priority: {
      type: String,
      enum: PRIORITIES,
      default: "Medium"
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    board: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Board",
      default: null
    },
    boardSequence: {
      type: Number,
      default: null
    },
    ticketKey: {
      type: String,
      default: null
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    dueDate: {
      type: Date,
      default: null
    },
    comments: [commentSchema]
  },
  {
    timestamps: true,
    versionKey: false
  }
);

ticketSchema.index({ ticketKey: 1 }, { unique: true, sparse: true });

const Ticket = mongoose.models.Ticket || mongoose.model("Ticket", ticketSchema);

export default Ticket;
