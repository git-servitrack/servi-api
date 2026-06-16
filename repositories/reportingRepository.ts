import { Asset } from "../models/assetModel";
import { Category } from "../models/categoryModel";
import { DamageDetection } from "../models/damageDetectionModel";
import { Maintenance } from "../models/maintenanceModel";
import { MediaFile } from "../models/mediaFileModel";
import { PartUsage } from "../models/partUsageModel";
import { PredictiveMaintenance } from "../models/predictiveMaintenanceModel";
import { ServiceRequest } from "../models/serviceRequestModel";
import { SparePart } from "../models/sparePartModel";
import { User } from "../models/userModel";
import { ReportingFilter } from "../types/reporting";

const SLA_TARGET_MS = 24 * 60 * 60 * 1000;

// Purpose: This file is responsible for handling derived reporting and analytics database queries.
export class ReportingRepository {
  private getDateMatch(
    field: string,
    filter: ReportingFilter,
  ): Record<string, unknown> {
    return {
      [field]: {
        $gte: filter.from,
        $lte: filter.to,
      },
    };
  }

  private getMaintenanceBaseMatch(
    filter: ReportingFilter,
  ): Record<string, unknown> {
    return {
      ...this.getDateMatch("createdAt", filter),
      ...(filter.team ? { "assignment.team": filter.team } : {}),
    };
  }

  private getSiteMatch(
    filter: ReportingFilter,
    path = "asset.site",
  ): Record<string, unknown> {
    return filter.site ? { [path]: filter.site } : {};
  }

  private getReportScopeMatch(filter: ReportingFilter): Record<string, unknown> {
    return {
      ...(filter.site ? { site: filter.site } : {}),
      ...(filter.team ? { team: filter.team } : {}),
    };
  }

  async getMaintenanceHistory(filter: ReportingFilter): Promise<any[]> {
    const pipeline: any[] = [
      { $match: this.getMaintenanceBaseMatch(filter) },
      {
        $lookup: {
          from: Asset.collection.name,
          localField: "asset",
          foreignField: "_id",
          as: "asset",
        },
      },
      { $unwind: { path: "$asset", preserveNullAndEmptyArrays: true } },
      { $match: this.getSiteMatch(filter) },
      { $sort: { createdAt: -1 } },
      { $limit: filter.limit },
      {
        $project: {
          _id: 1,
          workOrder: 1,
          status: 1,
          completedAt: { $ifNull: ["$completion.completedAt", "$updatedAt"] },
          assetName: { $ifNull: ["$asset.name", "Unassigned asset"] },
          assetCode: "$asset.code",
          site: { $ifNull: ["$asset.site", "Unassigned site"] },
        },
      },
    ];

    return Maintenance.aggregate(pipeline).exec();
  }

  async getTechnicianPerformance(filter: ReportingFilter): Promise<any[]> {
    const pipeline: any[] = [
      { $match: this.getMaintenanceBaseMatch(filter) },
      {
        $lookup: {
          from: Asset.collection.name,
          localField: "asset",
          foreignField: "_id",
          as: "asset",
        },
      },
      { $unwind: { path: "$asset", preserveNullAndEmptyArrays: true } },
      { $match: this.getSiteMatch(filter) },
      {
        $lookup: {
          from: User.collection.name,
          localField: "assignment.technician",
          foreignField: "_id",
          as: "technician",
        },
      },
      { $unwind: { path: "$technician", preserveNullAndEmptyArrays: true } },
      {
        $group: {
          _id: {
            technician: "$assignment.technician",
            team: "$assignment.team",
          },
          firstName: { $first: "$technician.firstName" },
          lastName: { $first: "$technician.lastName" },
          username: { $first: "$technician.username" },
          totalJobs: { $sum: 1 },
          completedJobs: {
            $sum: {
              $cond: [{ $eq: ["$status", "Completed"] }, 1, 0],
            },
          },
          completedWithinSla: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $eq: ["$status", "Completed"] },
                    { $ne: ["$completion.completedAt", null] },
                    {
                      $lte: [
                        {
                          $subtract: ["$completion.completedAt", "$createdAt"],
                        },
                        SLA_TARGET_MS,
                      ],
                    },
                  ],
                },
                1,
                0,
              ],
            },
          },
          totalCompletionMs: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $eq: ["$status", "Completed"] },
                    { $ne: ["$completion.completedAt", null] },
                  ],
                },
                { $subtract: ["$completion.completedAt", "$createdAt"] },
                0,
              ],
            },
          },
        },
      },
      { $sort: { completedJobs: -1, totalJobs: -1 } },
      { $limit: filter.limit },
    ];

    return Maintenance.aggregate(pipeline).exec();
  }

  async getSparePartsUsage(filter: ReportingFilter): Promise<any[]> {
    const pipeline: any[] = [
      { $match: this.getDateMatch("usedAt", filter) },
      {
        $lookup: {
          from: SparePart.collection.name,
          localField: "sparePart",
          foreignField: "_id",
          as: "sparePart",
        },
      },
      { $unwind: { path: "$sparePart", preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: Asset.collection.name,
          localField: "asset",
          foreignField: "_id",
          as: "asset",
        },
      },
      { $unwind: { path: "$asset", preserveNullAndEmptyArrays: true } },
      { $match: this.getSiteMatch(filter) },
      {
        $lookup: {
          from: Category.collection.name,
          localField: "sparePart.category",
          foreignField: "_id",
          as: "category",
        },
      },
      { $unwind: { path: "$category", preserveNullAndEmptyArrays: true } },
      {
        $group: {
          _id: {
            sparePart: "$sparePart._id",
            site: "$asset.site",
          },
          part: { $first: "$sparePart.name" },
          category: { $first: "$category.name" },
          site: { $first: "$asset.site" },
          unit: { $first: "$unit" },
          issuedUnits: { $sum: "$quantity" },
          linkedWorkOrders: { $addToSet: "$maintenanceJob" },
        },
      },
      { $sort: { issuedUnits: -1 } },
      { $limit: filter.limit },
    ];

    return PartUsage.aggregate(pipeline).exec();
  }

  async getDowntime(filter: ReportingFilter): Promise<any[]> {
    const pipeline: any[] = [
      { $match: this.getMaintenanceBaseMatch(filter) },
      {
        $lookup: {
          from: Asset.collection.name,
          localField: "asset",
          foreignField: "_id",
          as: "asset",
        },
      },
      { $unwind: { path: "$asset", preserveNullAndEmptyArrays: true } },
      { $match: this.getSiteMatch(filter) },
      {
        $project: {
          asset: "$asset._id",
          assetName: "$asset.name",
          assetCode: "$asset.code",
          site: "$asset.site",
          endedAt: { $ifNull: ["$completion.completedAt", new Date()] },
          createdAt: 1,
        },
      },
      {
        $group: {
          _id: "$asset",
          assetName: { $first: "$assetName" },
          assetCode: { $first: "$assetCode" },
          site: { $first: "$site" },
          incidents: { $sum: 1 },
          downtimeMs: {
            $sum: {
              $max: [{ $subtract: ["$endedAt", "$createdAt"] }, 0],
            },
          },
          lastDowntimeAt: { $max: "$endedAt" },
        },
      },
      { $sort: { downtimeMs: -1 } },
      { $limit: filter.limit },
    ];

    return Maintenance.aggregate(pipeline).exec();
  }

  async getHighRiskEquipment(filter: ReportingFilter): Promise<any[]> {
    const pipeline: any[] = [
      { $match: this.getDateMatch("createdAt", filter) },
      { $sort: { createdAt: -1 } },
      {
        $group: {
          _id: "$asset",
          predictionId: { $first: "$_id" },
          riskLevel: { $first: "$prediction.riskLevel" },
          riskScore: { $first: "$prediction.riskScore" },
          recommendation: {
            $first: "$prediction.nextMaintenanceRecommendation",
          },
          forecastedAt: { $first: "$createdAt" },
        },
      },
      { $match: { riskLevel: { $in: ["High", "Critical"] } } },
      {
        $lookup: {
          from: Asset.collection.name,
          localField: "_id",
          foreignField: "_id",
          as: "asset",
        },
      },
      { $unwind: { path: "$asset", preserveNullAndEmptyArrays: true } },
      { $match: this.getSiteMatch(filter) },
      { $sort: { riskScore: -1, forecastedAt: -1 } },
      { $limit: filter.limit },
    ];

    return PredictiveMaintenance.aggregate(pipeline).exec();
  }

  async getRequestVolume(filter: ReportingFilter): Promise<any[]> {
    const pipeline: any[] = [
      {
        $match: {
          ...this.getDateMatch("createdAt", filter),
          ...(filter.site ? { site: filter.site } : {}),
        },
      },
      {
        $lookup: {
          from: Asset.collection.name,
          localField: "asset",
          foreignField: "_id",
          as: "asset",
        },
      },
      { $unwind: { path: "$asset", preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: Category.collection.name,
          localField: "asset.category",
          foreignField: "_id",
          as: "category",
        },
      },
      { $unwind: { path: "$category", preserveNullAndEmptyArrays: true } },
      {
        $group: {
          _id: {
            category: "$category.name",
            site: "$site",
          },
          category: { $first: "$category.name" },
          site: { $first: "$site" },
          newRequests: { $sum: 1 },
          inProgress: {
            $sum: {
              $cond: [{ $eq: ["$status", "In Progress"] }, 1, 0],
            },
          },
          resolved: {
            $sum: {
              $cond: [{ $in: ["$status", ["Resolved", "Closed"]] }, 1, 0],
            },
          },
        },
      },
      { $sort: { newRequests: -1 } },
      { $limit: filter.limit },
    ];

    return ServiceRequest.aggregate(pipeline).exec();
  }

  async getCompletionRate(filter: ReportingFilter): Promise<any[]> {
    const overdueDate = new Date(filter.to.getTime() - SLA_TARGET_MS);
    const pipeline: any[] = [
      { $match: this.getMaintenanceBaseMatch(filter) },
      {
        $lookup: {
          from: Asset.collection.name,
          localField: "asset",
          foreignField: "_id",
          as: "asset",
        },
      },
      { $unwind: { path: "$asset", preserveNullAndEmptyArrays: true } },
      { $match: this.getSiteMatch(filter) },
      {
        $group: {
          _id: "$assignment.team",
          total: { $sum: 1 },
          completed: {
            $sum: {
              $cond: [{ $eq: ["$status", "Completed"] }, 1, 0],
            },
          },
          overdue: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $ne: ["$status", "Completed"] },
                    { $lte: ["$createdAt", overdueDate] },
                  ],
                },
                1,
                0,
              ],
            },
          },
          qaReady: {
            $sum: {
              $cond: [{ $eq: ["$status", "Ready for QA"] }, 1, 0],
            },
          },
        },
      },
      { $sort: { completed: -1, total: -1 } },
      { $limit: filter.limit },
    ];

    return Maintenance.aggregate(pipeline).exec();
  }

  async getMediaFiles(filter: ReportingFilter): Promise<any[]> {
    const pipeline: any[] = [
      { $match: this.getDateMatch("createdAt", filter) },
      {
        $lookup: {
          from: Asset.collection.name,
          localField: "relatedTo.id",
          foreignField: "_id",
          as: "relatedAsset",
        },
      },
      {
        $lookup: {
          from: ServiceRequest.collection.name,
          localField: "relatedTo.id",
          foreignField: "_id",
          as: "relatedServiceRequest",
        },
      },
      {
        $lookup: {
          from: Maintenance.collection.name,
          localField: "relatedTo.id",
          foreignField: "_id",
          as: "relatedMaintenance",
        },
      },
      {
        $lookup: {
          from: Asset.collection.name,
          localField: "relatedServiceRequest.asset",
          foreignField: "_id",
          as: "serviceRequestAsset",
        },
      },
      {
        $lookup: {
          from: Asset.collection.name,
          localField: "relatedMaintenance.asset",
          foreignField: "_id",
          as: "maintenanceAsset",
        },
      },
      {
        $lookup: {
          from: DamageDetection.collection.name,
          let: { mediaFileId: "$_id" },
          pipeline: [
            { $match: { $expr: { $eq: ["$mediaFile", "$$mediaFileId"] } } },
            { $sort: { createdAt: -1 } },
            { $limit: 1 },
          ],
          as: "latestDetection",
        },
      },
      {
        $addFields: {
          relatedAsset: { $arrayElemAt: ["$relatedAsset", 0] },
          relatedServiceRequest: { $arrayElemAt: ["$relatedServiceRequest", 0] },
          relatedMaintenance: { $arrayElemAt: ["$relatedMaintenance", 0] },
          serviceRequestAsset: { $arrayElemAt: ["$serviceRequestAsset", 0] },
          maintenanceAsset: { $arrayElemAt: ["$maintenanceAsset", 0] },
          latestDetection: { $arrayElemAt: ["$latestDetection", 0] },
        },
      },
      {
        $addFields: {
          site: {
            $switch: {
              branches: [
                { case: { $eq: ["$relatedTo.model", "Asset"] }, then: "$relatedAsset.site" },
                {
                  case: { $eq: ["$relatedTo.model", "ServiceRequest"] },
                  then: { $ifNull: ["$relatedServiceRequest.site", "$serviceRequestAsset.site"] },
                },
                {
                  case: { $eq: ["$relatedTo.model", "Maintenance"] },
                  then: "$maintenanceAsset.site",
                },
              ],
              default: "Unassigned site",
            },
          },
          team: {
            $switch: {
              branches: [
                { case: { $eq: ["$relatedTo.model", "Asset"] }, then: "$relatedAsset.assignedTeam" },
                {
                  case: { $eq: ["$relatedTo.model", "ServiceRequest"] },
                  then: "$serviceRequestAsset.assignedTeam",
                },
                {
                  case: { $eq: ["$relatedTo.model", "Maintenance"] },
                  then: "$relatedMaintenance.assignment.team",
                },
              ],
              default: "Unassigned team",
            },
          },
          relatedRecord: {
            $switch: {
              branches: [
                {
                  case: { $eq: ["$relatedTo.model", "Asset"] },
                  then: {
                    $concat: [
                      { $ifNull: ["$relatedAsset.name", "Unassigned asset"] },
                      " ",
                      { $ifNull: ["$relatedAsset.code", ""] },
                    ],
                  },
                },
                {
                  case: { $eq: ["$relatedTo.model", "ServiceRequest"] },
                  then: "$relatedServiceRequest.title",
                },
                {
                  case: { $eq: ["$relatedTo.model", "Maintenance"] },
                  then: "$relatedMaintenance.workOrder",
                },
              ],
              default: "Unassigned record",
            },
          },
        },
      },
      { $match: this.getReportScopeMatch(filter) },
      { $sort: { createdAt: -1 } },
      { $limit: filter.limit },
      {
        $project: {
          _id: 1,
          title: 1,
          fileName: 1,
          purpose: 1,
          relatedTo: "$relatedTo.model",
          relatedRecord: 1,
          site: { $ifNull: ["$site", "Unassigned site"] },
          team: { $ifNull: ["$team", "Unassigned team"] },
          status: 1,
          uploadedAt: "$createdAt",
          latestDetectionStatus: "$latestDetection.status",
          latestDetectionSeverity: "$latestDetection.severityLevel",
          latestDetectionLabel: "$latestDetection.topLabel",
          url: 1,
        },
      },
    ];

    return MediaFile.aggregate(pipeline).exec();
  }

  async getDamageDetections(filter: ReportingFilter): Promise<any[]> {
    const pipeline: any[] = [
      { $match: this.getDateMatch("createdAt", filter) },
      {
        $lookup: {
          from: MediaFile.collection.name,
          localField: "mediaFile",
          foreignField: "_id",
          as: "mediaFile",
        },
      },
      { $unwind: { path: "$mediaFile", preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: Asset.collection.name,
          localField: "asset",
          foreignField: "_id",
          as: "relatedAsset",
        },
      },
      {
        $lookup: {
          from: ServiceRequest.collection.name,
          localField: "serviceRequest",
          foreignField: "_id",
          as: "relatedServiceRequest",
        },
      },
      {
        $lookup: {
          from: Maintenance.collection.name,
          localField: "maintenance",
          foreignField: "_id",
          as: "relatedMaintenance",
        },
      },
      {
        $lookup: {
          from: Asset.collection.name,
          localField: "relatedServiceRequest.asset",
          foreignField: "_id",
          as: "serviceRequestAsset",
        },
      },
      {
        $lookup: {
          from: Asset.collection.name,
          localField: "relatedMaintenance.asset",
          foreignField: "_id",
          as: "maintenanceAsset",
        },
      },
      {
        $addFields: {
          relatedAsset: { $arrayElemAt: ["$relatedAsset", 0] },
          relatedServiceRequest: { $arrayElemAt: ["$relatedServiceRequest", 0] },
          relatedMaintenance: { $arrayElemAt: ["$relatedMaintenance", 0] },
          serviceRequestAsset: { $arrayElemAt: ["$serviceRequestAsset", 0] },
          maintenanceAsset: { $arrayElemAt: ["$maintenanceAsset", 0] },
        },
      },
      {
        $addFields: {
          relatedTo: {
            $switch: {
              branches: [
                { case: { $ne: ["$asset", null] }, then: "Asset" },
                { case: { $ne: ["$serviceRequest", null] }, then: "ServiceRequest" },
                { case: { $ne: ["$maintenance", null] }, then: "Maintenance" },
              ],
              default: "$mediaFile.relatedTo.model",
            },
          },
          site: {
            $switch: {
              branches: [
                { case: { $ne: ["$asset", null] }, then: "$relatedAsset.site" },
                {
                  case: { $ne: ["$serviceRequest", null] },
                  then: { $ifNull: ["$relatedServiceRequest.site", "$serviceRequestAsset.site"] },
                },
                { case: { $ne: ["$maintenance", null] }, then: "$maintenanceAsset.site" },
              ],
              default: "Unassigned site",
            },
          },
          team: {
            $switch: {
              branches: [
                { case: { $ne: ["$asset", null] }, then: "$relatedAsset.assignedTeam" },
                { case: { $ne: ["$serviceRequest", null] }, then: "$serviceRequestAsset.assignedTeam" },
                {
                  case: { $ne: ["$maintenance", null] },
                  then: "$relatedMaintenance.assignment.team",
                },
              ],
              default: "Unassigned team",
            },
          },
          relatedRecord: {
            $switch: {
              branches: [
                {
                  case: { $ne: ["$asset", null] },
                  then: {
                    $concat: [
                      { $ifNull: ["$relatedAsset.name", "Unassigned asset"] },
                      " ",
                      { $ifNull: ["$relatedAsset.code", ""] },
                    ],
                  },
                },
                { case: { $ne: ["$serviceRequest", null] }, then: "$relatedServiceRequest.title" },
                { case: { $ne: ["$maintenance", null] }, then: "$relatedMaintenance.workOrder" },
              ],
              default: "Unassigned record",
            },
          },
        },
      },
      { $match: this.getReportScopeMatch(filter) },
      { $sort: { createdAt: -1 } },
      { $limit: filter.limit },
      {
        $project: {
          _id: 1,
          mediaFile: "$mediaFile.title",
          relatedTo: 1,
          relatedRecord: 1,
          site: { $ifNull: ["$site", "Unassigned site"] },
          team: { $ifNull: ["$team", "Unassigned team"] },
          status: 1,
          severityLevel: 1,
          topLabel: 1,
          confidenceScore: 1,
          detectedDamageLabels: 1,
          suggestedMaintenanceAction: 1,
          analyzedAt: "$createdAt",
          errorMessage: 1,
        },
      },
    ];

    return DamageDetection.aggregate(pipeline).exec();
  }

  async countCompletedMaintenance(filter: ReportingFilter): Promise<number> {
    const rows = await Maintenance.aggregate<{ count: number }>([
      {
        $match: {
          ...this.getMaintenanceBaseMatch(filter),
          status: "Completed",
        },
      },
      {
        $lookup: {
          from: Asset.collection.name,
          localField: "asset",
          foreignField: "_id",
          as: "asset",
        },
      },
      { $unwind: { path: "$asset", preserveNullAndEmptyArrays: true } },
      { $match: this.getSiteMatch(filter) },
      { $count: "count" },
    ]).exec();

    return rows[0]?.count || 0;
  }

  async countPartsIssued(filter: ReportingFilter): Promise<number> {
    const rows = await PartUsage.aggregate<{ issuedUnits: number }>([
      { $match: this.getDateMatch("usedAt", filter) },
      {
        $lookup: {
          from: Asset.collection.name,
          localField: "asset",
          foreignField: "_id",
          as: "asset",
        },
      },
      { $unwind: { path: "$asset", preserveNullAndEmptyArrays: true } },
      { $match: this.getSiteMatch(filter) },
      {
        $group: {
          _id: null,
          issuedUnits: { $sum: "$quantity" },
        },
      },
    ]).exec();

    return rows[0]?.issuedUnits || 0;
  }

  async countRequestIntake(filter: ReportingFilter): Promise<number> {
    return ServiceRequest.countDocuments({
      ...this.getDateMatch("createdAt", filter),
      ...(filter.site ? { site: filter.site } : {}),
    }).exec();
  }

  async getSlaSummary(
    filter: ReportingFilter,
  ): Promise<{ completedJobs: number; completedWithinSla: number }> {
    const rows = await Maintenance.aggregate<{
      completedJobs: number;
      completedWithinSla: number;
    }>([
      {
        $match: {
          ...this.getMaintenanceBaseMatch(filter),
          status: "Completed",
        },
      },
      {
        $lookup: {
          from: Asset.collection.name,
          localField: "asset",
          foreignField: "_id",
          as: "asset",
        },
      },
      { $unwind: { path: "$asset", preserveNullAndEmptyArrays: true } },
      { $match: this.getSiteMatch(filter) },
      {
        $group: {
          _id: null,
          completedJobs: { $sum: 1 },
          completedWithinSla: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $ne: ["$completion.completedAt", null] },
                    {
                      $lte: [
                        {
                          $subtract: ["$completion.completedAt", "$createdAt"],
                        },
                        SLA_TARGET_MS,
                      ],
                    },
                  ],
                },
                1,
                0,
              ],
            },
          },
        },
      },
    ]).exec();

    return {
      completedJobs: rows[0]?.completedJobs || 0,
      completedWithinSla: rows[0]?.completedWithinSla || 0,
    };
  }
}
