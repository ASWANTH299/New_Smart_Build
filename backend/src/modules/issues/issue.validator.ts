import { z } from "zod";

const categoryEnum = z.enum([
  "SAFETY",
  "QUALITY",
  "MATERIAL",
  "EQUIPMENT",
  "SCHEDULE",
  "WEATHER",
  "PROJECT",
  "PHASE",
  "TASK",
  "OTHER",
]);

const priorityEnum = z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]);

const statusEnum = z.enum(["OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"]);

export const createIssueSchema = {
  params: z.object({
    projectId: z.string().min(1, "Project ID is required"),
  }),
  body: z.object({
    title: z.string().min(1, "Title is required").trim(),
    description: z.string().min(1, "Description is required").trim(),
    category: categoryEnum.optional().default("OTHER"),
    priority: priorityEnum.optional().default("MEDIUM"),
    assignedTo: z.string().optional().nullable(),
    phaseId: z.string().optional().nullable(),
    taskId: z.string().optional().nullable(),
    dueDate: z.string().optional().nullable(),
  }),
};

export const updateIssueSchema = {
  params: z.object({
    projectId: z.string().min(1, "Project ID is required"),
    issueId: z.string().min(1, "Issue ID is required"),
  }),
  body: z.object({
    title: z.string().optional(),
    description: z.string().optional(),
    category: categoryEnum.optional(),
    priority: priorityEnum.optional(),
    status: statusEnum.optional(),
    assignedTo: z.string().optional().nullable(),
    phaseId: z.string().optional().nullable(),
    taskId: z.string().optional().nullable(),
    dueDate: z.string().optional().nullable(),
    resolutionNotes: z.string().optional(),
  }),
};

export const resolveIssueSchema = {
  params: z.object({
    projectId: z.string().min(1, "Project ID is required"),
    issueId: z.string().min(1, "Issue ID is required"),
  }),
  body: z.object({
    resolutionNotes: z.string().min(1, "Resolution notes are required"),
  }),
};
