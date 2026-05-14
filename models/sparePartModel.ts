import mongoose from "mongoose";

export interface SparePartModel extends mongoose.Document {
  partNumber: string;
  name: string;
  category: mongoose.Schema.Types.ObjectId | string;
  site: string;
  compatibleAssets: (mongoose.Schema.Types.ObjectId | string)[];
  unit: string;
  stockOnHand: number;
  reservedStock: number;
  reorderPoint: number;
  status: "In Stock" | "Low Stock" | "Critical" | "Out of Stock";
  binLocation: string;
  supplier: string;
  notes?: string;
}

const SparePartSchema = new mongoose.Schema<SparePartModel>(
  {
    partNumber: {
      type: String,
      required: true,
      unique: true,
    },
    name: {
      type: String,
      required: true,
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: true,
    },
    site: {
      type: String,
      required: true,
    },
    compatibleAssets: {
      type: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Asset",
        },
      ],
      default: [],
    },
    unit: {
      type: String,
      required: true,
    },
    stockOnHand: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    reservedStock: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    reorderPoint: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    status: {
      type: String,
      enum: ["In Stock", "Low Stock", "Critical", "Out of Stock"],
      default: "In Stock",
    },
    binLocation: {
      type: String,
      required: true,
    },
    supplier: {
      type: String,
      required: true,
    },
    notes: {
      type: String,
    },
  },
  { timestamps: true },
);

export const SparePart = mongoose.model<SparePartModel>("SparePart", SparePartSchema);
