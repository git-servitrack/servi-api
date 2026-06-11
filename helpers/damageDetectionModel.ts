import fs from "fs";
import path from "path";
import * as tf from "@tensorflow/tfjs";
import sharp from "sharp";
import { env } from "../config/env";
import { AppError } from "../middleware/errorHandler";

interface TeachableMachineMetadata {
  tfjsVersion?: string;
  tmVersion?: string;
  packageVersion?: string;
  packageName?: string;
  modelName?: string;
  timeStamp?: string;
  labels: string[];
  imageSize?: number;
}

interface TeachableMachineModelJson {
  format?: string;
  generatedBy?: string;
  convertedBy?: string;
  modelTopology: Record<string, unknown>;
  weightsManifest: {
    paths: string[];
    weights: tf.io.WeightsManifestEntry[];
  }[];
}

export interface DamageDetectionPredictionScore {
  label: string;
  confidence: number;
}

export interface DamageDetectionInferenceResult {
  modelName: string;
  modelVersion: string;
  modelPath: string;
  labels: string[];
  imageSize: number;
  topLabel: string;
  confidenceScore: number;
  allPredictions: DamageDetectionPredictionScore[];
}

const toArrayBuffer = (buffer: Buffer): ArrayBuffer => {
  const arrayBuffer = new ArrayBuffer(buffer.byteLength);
  new Uint8Array(arrayBuffer).set(buffer);
  return arrayBuffer;
};

const getModelDirectory = (): string =>
  path.isAbsolute(env.DAMAGE_DETECTION_MODEL_DIR)
    ? env.DAMAGE_DETECTION_MODEL_DIR
    : path.resolve(process.cwd(), env.DAMAGE_DETECTION_MODEL_DIR);

export class DamageDetectionModel {
  private model?: tf.LayersModel;
  private metadata?: TeachableMachineMetadata;
  private readonly modelDirectory: string;

  constructor() {
    this.modelDirectory = getModelDirectory();
  }

  private get modelJsonPath(): string {
    return path.join(this.modelDirectory, "model.json");
  }

  private get metadataPath(): string {
    return path.join(this.modelDirectory, "metadata.json");
  }

  private ensureModelFiles(): void {
    if (!fs.existsSync(this.modelJsonPath)) {
      throw new AppError("Damage detection model.json not found", 500, false);
    }

    if (!fs.existsSync(this.metadataPath)) {
      throw new AppError("Damage detection metadata.json not found", 500, false);
    }
  }

  private loadMetadata(): TeachableMachineMetadata {
    if (this.metadata) return this.metadata;

    this.ensureModelFiles();
    const metadata = JSON.parse(
      fs.readFileSync(this.metadataPath, "utf8"),
    ) as TeachableMachineMetadata;

    if (!Array.isArray(metadata.labels) || metadata.labels.length === 0) {
      throw new AppError("Damage detection metadata labels are missing", 500, false);
    }

    this.metadata = metadata;
    return metadata;
  }

  private loadModelJson(): TeachableMachineModelJson {
    this.ensureModelFiles();
    return JSON.parse(
      fs.readFileSync(this.modelJsonPath, "utf8"),
    ) as TeachableMachineModelJson;
  }

  private createLocalModelLoader(modelJson: TeachableMachineModelJson): tf.io.IOHandler {
    return {
      load: async (): Promise<tf.io.ModelArtifacts> => {
        const weightSpecs = modelJson.weightsManifest.flatMap(
          (group) => group.weights,
        );
        const weightBuffers = modelJson.weightsManifest.flatMap((group) =>
          group.paths.map((weightPath) =>
            fs.readFileSync(path.join(this.modelDirectory, weightPath)),
          ),
        );
        const weightData = toArrayBuffer(Buffer.concat(weightBuffers));

        return {
          modelTopology: modelJson.modelTopology,
          weightSpecs,
          weightData,
          format: modelJson.format,
          generatedBy: modelJson.generatedBy,
          convertedBy: modelJson.convertedBy,
        };
      },
    };
  }

  private async loadModel(): Promise<tf.LayersModel> {
    if (this.model) return this.model;

    const modelJson = this.loadModelJson();
    this.model = await tf.loadLayersModel(this.createLocalModelLoader(modelJson));
    return this.model;
  }

  private async createInputTensor(
    imageBuffer: Buffer,
    imageSize: number,
  ): Promise<tf.Tensor4D> {
    const { data, info } = await sharp(imageBuffer)
      .rotate()
      .resize(imageSize, imageSize, { fit: "cover", position: "centre" })
      .toColorspace("srgb")
      .removeAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });

    if (info.channels !== 3) {
      throw new AppError("Damage detection image preprocessing failed", 400);
    }

    return tf.tidy(() => {
      const pixels = tf.tensor3d(
        new Uint8Array(data),
        [imageSize, imageSize, 3],
        "int32",
      );

      return pixels
        .expandDims(0)
        .toFloat()
        .div(tf.scalar(127))
        .sub(tf.scalar(1)) as tf.Tensor4D;
    });
  }

  async predict(imageBuffer: Buffer): Promise<DamageDetectionInferenceResult> {
    const metadata = this.loadMetadata();
    const model = await this.loadModel();
    const imageSize = metadata.imageSize || 224;
    const input = await this.createInputTensor(imageBuffer, imageSize);

    try {
      const prediction = model.predict(input) as tf.Tensor;
      const values = await prediction.data();
      prediction.dispose();

      const allPredictions = metadata.labels
        .map((label, index) => ({
          label,
          confidence: Number((values[index] || 0).toFixed(4)),
        }))
        .sort((first, second) => second.confidence - first.confidence);
      const topPrediction = allPredictions[0];

      return {
        modelName: metadata.modelName || "tm-my-image-model",
        modelVersion:
          metadata.timeStamp ||
          metadata.tmVersion ||
          metadata.packageVersion ||
          "unknown",
        modelPath: this.modelDirectory,
        labels: metadata.labels,
        imageSize,
        topLabel: topPrediction.label,
        confidenceScore: topPrediction.confidence,
        allPredictions,
      };
    } finally {
      input.dispose();
    }
  }
}
