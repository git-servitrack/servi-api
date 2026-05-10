import mongoose from "mongoose";

export interface MaintenanceModel extends mongoose.Document {
  workOrder: string;
  asset: mongoose.Schema.Types.ObjectId | string;
  serviceRequest: mongoose.Schema.Types.ObjectId | string;
  status:
    | "Assigned"
    | "Diagnosing"
    | "Awaiting Parts"
    | "Repair In Progress"
    | "On Hold"
    | "Ready for QA"
    | "Completed";
  diagnosisNotes: string;
  assignment: {
    technician: mongoose.Schema.Types.ObjectId | string;
    team: string;
    shift: string;
    eta: string;
  };
  repairActions: {
    title: string;
    owner: string;
    status: "Pending" | "In Progress" | "Done";
    note: string;
  }[];
  timeline: {
    title: string;
    description: string;
    createdAt: Date;
    actor: string;
  }[];
  completion: {
    resolution: string;
    partsUsed: string;
    verifiedBy: string;
    completedAt?: Date;
  };
}

const MaintenanceSchema = new mongoose.Schema<MaintenanceModel>(
  {
    workOrder: {
      type: String,
      required: true,
      unique: true,
    },
    asset: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Asset",
      required: true,
    },
    serviceRequest: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ServiceRequest",
      required: true,
    },
    status: {
      type: String,
      enum: [
        "Assigned",
        "Diagnosing",
        "Awaiting Parts",
        "Repair In Progress",
        "On Hold",
        "Ready for QA",
        "Completed",
      ],
      default: "Assigned",
    },
    diagnosisNotes: {
      type: String,
      default: "",
    },
    assignment: {
      technician: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },
      team: {
        type: String,
        required: true,
      },
      shift: {
        type: String,
        required: true,
      },
      eta: {
        type: String,
        required: true,
        default: Date.now,
      },
    },
    repairActions: {
      type: [
        {
          title: {
            type: String,
            required: true,
          },
          owner: {
            type: String,
            required: true,
          },
          status: {
            type: String,
            enum: ["Pending", "In Progress", "Done"],
            default: "Pending",
          },
          note: {
            type: String,
            default: "",
          },
        },
      ],
      default: [],
    },
    timeline: {
      type: [
        {
          title: {
            type: String,
            required: true,
          },
          description: {
            type: String,
            required: true,
          },
          createdAt: {
            type: Date,
            default: Date.now,
          },
          actor: {
            type: String,
            required: true,
          },
        },
      ],
      default: [],
    },
    completion: {
      resolution: {
        type: String,
        default: "",
      },
      partsUsed: {
        type: String,
        default: "",
      },
      verifiedBy: {
        type: String,
        default: "",
      },
      completedAt: {
        type: Date,
      },
    },
  },
  { timestamps: true },
);

export const Maintenance = mongoose.model<MaintenanceModel>("Maintenance", MaintenanceSchema);
