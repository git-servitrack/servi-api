import fs from "fs";
import path from "path";
import { parse } from "csv-parse/sync";

export interface KagglePredictiveMaintenanceRow {
  type: "L" | "M" | "H";
  airTemperature: number;
  processTemperature: number;
  rotationalSpeed: number;
  torque: number;
  toolWear: number;
  target: 0 | 1;
  failureType: string;
}

export interface DatasetSummary {
  datasetPath: string;
  totalRows: number;
  usableRows: number;
  skippedRows: number;
  targetDistribution: Record<string, number>;
  failureTypeDistribution: Record<string, number>;
}

type RawCsvRow = Record<string, string | undefined>;

const requiredColumns = [
  "Type",
  "Air temperature [K]",
  "Process temperature [K]",
  "Rotational speed [rpm]",
  "Torque [Nm]",
  "Tool wear [min]",
  "Target",
  "Failure Type",
];

export const predictiveMaintenanceDataRoot = path.resolve(
  process.cwd(),
  "data",
);
export const defaultPredictiveMaintenanceDataset = path.join(
  predictiveMaintenanceDataRoot,
  "KAGGLE_DATA.csv",
);

const toNumber = (value: string | undefined): number => {
  if (!value) return Number.NaN;
  return Number(value.trim());
};

const isMachineType = (value: string): value is "L" | "M" | "H" => {
  return ["L", "M", "H"].includes(value);
};

export const resolvePredictiveMaintenanceDatasetPath = (
  datasetPath?: string,
): string => {
  const resolvedPath = datasetPath
    ? path.resolve(process.cwd(), datasetPath)
    : defaultPredictiveMaintenanceDataset;

  if (!resolvedPath.startsWith(predictiveMaintenanceDataRoot)) {
    throw new Error(
      "Predictive maintenance datasets must be stored inside the data folder",
    );
  }

  return resolvedPath;
};

export const loadKagglePredictiveMaintenanceDataset = (
  datasetPath?: string,
): { rows: KagglePredictiveMaintenanceRow[]; summary: DatasetSummary } => {
  const resolvedPath = resolvePredictiveMaintenanceDatasetPath(datasetPath);

  if (!fs.existsSync(resolvedPath)) {
    throw new Error("Predictive maintenance dataset not found");
  }

  const csv = fs.readFileSync(resolvedPath, "utf8");
  const records = parse(csv, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
  }) as RawCsvRow[];

  const missingColumn = requiredColumns.find(
    (column) => !(column in (records[0] || {})),
  );
  if (missingColumn) {
    throw new Error(
      `Predictive maintenance dataset is missing column: ${missingColumn}`,
    );
  }

  const rows: KagglePredictiveMaintenanceRow[] = [];

  records.forEach((record) => {
    const type = (record["Type"] || "").trim();
    const airTemperature = toNumber(record["Air temperature [K]"]);
    const processTemperature = toNumber(record["Process temperature [K]"]);
    const rotationalSpeed = toNumber(record["Rotational speed [rpm]"]);
    const torque = toNumber(record["Torque [Nm]"]);
    const toolWear = toNumber(record["Tool wear [min]"]);
    const target = toNumber(record["Target"]);
    const failureType = (record["Failure Type"] || "").trim();

    const valid =
      isMachineType(type) &&
      [
        airTemperature,
        processTemperature,
        rotationalSpeed,
        torque,
        toolWear,
        target,
      ].every(Number.isFinite) &&
      [0, 1].includes(target) &&
      failureType.length > 0;

    if (!valid) return;

    rows.push({
      type,
      airTemperature,
      processTemperature,
      rotationalSpeed,
      torque,
      toolWear,
      target: target as 0 | 1,
      failureType,
    });
  });

  const targetDistribution = rows.reduce<Record<string, number>>(
    (distribution, row) => {
      distribution[row.target] = (distribution[row.target] || 0) + 1;
      return distribution;
    },
    {},
  );

  const failureTypeDistribution = rows.reduce<Record<string, number>>(
    (distribution, row) => {
      distribution[row.failureType] = (distribution[row.failureType] || 0) + 1;
      return distribution;
    },
    {},
  );

  return {
    rows,
    summary: {
      datasetPath: path.relative(process.cwd(), resolvedPath),
      totalRows: records.length,
      usableRows: rows.length,
      skippedRows: records.length - rows.length,
      targetDistribution,
      failureTypeDistribution,
    },
  };
};
