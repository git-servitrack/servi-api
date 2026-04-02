import mongoose, { Document, Schema } from "mongoose";
import { userRoles, UserRole } from "../config/constants";

// Purpose: Define the user model schema
export interface UserModel extends Document {
  username: string;
  firstName: string;
  lastName: string;
  middleName?: string;
  email: string;
  password: string;
  avatar?: string | null;
  role: UserRole;
}

const UserSchema = new Schema<UserModel>(
  {
    username: {
      type: String,
      required: true,
    },
    firstName: {
      type: String,
      required: true,
    },
    lastName: {
      type: String,
      required: true,
    },
    middleName: {
      type: String,
      required: false,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
      select: false,
    },
    avatar: {
      type: String,
      default: null,
    },
    role: {
      type: String,
      enum: userRoles,
      required: true,
    },
  },
  { timestamps: true },
);

export const User = mongoose.model<UserModel>("User", UserSchema);
