import mongoose from "mongoose";

export interface CategoryModel extends mongoose.Document {
  name: string;
  code?: string;
  description?: string;
  isActive: boolean;
}

const CategorySchema = new mongoose.Schema<CategoryModel>(
  {
    name: {
      type: String,
      required: true,
    },
    code: {
      type: String,
      unique: true,
    },
    description: {
      type: String,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  },
);

export const Category = mongoose.model<CategoryModel>("Category", CategorySchema);
