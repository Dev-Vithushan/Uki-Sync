import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const ROLES = ["Admin", "Lecturer", "Student"];

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true
    },
    password: {
      type: String,
      required: true,
      minlength: 6,
      select: false
    },
    role: {
      type: String,
      enum: ROLES,
      default: "Student"
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  },
  {
    versionKey: false
  }
);

userSchema.pre("save", async function hashPassword(next) {
  if (!this.isModified("password")) {
    return next();
  }

  this.password = await bcrypt.hash(this.password, 10);
  return next();
});

userSchema.methods.matchPassword = function matchPassword(plainTextPassword) {
  return bcrypt.compare(plainTextPassword, this.password);
};

const User = mongoose.models.User || mongoose.model("User", userSchema);

export default User;
