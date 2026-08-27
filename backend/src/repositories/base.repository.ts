import mongoose, {
  Model,
  Document,
  ProjectionType,
  QueryOptions,
  ClientSession,
  UpdateQuery,
} from "mongoose";
import type { Filter } from "mongodb";
import {
  parsePaginationQuery,
  formatPaginatedResult,
  PaginationQuery,
  PaginatedResult,
} from "../utils/pagination.js";

export abstract class BaseRepository<T extends Document> {
  protected readonly model: Model<T>;

  constructor(model: Model<T>) {
    this.model = model;
  }

  async create(data: Partial<T>, session?: ClientSession): Promise<T> {
    const doc = new this.model(data);
    return await doc.save({ session });
  }

  async findById(
    id: string | mongoose.Types.ObjectId,
    projection?: ProjectionType<T>,
    options?: QueryOptions<T>
  ): Promise<T | null> {
    return await this.model.findById(id, projection, options).exec();
  }

  async findOne(
    filter: Filter<T>,
    projection?: ProjectionType<T>,
    options?: QueryOptions<T>
  ): Promise<T | null> {
    return await this.model.findOne(filter, projection, options).exec();
  }

  async find(
    filter: Filter<T> = {},
    projection?: ProjectionType<T>,
    options?: QueryOptions<T>
  ): Promise<T[]> {
    return await this.model.find(filter, projection, options).exec();
  }

  async findWithPagination(
    filter: Filter<T> = {},
    paginationQuery: PaginationQuery = {},
    projection?: ProjectionType<T>
  ): Promise<PaginatedResult<T>> {
    const { page, limit, skip, sortOptions } = parsePaginationQuery(paginationQuery);

    const [items, total] = await Promise.all([
      this.model
        .find(filter, projection)
        .sort(sortOptions as Record<string, 1 | -1>)
        .skip(skip)
        .limit(limit)
        .exec(),
      this.model.countDocuments(filter).exec(),
    ]);

    return formatPaginatedResult(items, total, page, limit);
  }

  async updateById(
    id: string | mongoose.Types.ObjectId,
    update: UpdateQuery<T>,
    options: QueryOptions<T> = { new: true }
  ): Promise<T | null> {
    return await this.model.findByIdAndUpdate(id, update, options).exec();
  }

  async updateOne(
    filter: Filter<T>,
    update: UpdateQuery<T>,
    options: QueryOptions<T> = { new: true }
  ): Promise<T | null> {
    return await this.model.findOneAndUpdate(filter, update, options).exec();
  }

  async deleteById(id: string | mongoose.Types.ObjectId, session?: ClientSession): Promise<T | null> {
    return await this.model.findByIdAndDelete(id, { session }).exec();
  }

  async count(filter: Filter<T> = {}): Promise<number> {
    return await this.model.countDocuments(filter).exec();
  }

  async exists(filter: Filter<T>): Promise<boolean> {
    const count = await this.model.countDocuments(filter).limit(1).exec();
    return count > 0;
  }
}

export default BaseRepository;
