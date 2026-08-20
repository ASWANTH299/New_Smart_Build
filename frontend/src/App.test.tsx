import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import App from "./App.js";

describe("Frontend Foundation (Phase 1)", () => {
  it("renders the Smart Build title and baseline badge", () => {
    render(<App />);
    expect(screen.getByText("Smart Build")).toBeInTheDocument();
    expect(screen.getByText("V1 Baseline")).toBeInTheDocument();
  });

  it("renders the overview heading and architecture cards", () => {
    render(<App />);
    expect(
      screen.getByText("Construction Project & Resource Management")
    ).toBeInTheDocument();
    expect(screen.getByText("Frontend Foundation")).toBeInTheDocument();
    expect(screen.getByText("Backend Foundation")).toBeInTheDocument();
    expect(screen.getByText("Security & Isolation")).toBeInTheDocument();
  });
});
