import { Document, FilterQuery, PopulateOptions } from "mongoose";

export interface QueryOptions {
  fields?: string;
  limit?: number;
  sort?: string;
  order?: "asc" | "desc";
  filter?: string;
  populate?: string;
}

export type PopulateInstruction = string | PopulateOptions;

export interface ParsedQueryOptions {
  select: string;
  limit: number;
  sort: Record<string, 1 | -1>;
  filter: FilterQuery<any>;
  populate?: PopulateInstruction[];
}

// Purpose: Parses and transforms query parameters into Mongoose-compatible query options for filtering, sorting, and field selection.
export class QueryBuilder {
  static parse<T extends Document>(
    options: QueryOptions,
    defaultLimit: number = 10,
  ): ParsedQueryOptions {
    const fieldOptions = this.parseFields(options.fields);

    const limit = options.limit ? parseInt(String(options.limit), 10) : defaultLimit;

    const sortField = options.sort || "createdAt";
    const sortOrder = options.order === "asc" ? 1 : -1;
    const sort: Record<string, 1 | -1> = { [sortField]: sortOrder };

    const filter: FilterQuery<T> = this.parseFilter(options.filter || "");

    const populate = this.mergePopulate(
      this.parsePopulate(options.populate),
      fieldOptions.populate,
    );

    return {
      select: fieldOptions.select,
      limit,
      sort,
      filter,
      populate: populate.length > 0 ? populate : undefined,
    };
  }

  private static parseFields(fields?: string): { select: string; populate: PopulateInstruction[] } {
    if (!fields || fields.trim().length === 0) {
      return { select: "_id", populate: [] };
    }

    const selectedRootFields = new Set<string>();
    const populateFieldsByPath = new Map<string, Set<string>>();

    fields
      .split(",")
      .map((field) => field.trim())
      .filter((field) => field.length > 0)
      .forEach((field) => {
        const parts = field.split(".").filter((part) => part.length > 0);

        if (parts.length < 2) {
          selectedRootFields.add(field);
          return;
        }

        const path = parts.slice(0, -1).join(".");
        const relatedField = parts[parts.length - 1];

        selectedRootFields.add(path);

        if (!populateFieldsByPath.has(path)) {
          populateFieldsByPath.set(path, new Set<string>());
        }

        populateFieldsByPath.get(path)?.add(relatedField);
      });

    const populate: PopulateInstruction[] = Array.from(populateFieldsByPath.entries()).map(
      ([path, relatedFields]) => ({
        path,
        select: Array.from(relatedFields).join(" "),
      }),
    );

    const select = selectedRootFields.size > 0 ? Array.from(selectedRootFields).join(" ") : "_id";

    return { select, populate };
  }

  private static parsePopulate(populate?: string): PopulateInstruction[] {
    if (!populate || populate.trim().length === 0) return [];

    return populate
      .split(",")
      .map((item) => item.trim())
      .filter((item) => item.length > 0)
      .map((item) => {
        const parts = item.split(".").filter((part) => part.length > 0);
        if (parts.length < 2) return item;

        return {
          path: parts.slice(0, -1).join("."),
          select: parts[parts.length - 1],
        };
      });
  }

  private static mergePopulate(
    primary: PopulateInstruction[],
    secondary: PopulateInstruction[],
  ): PopulateInstruction[] {
    const merged = new Map<string, Set<string>>();

    const register = (instruction: PopulateInstruction): void => {
      if (typeof instruction === "string") {
        if (!merged.has(instruction)) {
          merged.set(instruction, new Set<string>());
        }
        return;
      }

      const path = instruction.path;
      if (!path) return;

      if (!merged.has(path)) {
        merged.set(path, new Set<string>());
      }

      const select = typeof instruction.select === "string" ? instruction.select : "";
      select
        .split(" ")
        .map((field) => field.trim())
        .filter((field) => field.length > 0)
        .forEach((field) => merged.get(path)?.add(field));
    };

    [...primary, ...secondary].forEach(register);

    return Array.from(merged.entries()).map(([path, fields]) => {
      if (fields.size === 0) return path;

      return {
        path,
        select: Array.from(fields).join(" "),
      };
    });
  }

  private static parseFilter(filterString: string): FilterQuery<any> {
    if (!filterString) return {};

    const filter: FilterQuery<any> = {};
    const conditions = filterString.split(",");

    conditions.forEach((condition) => {
      const [field, value] = condition.split(":").map((s) => s.trim());
      if (field && value) {
        if (value.startsWith(">=")) {
          filter[field] = { $gte: value.substring(2) };
        } else if (value.startsWith("<=")) {
          filter[field] = { $lte: value.substring(2) };
        } else if (value.startsWith(">")) {
          filter[field] = { $gt: value.substring(1) };
        } else if (value.startsWith("<")) {
          filter[field] = { $lt: value.substring(1) };
        } else if (value.includes("*")) {
          filter[field] = { $regex: value.replace(/\*/g, ".*"), $options: "i" };
        } else {
          filter[field] = value;
        }
      }
    });

    return filter;
  }
}
