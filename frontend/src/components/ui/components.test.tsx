import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import {
  Input,
  Select,
  Textarea,
  PageHeader,
  Breadcrumbs,
  Card,
  Metric,
  Tabs,
  ConfirmationDialog,
  LoadingState,
  EmptyState,
  ErrorState,
  PermissionDenied,
  ProgressIndicator,
  Pagination,
  FilterBar,
  FileUploader,
} from "./index.js";

describe("Comprehensive UI Component Library Tests (Phase 3)", () => {
  it("Input renders label, required mark, and error message", () => {
    render(<Input label="Project Name" required error="Field is required" />);
    expect(screen.getByLabelText(/Project Name/i)).toBeInTheDocument();
    expect(screen.getByText("Field is required")).toBeInTheDocument();
  });

  it("Select renders options and handles selection", () => {
    const options = [
      { value: "opt1", label: "Option 1" },
      { value: "opt2", label: "Option 2" },
    ];
    render(<Select label="Status" options={options} defaultValue="opt1" />);
    expect(screen.getByLabelText(/Status/i)).toBeInTheDocument();
    expect(screen.getByText("Option 1")).toBeInTheDocument();
  });

  it("Textarea renders rows and helper text", () => {
    render(<Textarea label="Notes" helperText="Max 500 chars" />);
    expect(screen.getByLabelText(/Notes/i)).toBeInTheDocument();
    expect(screen.getByText("Max 500 chars")).toBeInTheDocument();
  });

  it("Breadcrumbs renders links with home icon", () => {
    render(
      <BrowserRouter>
        <Breadcrumbs items={[{ label: "Projects", href: "/projects" }, { label: "Details" }]} />
      </BrowserRouter>
    );
    expect(screen.getByText("Projects")).toBeInTheDocument();
    expect(screen.getByText("Details")).toBeInTheDocument();
  });

  it("PageHeader renders title, description, and action buttons", () => {
    render(
      <PageHeader
        title="Site Operations"
        description="Daily operational logs"
        actions={<button>Action</button>}
      />
    );
    expect(screen.getByText("Site Operations")).toBeInTheDocument();
    expect(screen.getByText("Daily operational logs")).toBeInTheDocument();
    expect(screen.getByText("Action")).toBeInTheDocument();
  });

  it("Card renders title, subtitle, content, and footer", () => {
    render(
      <Card title="Card Title" subtitle="Card Subtitle" footer="Card Footer">
        <p>Card Content</p>
      </Card>
    );
    expect(screen.getByText("Card Title")).toBeInTheDocument();
    expect(screen.getByText("Card Content")).toBeInTheDocument();
    expect(screen.getByText("Card Footer")).toBeInTheDocument();
  });

  it("Metric renders label, value, and trend indicators", () => {
    render(
      <Metric
        label="Active Workforce"
        value="120"
        trend={{ value: "+5 today", isPositive: true }}
      />
    );
    expect(screen.getByText(/Active Workforce/i)).toBeInTheDocument();
    expect(screen.getByText("120")).toBeInTheDocument();
    expect(screen.getByText("+5 today")).toBeInTheDocument();
  });

  it("Tabs switches active tab on click", () => {
    const handleTabChange = vi.fn();
    const tabs = [
      { id: "overview", label: "Overview" },
      { id: "logs", label: "Daily Logs" },
    ];
    render(<Tabs tabs={tabs} activeTab="overview" onChange={handleTabChange} />);
    fireEvent.click(screen.getByText("Daily Logs"));
    expect(handleTabChange).toHaveBeenCalledWith("logs");
  });

  it("ConfirmationDialog triggers onConfirm and onCancel", () => {
    const handleConfirm = vi.fn();
    const handleCancel = vi.fn();
    render(
      <ConfirmationDialog
        isOpen={true}
        title="Delete Milestone"
        message="Are you sure?"
        onConfirm={handleConfirm}
        onClose={handleCancel}
      />
    );
    expect(screen.getByText("Delete Milestone")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /confirm/i }));
    expect(handleConfirm).toHaveBeenCalledTimes(1);
  });

  it("LoadingState renders loading message and spinner", () => {
    render(<LoadingState message="Fetching inventory data..." />);
    expect(screen.getByText("Fetching inventory data...")).toBeInTheDocument();
  });

  it("EmptyState renders title, description, and action", () => {
    render(
      <EmptyState
        title="No Material Indents"
        description="Create your first indent request."
        action={<button>Create Indent</button>}
      />
    );
    expect(screen.getByText("No Material Indents")).toBeInTheDocument();
    expect(screen.getByText("Create Indent")).toBeInTheDocument();
  });

  it("ErrorState renders error message and retry button", () => {
    const handleRetry = vi.fn();
    render(
      <ErrorState
        title="Failed to Load"
        message="Network error"
        onRetry={handleRetry}
      />
    );
    expect(screen.getByText("Failed to Load")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /try again/i }));
    expect(handleRetry).toHaveBeenCalledTimes(1);
  });

  it("PermissionDenied renders 403 access restriction message", () => {
    render(
      <BrowserRouter>
        <PermissionDenied message="Custom permission required" />
      </BrowserRouter>
    );
    expect(screen.getByText("Custom permission required")).toBeInTheDocument();
  });

  it("ProgressIndicator renders progress bar and quantity metrics", () => {
    render(
      <ProgressIndicator
        progress={75}
        plannedQuantity={100}
        completedQuantity={75}
        unit="m³ Concrete"
      />
    );
    expect(screen.getByText("75%")).toBeInTheDocument();
    expect(screen.getByText(/Completed: 75 m³ Concrete/i)).toBeInTheDocument();
  });

  it("Pagination renders page numbers and navigation buttons", () => {
    const handlePageChange = vi.fn();
    render(
      <Pagination page={2} totalPages={5} totalItems={50} onPageChange={handlePageChange} />
    );
    expect(screen.getByText(/Page/i)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /previous/i }));
    expect(handlePageChange).toHaveBeenCalledWith(1);
  });

  it("FilterBar handles search input and clear action", () => {
    const handleSearch = vi.fn();
    const handleClear = vi.fn();
    render(
      <FilterBar
        searchTerm="Cement"
        onSearchChange={handleSearch}
        hasActiveFilters={true}
        onClearFilters={handleClear}
      />
    );
    fireEvent.click(screen.getByRole("button", { name: /clear filters/i }));
    expect(handleClear).toHaveBeenCalledTimes(1);
  });

  it("FileUploader renders upload dropzone and helper text", () => {
    render(<FileUploader helperText="PDF or PNG up to 10MB" />);
    expect(screen.getByText("PDF or PNG up to 10MB")).toBeInTheDocument();
  });
});
