import { cloudinary } from "../config/cloudinary";
import { AppError } from "../middleware/errorHandler";

export interface CloudinaryUploadOptions {
  folderPath?: string | string[];
}

export interface CloudinaryUploadResult {
  secureUrl: string;
  publicId: string;
  folder: string;
}

export class Cloudinary {
  private readonly rootFolder = "servi-assets";

  private normalizeFolderSegment(segment: string): string {
    return segment
      .trim()
      .replace(/\\/g, "/")
      .split("/")
      .map((part) =>
        part
          .trim()
          .toLowerCase()
          .replace(/[^a-z0-9-_]/g, "-")
          .replace(/-+/g, "-")
          .replace(/^-|-$/g, ""),
      )
      .filter(Boolean)
      .join("/");
  }

  private buildFolder(folderPath?: string | string[]): string {
    const folderSegments = Array.isArray(folderPath)
      ? folderPath
      : [folderPath || "user-avatars"];
    const sanitizedSegments = folderSegments
      .map((segment) => this.normalizeFolderSegment(segment))
      .filter(Boolean);

    return [this.rootFolder, ...sanitizedSegments].join("/");
  }

  async uploadImage(
    file: Express.Multer.File,
    options: CloudinaryUploadOptions = {},
  ): Promise<CloudinaryUploadResult> {
    try {
      const b64 = Buffer.from(file.buffer).toString("base64");
      const dataURI = `data:${file.mimetype};base64,${b64}`;
      const folder = this.buildFolder(options.folderPath);

      const result = await cloudinary.uploader.upload(dataURI, {
        resource_type: "auto",
        folder,
        use_filename: true,
        unique_filename: true,
        overwrite: true,
      });

      return {
        secureUrl: result.secure_url,
        publicId: result.public_id,
        folder,
      };
    } catch (error) {
      throw new AppError("Error uploading image to Cloudinary", 500, false);
    }
  }

  async deleteImage(publicId: string): Promise<void> {
    try {
      await cloudinary.uploader.destroy(publicId);
    } catch (error) {
      throw new AppError("Error deleting image from Cloudinary", 500, false);
    }
  }
}
