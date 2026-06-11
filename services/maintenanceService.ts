import { FilterQuery } from "mongoose";
import { generateUniqueCode } from "../helpers/generateCode";
import { ParsedQueryOptions } from "../helpers/queryBuilder";
import { AppError } from "../middleware/errorHandler";
import { MaintenanceModel } from "../models/maintenanceModel";
import { AssetRepository } from "../repositories/assetRepository";
import { MaintenanceRepository } from "../repositories/maintenanceRepository";
import { ServiceRequestRepository } from "../repositories/serviceRequestRepository";
import { UserRepository } from "../repositories/userRepository";
import {
  AssignTechnicianRequest,
  CompleteMaintenanceRequest,
  CreateMaintenanceRequest,
  DiagnosisNotesRequest,
  HoldMaintenanceRequest,
  MaintenanceStatusCount,
  MaintenanceStatusValue,
  OpenMaintenanceFromRequest,
  RepairActionLogRequest,
  StartMaintenanceRequest,
  TechnicianScorecardSummary,
  TechnicianScorecardSummaryQuery,
  TechnicianWorkloadSummary,
  UpdateMaintenanceRequest,
  maintenanceStatuses,
} from "../types/maintenance";
import { NotificationService } from "./notificationService";

type MaintenanceStatus = MaintenanceModel["status"];

// *Purpose: This maintenance class is responsible for handling the business logic of the maintenance entity. It interacts with the maintenance repository to perform CRUD operations on the maintenance entity.
export class MaintenanceService {
  private maintenanceRepository: MaintenanceRepository;
  private userRepository: UserRepository;
  private assetRepository: AssetRepository;
  private serviceRequestRepository: ServiceRequestRepository;
  private notificationService: NotificationService;

  constructor() {
    this.maintenanceRepository = new MaintenanceRepository();
    this.userRepository = new UserRepository();
    this.assetRepository = new AssetRepository();
    this.serviceRequestRepository = new ServiceRequestRepository();
    this.notificationService = new NotificationService();
  }

  private readonly validStatusTransitions: Record<MaintenanceStatus, MaintenanceStatus[]> = {
    Assigned: ["Diagnosing", "On Hold"],
    Diagnosing: ["Awaiting Parts", "Repair In Progress", "On Hold"],
    "Awaiting Parts": ["Repair In Progress", "On Hold"],
    "Repair In Progress": ["Ready for QA", "On Hold"],
    "On Hold": ["Assigned", "Diagnosing", "Awaiting Parts", "Repair In Progress", "Completed"],
    "Ready for QA": ["Repair In Progress", "Completed"],
    Completed: [],
  };

  private validateStatusTransition(
    currentStatus: MaintenanceStatus,
    nextStatus: MaintenanceStatus,
  ): void {
    if (currentStatus === nextStatus) return;

    const allowedStatuses = this.validStatusTransitions[currentStatus] || [];
    if (!allowedStatuses.includes(nextStatus)) {
      throw new AppError(
        `Invalid maintenance status transition from ${currentStatus} to ${nextStatus}`,
        400,
      );
    }
  }

  private buildTimeline(title: string, description: string, actor: string) {
    return {
      title,
      description,
      actor,
      createdAt: new Date(),
    };
  }

  private async notifyAssignedTechnician(
    maintenance: MaintenanceModel,
    title: string,
    message: string,
  ): Promise<void> {
    await this.notificationService.notifyUser({
      recipient: String(maintenance.assignment.technician),
      title,
      message,
      type: "Maintenance",
      relatedModel: "Maintenance",
      relatedId: maintenance._id.toString(),
      link: `/maintenance/${maintenance._id.toString()}`,
    });
  }

  private serializeDocument(document: unknown): Record<string, unknown> {
    const record = document as { toObject?: () => Record<string, unknown> };
    if (typeof record.toObject === "function") return record.toObject();
    return document as Record<string, unknown>;
  }

  private buildStatusBreakdown(counts: MaintenanceStatusCount[] = []): MaintenanceStatusCount[] {
    const countsByStatus = new Map<MaintenanceStatusValue, number>();
    maintenanceStatuses.forEach((status) => countsByStatus.set(status, 0));

    counts.forEach((count) => {
      countsByStatus.set(count.status, count.count);
    });

    return maintenanceStatuses.map((status) => ({
      status,
      count: countsByStatus.get(status) || 0,
    }));
  }

  private getActiveJobCount(statusBreakdown: MaintenanceStatusCount[]): number {
    return statusBreakdown
      .filter((statusCount) => statusCount.status !== "Completed")
      .reduce((total, statusCount) => total + statusCount.count, 0);
  }

  private calculateRate(count: number, total: number): number {
    if (total === 0) return 0;
    return Number(((count / total) * 100).toFixed(2));
  }

  private async getTechnicianOrFail(technicianId: string): Promise<Record<string, unknown>> {
    const technician = await this.userRepository.searchUser({
      _id: technicianId,
      role: "technician",
    });

    if (!technician) throw new AppError("Technician not found", 404);
    return this.serializeDocument(technician);
  }

  async getMaintenance(id: string, options?: ParsedQueryOptions): Promise<MaintenanceModel | null> {
    const maintenance = await this.maintenanceRepository.getMaintenance(id, options);
    if (!maintenance) throw new AppError("Maintenance not found", 404);
    return maintenance;
  }

  async getMaintenances(options?: ParsedQueryOptions): Promise<MaintenanceModel[]> {
    return this.maintenanceRepository.getMaintenances(options);
  }

  async createMaintenance(data: CreateMaintenanceRequest): Promise<MaintenanceModel> {
    const assignedTechnician = await this.userRepository.searchAndUpdate({
      _id: data.assignment.technician,
    });
    if (!assignedTechnician) throw new AppError("Assigned Technician not found", 400);

    const asset = await this.assetRepository.searchAndUpdate({ _id: data.asset });
    if (!asset) throw new AppError("Asset not found", 400);

    const serviceRequest = await this.serviceRequestRepository.searchAndUpdate({
      _id: data.serviceRequest,
    });
    if (!serviceRequest) throw new AppError("Service Request not found", 400);

    const provideCode = data.workOrder?.trim();

    let finalCode: string;
    if (provideCode && provideCode.length > 0) {
      finalCode = provideCode;
    } else {
      try {
        finalCode = await generateUniqueCode({
          prefix: "MW",
          exists: async (workOrder) =>
            Boolean(await this.maintenanceRepository.searchMaintenance({ workOrder })),
        });
      } catch (error) {
        throw new AppError("Unable to generate unique workOrder", 500);
      }
    }

    const maintenance = await this.maintenanceRepository.createMaintenance({
      ...data,
      workOrder: finalCode,
      timeline: [
        ...(data.timeline || []),
        this.buildTimeline("Maintenance job opened", "Maintenance job was created", "System"),
      ],
    });

    await this.serviceRequestRepository.searchAndUpdate(
      { _id: data.serviceRequest },
      { status: "In Progress" },
    );
    await this.assetRepository.searchAndUpdate({ _id: data.asset }, { status: "Under Repair" });

    await this.notifyAssignedTechnician(
      maintenance,
      "Maintenance job assigned",
      `${maintenance.workOrder} was assigned to you.`,
    );

    return maintenance;
  }

  async openMaintenanceFromRequest(data: OpenMaintenanceFromRequest): Promise<MaintenanceModel> {
    const assignedTechnician = await this.userRepository.searchAndUpdate({
      _id: data.assignment.technician,
    });
    if (!assignedTechnician) throw new AppError("Assigned Technician not found", 400);

    const serviceRequest = await this.serviceRequestRepository.searchAndUpdate({
      _id: data.serviceRequest,
    });
    if (!serviceRequest) throw new AppError("Service Request not found", 400);
    const serviceRequestRecord = serviceRequest as any;

    return this.createMaintenance({
      workOrder: data.workOrder,
      asset: serviceRequestRecord.asset as string,
      serviceRequest: data.serviceRequest,
      assignment: data.assignment,
      diagnosisNotes: data.diagnosisNotes,
      status: "Assigned",
    });
  }

  async updateMaintenance(
    data: Partial<UpdateMaintenanceRequest> & { _id: string },
  ): Promise<MaintenanceModel | null> {
    if (!data._id) throw new AppError("Maintenance ID is required", 400);

    const assignedTechnician = await this.userRepository.searchAndUpdate({
      _id: data.assignment?.technician,
    });
    if (data.assignment?.technician && !assignedTechnician)
      throw new AppError("Assigned Technician not found", 400);

    const asset = await this.assetRepository.searchAndUpdate({ _id: data.asset });
    if (data.asset && !asset) throw new AppError("Asset not found", 400);

    const serviceRequest = await this.serviceRequestRepository.searchAndUpdate({
      _id: data.serviceRequest,
    });
    if (data.serviceRequest && !serviceRequest)
      throw new AppError("Service Request not found", 400);

    const existingMaintenance = await this.maintenanceRepository.getMaintenance(data._id);
    if (!existingMaintenance) throw new AppError("Maintenance not found", 404);

    if (data.status) {
      this.validateStatusTransition(existingMaintenance.status, data.status);
    }

    if (data.status === "Completed") {
      const completion = data.completion || existingMaintenance.completion;
      if (!completion?.resolution || !completion?.partsUsed || !completion?.verifiedBy) {
        throw new AppError("Completion data is required before closing maintenance job", 400);
      }
    }

    const maintenance = await this.maintenanceRepository.updateMaintenance(data._id, data);
    if (!maintenance) throw new AppError("Maintenance not found", 404);

    if (data.status && data.status !== existingMaintenance.status) {
      await this.notifyAssignedTechnician(
        maintenance,
        "Maintenance status updated",
        `${maintenance.workOrder} moved to ${maintenance.status}.`,
      );
    }

    if (
      data.assignment?.technician &&
      String(data.assignment.technician) !== String(existingMaintenance.assignment.technician)
    ) {
      await this.notifyAssignedTechnician(
        maintenance,
        "Maintenance reassigned",
        `${maintenance.workOrder} was reassigned to you.`,
      );
    }

    return maintenance;
  }

  async assignTechnician(
    id: string,
    data: AssignTechnicianRequest,
  ): Promise<MaintenanceModel | null> {
    const assignedTechnician = await this.userRepository.searchAndUpdate({
      _id: data.technician,
    });
    if (!assignedTechnician) throw new AppError("Assigned Technician not found", 400);

    const maintenance = await this.maintenanceRepository.getMaintenance(id);
    if (!maintenance) throw new AppError("Maintenance not found", 404);
    if (maintenance.status === "Completed")
      throw new AppError("Completed job cannot be assigned", 400);

    const updatedMaintenance = await this.maintenanceRepository.updateMaintenanceQuery(id, {
      assignment: data,
      status: "Assigned",
      $push: {
        timeline: this.buildTimeline(
          "Technician assigned",
          "Technician assignment was updated",
          String(data.technician),
        ),
      },
    });

    if (updatedMaintenance) {
      await this.notifyAssignedTechnician(
        updatedMaintenance,
        "Maintenance job assigned",
        `${updatedMaintenance.workOrder} was assigned to you.`,
      );
    }

    return updatedMaintenance;
  }

  async startMaintenance(
    id: string,
    data: StartMaintenanceRequest,
  ): Promise<MaintenanceModel | null> {
    const maintenance = await this.maintenanceRepository.getMaintenance(id);
    if (!maintenance) throw new AppError("Maintenance not found", 404);

    this.validateStatusTransition(maintenance.status, "Diagnosing");

    const updatedMaintenance = await this.maintenanceRepository.updateMaintenanceQuery(id, {
      status: "Diagnosing",
      $push: {
        timeline: this.buildTimeline(
          "Maintenance started",
          "Maintenance job moved to diagnosing",
          data.actor,
        ),
      },
    });

    if (updatedMaintenance) {
      await this.notifyAssignedTechnician(
        updatedMaintenance,
        "Maintenance started",
        `${updatedMaintenance.workOrder} moved to diagnosing.`,
      );
    }

    return updatedMaintenance;
  }

  async addDiagnosisNotes(
    id: string,
    data: DiagnosisNotesRequest,
  ): Promise<MaintenanceModel | null> {
    const maintenance = await this.maintenanceRepository.getMaintenance(id);
    if (!maintenance) throw new AppError("Maintenance not found", 404);
    if (maintenance.status === "Completed")
      throw new AppError("Completed job cannot be updated", 400);

    return this.maintenanceRepository.updateMaintenanceQuery(id, {
      diagnosisNotes: data.diagnosisNotes,
      $push: {
        timeline: this.buildTimeline("Diagnosis notes added", data.diagnosisNotes, data.actor),
      },
    });
  }

  async addRepairActionLog(
    id: string,
    data: RepairActionLogRequest,
  ): Promise<MaintenanceModel | null> {
    const maintenance = await this.maintenanceRepository.getMaintenance(id);
    if (!maintenance) throw new AppError("Maintenance not found", 404);
    if (maintenance.status === "Completed")
      throw new AppError("Completed job cannot be updated", 400);

    return this.maintenanceRepository.updateMaintenanceQuery(id, {
      $push: {
        repairActions: {
          title: data.title,
          owner: data.owner,
          status: data.status || "Pending",
          note: data.note || "",
        },
        timeline: this.buildTimeline("Repair action added", data.title, data.actor),
      },
    });
  }

  async holdMaintenance(
    id: string,
    data: HoldMaintenanceRequest,
  ): Promise<MaintenanceModel | null> {
    const maintenance = await this.maintenanceRepository.getMaintenance(id);
    if (!maintenance) throw new AppError("Maintenance not found", 404);

    this.validateStatusTransition(maintenance.status, "On Hold");

    const updatedMaintenance = await this.maintenanceRepository.updateMaintenanceQuery(id, {
      status: "On Hold",
      $push: {
        timeline: this.buildTimeline("Maintenance put on hold", data.reason, data.actor),
      },
    });

    if (updatedMaintenance) {
      await this.notifyAssignedTechnician(
        updatedMaintenance,
        "Maintenance put on hold",
        `${updatedMaintenance.workOrder} was put on hold.`,
      );
    }

    return updatedMaintenance;
  }

  async completeMaintenance(
    id: string,
    data: CompleteMaintenanceRequest,
  ): Promise<MaintenanceModel | null> {
    const maintenance = await this.maintenanceRepository.getMaintenance(id);
    if (!maintenance) throw new AppError("Maintenance not found", 404);

    this.validateStatusTransition(maintenance.status, "Completed");

    const completedMaintenance = await this.maintenanceRepository.updateMaintenanceQuery(id, {
      status: "Completed",
      completion: {
        resolution: data.resolution,
        partsUsed: data.partsUsed,
        verifiedBy: data.verifiedBy,
        completedAt: new Date(),
      },
      $push: {
        timeline: this.buildTimeline("Maintenance completed", data.resolution, data.actor),
      },
    });

    await this.serviceRequestRepository.searchAndUpdate(
      { _id: maintenance.serviceRequest },
      { status: "Resolved" },
    );
    await this.assetRepository.searchAndUpdate(
      { _id: maintenance.asset },
      { status: "Operational", lastServiceDate: new Date() },
    );

    if (completedMaintenance) {
      await this.notifyAssignedTechnician(
        completedMaintenance,
        "Maintenance completed",
        `${completedMaintenance.workOrder} has been completed.`,
      );
    }

    return completedMaintenance;
  }

  async getMaintenanceHistory(options?: ParsedQueryOptions): Promise<MaintenanceModel[]> {
    return this.maintenanceRepository.getMaintenances(options);
  }

  async getAssetMaintenanceHistory(
    assetId: string,
    options?: ParsedQueryOptions,
  ): Promise<MaintenanceModel[]> {
    return this.maintenanceRepository.getMaintenances({
      ...options,
      filter: {
        ...(options?.filter || {}),
        asset: assetId,
      },
    } as ParsedQueryOptions);
  }

  async getTechnicianMaintenanceHistory(
    technicianId: string,
    options?: ParsedQueryOptions,
  ): Promise<MaintenanceModel[]> {
    await this.getTechnicianOrFail(technicianId);

    return this.maintenanceRepository.getMaintenances({
      ...options,
      filter: {
        ...(options?.filter || {}),
        "assignment.technician": technicianId,
      },
    } as ParsedQueryOptions);
  }

  async getTechnicianWorkloads(options?: ParsedQueryOptions): Promise<TechnicianWorkloadSummary[]> {
    const technicianOptions = {
      ...options,
      select:
        options?.select && options.select !== "_id"
          ? options.select
          : "username firstName lastName middleName email avatar role",
      filter: {
        ...(options?.filter || {}),
        role: "technician",
      },
    } as ParsedQueryOptions;

    const technicians = await this.userRepository.getUsers(technicianOptions);
    const technicianIds = technicians.map((technician) => String(technician._id));
    const workloads = await this.maintenanceRepository.getTechnicianStatusCounts(technicianIds);
    const workloadsByTechnician = new Map(
      workloads.map((workload) => [workload.technician, workload]),
    );

    return technicians.map((technician) => {
      const technicianId = String(technician._id);
      const workload = workloadsByTechnician.get(technicianId);
      const statusBreakdown = this.buildStatusBreakdown(workload?.counts);
      const completedJobs =
        statusBreakdown.find((statusCount) => statusCount.status === "Completed")?.count || 0;

      return {
        technician: this.serializeDocument(technician),
        totalJobs: workload?.total || 0,
        activeJobs: this.getActiveJobCount(statusBreakdown),
        completedJobs,
        statusBreakdown,
      };
    });
  }

  async getTechnicianScorecardSummary(
    technicianId: string,
    query: TechnicianScorecardSummaryQuery,
  ): Promise<TechnicianScorecardSummary> {
    const technician = await this.getTechnicianOrFail(technicianId);
    const fromDate = query.from ? new Date(query.from) : undefined;
    const toDate = query.to ? new Date(query.to) : undefined;

    if (fromDate && toDate && fromDate > toDate) {
      throw new AppError("Scorecard from date cannot be later than to date", 400);
    }

    const filter: FilterQuery<MaintenanceModel> & {
      createdAt?: { $gte?: Date; $lte?: Date };
    } = {
      "assignment.technician": technicianId,
    };

    if (fromDate || toDate) {
      filter.createdAt = {};
      if (fromDate) filter.createdAt.$gte = fromDate;
      if (toDate) filter.createdAt.$lte = toDate;
    }

    const jobs = await this.maintenanceRepository.getMaintenancesByFilter(filter);
    const statusCounts = jobs.reduce<MaintenanceStatusCount[]>((counts, job) => {
      const existingCount = counts.find((count) => count.status === job.status);
      if (existingCount) {
        existingCount.count += 1;
        return counts;
      }

      counts.push({ status: job.status, count: 1 });
      return counts;
    }, []);

    const statusBreakdown = this.buildStatusBreakdown(statusCounts);
    const totalJobs = jobs.length;
    const completedJobs =
      statusBreakdown.find((statusCount) => statusCount.status === "Completed")?.count || 0;
    const activeJobs = this.getActiveJobCount(statusBreakdown);
    const repairActions = jobs.reduce((total, job) => total + job.repairActions.length, 0);
    const completedRepairActions = jobs.reduce(
      (total, job) =>
        total + job.repairActions.filter((repairAction) => repairAction.status === "Done").length,
      0,
    );
    const lastCompletedAt = jobs.reduce<Date | null>((latestDate, job) => {
      const completedAt = job.completion?.completedAt || null;
      if (!completedAt) return latestDate;
      if (!latestDate || completedAt > latestDate) return completedAt;
      return latestDate;
    }, null);

    return {
      technician,
      dateRange: {
        from: query.from,
        to: query.to,
      },
      totalJobs,
      activeJobs,
      completedJobs,
      completionRate: this.calculateRate(completedJobs, totalJobs),
      repairActions,
      completedRepairActions,
      repairActionCompletionRate: this.calculateRate(completedRepairActions, repairActions),
      lastCompletedAt,
      statusBreakdown,
    };
  }

  async deleteMaintenance(id: string): Promise<MaintenanceModel | null> {
    const maintenance = await this.maintenanceRepository.deleteMaintenance(id);
    if (!maintenance) throw new AppError("Maintenance not found", 404);
    return maintenance;
  }

  async searchMaintenance(query: FilterQuery<MaintenanceModel>): Promise<MaintenanceModel | null> {
    const maintenance = await this.maintenanceRepository.searchMaintenance(query);
    if (!maintenance) throw new AppError("Maintenance not found", 404);
    return maintenance;
  }
}
