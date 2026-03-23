import mongoose from "mongoose";

const boardSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },
    code: {
      type: String,
      required: true,
      unique: true,
      sparse: true,
      uppercase: true,
      trim: true
    },
    description: {
      type: String,
      default: "",
      trim: true
    },
    ticketCounter: {
      type: Number,
      default: 0,
      min: 0
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    }
  },
  {
    timestamps: true,
    versionKey: false
  }
);

boardSchema.index({ name: 1 }, { unique: true });

const Board = mongoose.models.Board || mongoose.model("Board", boardSchema);

export default Board;
