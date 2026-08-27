import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { StatusBadge } from "./StatusBadge.js";

describe("UI Component - StatusBadge", () => {
  it("renders status label with multiple visual cues", () => {
    render(<StatusBadge status="healthy" />);
    const badge = screen.getByText(/healthy/i);
    expect(badge).toBeInTheDocument();
  });

  it("handles underscores in status enum and formats correctly", () => {
    render(<StatusBadge status="AT_RISK" />);
    expect(screen.getByText(/at risk/i)).toBeInTheDocument();
  });

  it("allows custom label override", () => {
    render(<StatusBadge status="critical" label="Severely Delayed" />);
    expect(screen.getByText("Severely Delayed")).toBeInTheDocument();
  });
});
