import { describe, it, expect, vi } from "vitest";
import { Document, Model } from "mongoose";
import { BaseRepository } from "./base.repository.js";

interface TestDoc extends Document {
  title: string;
  count: number;
}

describe("BaseRepository Data Access Layer", () => {
  const mockExec = vi.fn();
  const mockSort = vi.fn().mockReturnValue({
    skip: vi.fn().mockReturnValue({
      limit: vi.fn().mockReturnValue({
        exec: mockExec,
      }),
    }),
  });

  const mockModel = {
    findById: vi.fn().mockReturnValue({ exec: mockExec }),
    findOne: vi.fn().mockReturnValue({ exec: mockExec }),
    find: vi.fn().mockReturnValue({ sort: mockSort, exec: mockExec }),
    findByIdAndUpdate: vi.fn().mockReturnValue({ exec: mockExec }),
    findOneAndUpdate: vi.fn().mockReturnValue({ exec: mockExec }),
    findByIdAndDelete: vi.fn().mockReturnValue({ exec: mockExec }),
    countDocuments: vi.fn().mockReturnValue({
      exec: vi.fn().mockResolvedValue(10),
      limit: vi.fn().mockReturnValue({
        exec: vi.fn().mockResolvedValue(1),
      }),
    }),
  } as unknown as Model<TestDoc>;

  class TestRepository extends BaseRepository<TestDoc> {
    constructor() {
      super(mockModel);
    }
  }

  const repository = new TestRepository();

  it("should find by ID using Mongoose model", async () => {
    mockExec.mockResolvedValueOnce({ _id: "doc-123", title: "Test Doc" });
    const result = await repository.findById("doc-123");
    expect(mockModel.findById).toHaveBeenCalledWith("doc-123", undefined, undefined);
    expect(result).toEqual({ _id: "doc-123", title: "Test Doc" });
  });

  it("should find one document using filter", async () => {
    mockExec.mockResolvedValueOnce({ title: "Specific Doc" });
    const result = await repository.findOne({ title: "Specific Doc" });
    expect(mockModel.findOne).toHaveBeenCalledWith({ title: "Specific Doc" }, undefined, undefined);
    expect(result).toEqual({ title: "Specific Doc" });
  });

  it("should support pagination query parsing and formatting", async () => {
    mockExec.mockResolvedValueOnce([{ title: "Doc 1" }, { title: "Doc 2" }]);
    const result = await repository.findWithPagination({}, { page: 1, limit: 2 });
    expect(result.items).toHaveLength(2);
    expect(result.pagination.total).toBe(10);
    expect(result.pagination.limit).toBe(2);
    expect(result.pagination.totalPages).toBe(5);
  });

  it("should check existence of a document", async () => {
    const exists = await repository.exists({ title: "Test Doc" });
    expect(exists).toBe(true);
  });
});
