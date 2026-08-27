import { describe, it, expect } from "vitest";
import { parsePaginationQuery, formatPaginatedResult } from "./pagination.js";

describe("Pagination & Query Utilities", () => {
  it("should apply default values when no query parameters are provided", () => {
    const result = parsePaginationQuery({});
    expect(result.page).toBe(1);
    expect(result.limit).toBe(20);
    expect(result.skip).toBe(0);
    expect(result.sortBy).toBe("createdAt");
    expect(result.sortOrder).toBe("desc");
    expect(result.sortOptions).toEqual({ createdAt: -1 });
  });

  it("should parse valid pagination and sorting parameters", () => {
    const result = parsePaginationQuery({
      page: "3",
      limit: "15",
      sortBy: "name",
      sortOrder: "asc",
    });
    expect(result.page).toBe(3);
    expect(result.limit).toBe(15);
    expect(result.skip).toBe(30); // (3 - 1) * 15
    expect(result.sortBy).toBe("name");
    expect(result.sortOrder).toBe("asc");
    expect(result.sortOptions).toEqual({ name: 1 });
  });

  it("should cap limit to MAX_LIMIT (100) to prevent denial of service", () => {
    const result = parsePaginationQuery({ limit: "500" });
    expect(result.limit).toBe(100);
  });

  it("should sanitize negative or invalid page and limit values", () => {
    const result = parsePaginationQuery({ page: "-5", limit: "invalid" });
    expect(result.page).toBe(1);
    expect(result.limit).toBe(20);
  });

  it("should format paginated results correctly with navigation flags", () => {
    const mockItems = [{ id: 1 }, { id: 2 }];
    const total = 50;
    const page = 2;
    const limit = 10;

    const formatted = formatPaginatedResult(mockItems, total, page, limit);
    expect(formatted.items).toHaveLength(2);
    expect(formatted.pagination.total).toBe(50);
    expect(formatted.pagination.page).toBe(2);
    expect(formatted.pagination.limit).toBe(10);
    expect(formatted.pagination.totalPages).toBe(5);
    expect(formatted.pagination.hasNextPage).toBe(true);
    expect(formatted.pagination.hasPrevPage).toBe(true);
  });
});
