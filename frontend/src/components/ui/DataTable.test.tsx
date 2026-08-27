import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { DataTable, Column } from "./DataTable.js";

interface SampleRow {
  id: string;
  name: string;
  count: number;
}

describe("UI Component - DataTable", () => {
  const columns: Column<SampleRow>[] = [
    { key: "name", header: "Item Name" },
    { key: "count", header: "Quantity" },
  ];

  it("renders empty state when data array is empty", () => {
    render(
      <DataTable
        columns={columns}
        data={[]}
        keyExtractor={(r) => r.id}
        emptyTitle="No Items"
      />
    );
    expect(screen.getByText("No Items")).toBeInTheDocument();
  });

  it("renders rows and columns when data is provided", () => {
    const data: SampleRow[] = [
      { id: "1", name: "Steel Rebar", count: 150 },
      { id: "2", name: "Cement Bags", count: 300 },
    ];
    render(
      <DataTable
        columns={columns}
        data={data}
        keyExtractor={(r) => r.id}
      />
    );
    expect(screen.getByText("Steel Rebar")).toBeInTheDocument();
    expect(screen.getByText("Cement Bags")).toBeInTheDocument();
    expect(screen.getByText("150")).toBeInTheDocument();
  });

  it("handles row click events", () => {
    const handleRowClick = vi.fn();
    const data: SampleRow[] = [{ id: "1", name: "Brick Batch", count: 5000 }];
    render(
      <DataTable
        columns={columns}
        data={data}
        keyExtractor={(r) => r.id}
        onRowClick={handleRowClick}
      />
    );
    fireEvent.click(screen.getByText("Brick Batch"));
    expect(handleRowClick).toHaveBeenCalledWith(data[0]);
  });
});
