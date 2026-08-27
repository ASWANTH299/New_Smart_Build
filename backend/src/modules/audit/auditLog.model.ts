import mongoose, { Document, Schema, Model } from "mongoose";

export interface IAuditLog extends Document {
  _id: mongoose.Types.ObjectId;
  actorUserId?: mongoose.Types.ObjectId | null;
  action: string;
  entityType: string;
  entityId: string;
  projectId?: string | null;
  result: "SUCCESS" | "FAILURE";
  metadata?: Record<string, unknown>;
  timestamp: Date;
}

const auditLogSchema = new Schema<IAuditLog>(
  {
    actorUserId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true,
    },
    action: {
      type: String,
      required: true,
      index: true,
    },
    entityType: {
      type: String,
      required: true,
      index: true,
    },
    entityId: {
      type: String,
      required: true,
      index: true,
    },
    projectId: {
      type: String,
      default: null,
      index: true,
    },
    result: {
      type: String,
      enum: ["SUCCESS", "FAILURE"],
      default: "SUCCESS",
      required: true,
    },
    metadata: {
      type: Schema.Types.Mixed,
      default: {},
    },
    timestamp: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: false,
  }
);

auditLogSchema.index({ actorUserId: 1, timestamp: -1 });
auditLogSchema.index({ projectId: 1, timestamp: -1 });
auditLogSchema.index({ entityType: 1, entityId: 1 });

export const AuditLogModel: Model<IAuditLog> =
  mongoose.models.AuditLog || mongoose.model<IAuditLog>("AuditLog", auditLogSchema);

export const logAuditAction = async (params: {
  actorUserId?: string | mongoose.Types.ObjectId | null;
  action: string;
  entityType: string;
  entityId: string;
  projectId?: string | null;
  result?: "SUCCESS" | "FAILURE";
  metadata?: Record<string, unknown>;
}): Promise<IAuditLog> => {
  return await AuditLogModel.create({
    actorUserId: params.actorUserId || null,
    action: params.action,
    entityType: params.entityType,
    entityId: params.entityId,
    projectId: params.projectId || null,
    result: params.result || "SUCCESS",
    metadata: params.metadata || {},
    timestamp: new Date(),
  });
};

export default AuditLogModel;
