import mongoose from "mongoose";

export interface StockMovementModel extends mongoose.Document {
  sparePart: mongoose.Schema.Types.ObjectId | string;
  maintenanceJob?: mongoose.Schema.Types.ObjectId | string;
  type: "Received" | "Issued" | "Adjusted" | "Reserved";
  quantity: number;
  reference: string;
  note?: string;
  createdBy: mongoose.Schema.Types.ObjectId | string;
}

const StockMovementSchema = new mongoose.Schema<StockMovementModel>(
  {
    sparePart: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "SparePart",
      required: true,
    },
    maintenanceJob: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Maintenance",
    },
    type: {
      type: String,
      enum: ["Received", "Issued", "Adjusted", "Reserved"],
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
    },
    reference: {
      type: String,
      required: true,
    },
    note: {
      type: String,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true },
);

export const StockMovement = mongoose.model<StockMovementModel>(
  "StockMovement",
  StockMovementSchema,
);
