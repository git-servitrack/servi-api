import fs from "fs";
import path from "path";
import {
  KagglePredictiveMaintenanceRow,
  loadKagglePredictiveMaintenanceDataset,
} from "./predictiveMaintenanceDataset";

interface DecisionTreeOptions {
  gainFunction?: "gini";
  splitFunction?: "mean";
  minNumSamples?: number;
  maxDepth?: number;
}

interface DecisionTreeClassifierInstance {
  train(trainingSet: number[][], predictions: number[]): void;
  predict(dataset: number[][]): number[];
  toJSON(): Record<string, unknown>;
}

interface DecisionTreeClassifierConstructor {
  new (options?: DecisionTreeOptions): DecisionTreeClassifierInstance;
  load(model: Record<string, unknown>): DecisionTreeClassifierInstance;
}

const { DecisionTreeClassifier } = require("ml-cart") as {
  DecisionTreeClassifier: DecisionTreeClassifierConstructor;
};

export interface DecisionTreeFeatureInput {
  type: "L" | "M" | "H";
  airTemperature: number;
  processTemperature: number;
  rotationalSpeed: number;
  torque: number;
  toolWear: number;
}

export interface PredictiveMaintenanceTrainingOptions {
  datasetPath?: string;
  validationRatio?: number;
  maxDepth?: number;
  minNumSamples?: number;
}

export interface TrainedPredictiveMaintenanceModel {
  version: string;
  trainedAt: string;
  datasetPath: string;
  featureColumns: string[];
  typeEncoding: Record<"L" | "M" | "H", number>;
  failureTypeLabels: string[];
  targetModel: Record<string, unknown>;
  failureTypeModel: Record<string, unknown>;
  metrics: {
    rowCount: number;
    trainingRows: number;
    validationRows: number;
    targetAccuracy: number;
    failureTypeAccuracy: number;
    targetDistribution: Record<string, number>;
    failureTypeDistribution: Record<string, number>;
  };
}

export interface PredictiveMaintenancePrediction {
  target: 0 | 1;
  hasFailureRisk: boolean;
  failureType: string;
  riskLevel: "Low" | "Medium" | "High" | "Critical";
  riskScore: number;
  failureLikelihood: number;
  recommendedMaintenanceWindow: string;
  nextMaintenanceRecommendation: string;
  explanation: {
    summary: string;
    factors: string[];
  };
  modelVersion: string;
  sourceDataset: string;
  modelMetrics: TrainedPredictiveMaintenanceModel["metrics"];
}

const modelDirectory = path.resolve(
  process.cwd(),
  "data",
  "models",
  "predictive-maintenance",
);
const modelPath = path.join(modelDirectory, "decision-tree-model.json");

const typeEncoding: Record<"L" | "M" | "H", number> = {
  L: 0,
  M: 1,
  H: 2,
};

const featureColumns = [
  "Type",
  "Air temperature [K]",
  "Process temperature [K]",
  "Rotational speed [rpm]",
  "Torque [Nm]",
  "Tool wear [min]",
];

const toFeatureVector = (input: DecisionTreeFeatureInput): number[] => [
  typeEncoding[input.type],
  input.airTemperature,
  input.processTemperature,
  input.rotationalSpeed,
  input.torque,
  input.toolWear,
];

const shuffleRows = <T>(rows: T[]): T[] => {
  const shuffled = [...rows];

  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [shuffled[index], shuffled[swapIndex]] = [
      shuffled[swapIndex],
      shuffled[index],
    ];
  }

  return shuffled;
};

const balanceTargetRows = (
  rows: KagglePredictiveMaintenanceRow[],
): KagglePredictiveMaintenanceRow[] => {
  const failureRows = rows.filter((row) => row.target === 1);
  const noFailureRows = rows.filter((row) => row.target === 0);

  if (failureRows.length === 0 || noFailureRows.length === 0) return rows;

  const minorityRows =
    failureRows.length < noFailureRows.length ? failureRows : noFailureRows;
  const majorityRows =
    failureRows.length >= noFailureRows.length ? failureRows : noFailureRows;
  const balancedRows = [...majorityRows];

  for (
    let index = 0;
    balancedRows.length < majorityRows.length * 2;
    index += 1
  ) {
    balancedRows.push(minorityRows[index % minorityRows.length]);
  }

  return shuffleRows(balancedRows);
};

const getStratifiedTrainingRows = (
  rows: KagglePredictiveMaintenanceRow[],
): KagglePredictiveMaintenanceRow[] => {
  const failureRows = rows.filter((row) => row.target === 1);
  const noFailureRows = rows.filter((row) => row.target === 0);

  if (failureRows.length === 0 || noFailureRows.length === 0) return rows;

  const noFailureSampleSize = Math.min(
    noFailureRows.length,
    Math.max(failureRows.length * 3, 1000),
  );

  return shuffleRows([
    ...failureRows,
    ...shuffleRows(noFailureRows).slice(0, noFailureSampleSize),
  ]);
};

const calculateAccuracy = (actual: number[], predicted: number[]): number => {
  if (actual.length === 0) return 0;

  const correct = actual.filter(
    (value, index) => value === predicted[index],
  ).length;
  return Number((correct / actual.length).toFixed(4));
};

const getRiskLevel = (
  riskScore: number,
): PredictiveMaintenancePrediction["riskLevel"] => {
  if (riskScore >= 85) return "Critical";
  if (riskScore >= 65) return "High";
  if (riskScore >= 35) return "Medium";
  return "Low";
};

const getMaintenanceWindow = (
  riskLevel: PredictiveMaintenancePrediction["riskLevel"],
): string => {
  const windows: Record<PredictiveMaintenancePrediction["riskLevel"], string> =
    {
      Critical: "Immediate inspection required",
      High: "Within 7 days",
      Medium: "Within 30 days",
      Low: "Next scheduled maintenance cycle",
    };

  return windows[riskLevel];
};

const getRecommendation = (
  riskLevel: PredictiveMaintenancePrediction["riskLevel"],
  failureType: string,
): string => {
  if (riskLevel === "Critical")
    return `Stop-use review and inspect for ${failureType}`;
  if (riskLevel === "High")
    return `Prioritize preventive maintenance for ${failureType}`;
  if (riskLevel === "Medium")
    return "Schedule inspection and monitor operating conditions";
  return "Continue regular monitoring";
};

const buildRiskScore = (
  input: DecisionTreeFeatureInput,
  target: 0 | 1,
  failureType: string,
): { riskScore: number; factors: string[] } => {
  const factors: string[] = [];
  let riskScore = target === 1 || failureType !== "No Failure" ? 72 : 18;

  if (target === 1)
    factors.push("Decision tree classified this reading as a failure risk");
  if (failureType !== "No Failure")
    factors.push(`Predicted failure type is ${failureType}`);

  const temperatureGap = input.processTemperature - input.airTemperature;
  if (temperatureGap >= 12) {
    riskScore += 8;
    factors.push(
      "Process temperature is significantly higher than air temperature",
    );
  }

  if (input.toolWear >= 200) {
    riskScore += 15;
    factors.push("Tool wear is very high");
  } else if (input.toolWear >= 150) {
    riskScore += 10;
    factors.push("Tool wear is elevated");
  }

  if (input.torque >= 60) {
    riskScore += 8;
    factors.push("Torque is high");
  }

  if (input.rotationalSpeed <= 1300) {
    riskScore += 5;
    factors.push("Rotational speed is below normal operating range");
  }

  riskScore = Math.min(100, Math.max(0, riskScore));
  if (factors.length === 0) factors.push("No strong failure indicators found");

  return { riskScore, factors };
};

export class PredictiveMaintenanceTree {
  private getOptions(
    options: PredictiveMaintenanceTrainingOptions,
  ): DecisionTreeOptions {
    return {
      gainFunction: "gini",
      maxDepth: options.maxDepth || 8,
      minNumSamples: options.minNumSamples || 3,
    };
  }

  private ensureModelDirectory(): void {
    if (!fs.existsSync(modelDirectory)) {
      fs.mkdirSync(modelDirectory, { recursive: true });
    }
  }

  modelExists(): boolean {
    return fs.existsSync(modelPath);
  }

  train(
    options: PredictiveMaintenanceTrainingOptions = {},
  ): TrainedPredictiveMaintenanceModel {
    const { rows, summary } = loadKagglePredictiveMaintenanceDataset(
      options.datasetPath,
    );
    if (rows.length < 10)
      throw new Error("Not enough predictive maintenance rows for training");

    const validationRatio = options.validationRatio || 0.2;
    const shuffledRows = shuffleRows(rows);
    const validationSize = Math.max(
      1,
      Math.floor(shuffledRows.length * validationRatio),
    );
    const validationRows = shuffledRows.slice(0, validationSize);
    const trainingRows = getStratifiedTrainingRows(
      shuffledRows.slice(validationSize),
    );
    const balancedTrainingRows = balanceTargetRows(trainingRows);
    const decisionTreeOptions = this.getOptions(options);

    const targetClassifier = new DecisionTreeClassifier(decisionTreeOptions);
    targetClassifier.train(
      balancedTrainingRows.map(toFeatureVector),
      balancedTrainingRows.map((row) => row.target),
    );

    const failureTypeLabels = Array.from(
      new Set(rows.map((row) => row.failureType)),
    ).sort();
    const failureTypeClassifier = new DecisionTreeClassifier(
      decisionTreeOptions,
    );
    failureTypeClassifier.train(
      trainingRows.map(toFeatureVector),
      trainingRows.map((row) => failureTypeLabels.indexOf(row.failureType)),
    );

    const validationFeatures = validationRows.map(toFeatureVector);
    const targetPredictions = targetClassifier.predict(validationFeatures);
    const failureTypePredictions =
      failureTypeClassifier.predict(validationFeatures);
    const actualTargets = validationRows.map((row) => row.target);
    const actualFailureTypes = validationRows.map((row) =>
      failureTypeLabels.indexOf(row.failureType),
    );

    const trainedModel: TrainedPredictiveMaintenanceModel = {
      version: `pm-dt-${Date.now()}`,
      trainedAt: new Date().toISOString(),
      datasetPath: summary.datasetPath,
      featureColumns,
      typeEncoding,
      failureTypeLabels,
      targetModel: targetClassifier.toJSON(),
      failureTypeModel: failureTypeClassifier.toJSON(),
      metrics: {
        rowCount: summary.usableRows,
        trainingRows: trainingRows.length,
        validationRows: validationRows.length,
        targetAccuracy: calculateAccuracy(actualTargets, targetPredictions),
        failureTypeAccuracy: calculateAccuracy(
          actualFailureTypes,
          failureTypePredictions,
        ),
        targetDistribution: summary.targetDistribution,
        failureTypeDistribution: summary.failureTypeDistribution,
      },
    };

    this.ensureModelDirectory();
    fs.writeFileSync(modelPath, JSON.stringify(trainedModel, null, 2));

    return trainedModel;
  }

  load(): TrainedPredictiveMaintenanceModel {
    if (!this.modelExists()) {
      return this.train();
    }

    return JSON.parse(
      fs.readFileSync(modelPath, "utf8"),
    ) as TrainedPredictiveMaintenanceModel;
  }

  predict(input: DecisionTreeFeatureInput): PredictiveMaintenancePrediction {
    const trainedModel = this.load();
    const targetClassifier = DecisionTreeClassifier.load(
      trainedModel.targetModel,
    );
    const failureTypeClassifier = DecisionTreeClassifier.load(
      trainedModel.failureTypeModel,
    );
    const featureVector = [toFeatureVector(input)];

    const target = targetClassifier.predict(featureVector)[0] as 0 | 1;
    const failureTypeIndex = failureTypeClassifier.predict(featureVector)[0];
    const failureType =
      trainedModel.failureTypeLabels[failureTypeIndex] || "No Failure";
    const hasFailureRisk = target === 1 || failureType !== "No Failure";
    const { riskScore, factors } = buildRiskScore(input, target, failureType);
    const riskLevel = getRiskLevel(riskScore);

    return {
      target,
      hasFailureRisk,
      failureType,
      riskLevel,
      riskScore,
      failureLikelihood: Number((riskScore / 100).toFixed(2)),
      recommendedMaintenanceWindow: getMaintenanceWindow(riskLevel),
      nextMaintenanceRecommendation: getRecommendation(riskLevel, failureType),
      explanation: {
        summary: hasFailureRisk
          ? `Decision tree predicted ${failureType} risk`
          : "Decision tree predicted no immediate failure",
        factors,
      },
      modelVersion: trainedModel.version,
      sourceDataset: trainedModel.datasetPath,
      modelMetrics: trainedModel.metrics,
    };
  }
}
