export interface PaginationQuery {
  page?: string | number;
  limit?: string | number;
  sortBy?: string;
  sortOrder?: "asc" | "desc" | "1" | "-1";
}

export interface ParsedPagination {
  page: number;
  limit: number;
  skip: number;
  sortBy: string;
  sortOrder: "asc" | "desc";
  sortOptions: Record<string, 1 | -1>;
}

export interface PaginatedResult<T> {
  items: T[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;
const DEFAULT_SORT_BY = "createdAt";
const DEFAULT_SORT_ORDER: "asc" | "desc" = "desc";

export const parsePaginationQuery = (
  query: PaginationQuery = {},
  defaultSortBy = DEFAULT_SORT_BY,
  defaultLimit = DEFAULT_LIMIT
): ParsedPagination => {
  let page = typeof query.page === "string" ? parseInt(query.page, 10) : Number(query.page);
  if (isNaN(page) || page < 1) {
    page = DEFAULT_PAGE;
  }

  let limit = typeof query.limit === "string" ? parseInt(query.limit, 10) : Number(query.limit);
  if (isNaN(limit) || limit < 1) {
    limit = defaultLimit;
  }
  if (limit > MAX_LIMIT) {
    limit = MAX_LIMIT;
  }

  const skip = (page - 1) * limit;
  const sortBy = (typeof query.sortBy === "string" && query.sortBy.trim().length > 0)
    ? query.sortBy.trim()
    : defaultSortBy;

  const rawOrder = typeof query.sortOrder === "string" ? query.sortOrder.toLowerCase() : "";
  const sortOrder: "asc" | "desc" = (rawOrder === "asc" || rawOrder === "1") ? "asc" : DEFAULT_SORT_ORDER;
  const sortValue: 1 | -1 = sortOrder === "asc" ? 1 : -1;

  return {
    page,
    limit,
    skip,
    sortBy,
    sortOrder,
    sortOptions: { [sortBy]: sortValue },
  };
};

export const formatPaginatedResult = <T>(
  items: T[],
  total: number,
  page: number,
  limit: number
): PaginatedResult<T> => {
  const totalPages = Math.ceil(total / limit) || 1;
  return {
    items,
    pagination: {
      total,
      page,
      limit,
      totalPages,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
    },
  };
};
