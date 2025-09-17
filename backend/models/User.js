import mongoose from "mongoose";

const { Schema } = mongoose;

const UserSchema = new Schema(
  {
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      trim: true,
      lowercase: true,
      match: [/.+@.+\..+/, "Please enter a valid email address"],
    },
    name: {
      type: String,
      required: false, // Name is optional, as it may not be provided by all auth methods
      trim: true,
    },
    googleId: {
      type: String,
      unique: true,
      sparse: true, // Allows for multiple documents to have a null value for this field
    },
  },
  {
    timestamps: true, // This adds `createdAt` and `updatedAt` timestamps automatically
  }
);

const User = mongoose.model("User", UserSchema);

export default User;