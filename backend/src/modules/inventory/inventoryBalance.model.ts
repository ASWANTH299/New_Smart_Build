import mongoose, { Schema, Document, Model } from "mongoose";

export interface IInventoryBalance extends Document {
  _id: mongoose.Types.ObjectId;
  locationId: mongoose.Types.ObjectId;
  materialId: mongoose.Types.ObjectId;
  quantity: number;
  reservedQuantity: number;
  availableQuantity: number;
  averageUnitCost: number;
  updatedAt: Date;
  createdAt: Date;
}

const InventoryBalanceSchema = new Schema<IInventoryBalance>(
  {
    locationId: {
      type: Schema.Types.ObjectId,
      ref: "InventoryLocation",
      required: true,
      index: true,
    },
    materialId: {
      type: Schema.Types.ObjectId,
      ref: "Material",
      required: true,
      index: true,
    },
    quantity: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    reservedQuantity: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    availableQuantity: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    averageUnitCost: {
      type: Number,
      min: 0,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Compound unique index per DATABASE-DESIGN.md Section 11.2
InventoryBalanceSchema.index({ locationId: 1, materialId: 1 }, { unique: true });

InventoryBalanceSchema.pre("save", function () {
  this.availableQuantity = Math.max(0, this.quantity - this.reservedQuantity);
});

export const InventoryBalanceModel: Model<IInventoryBalance> =
  mongoose.models.InventoryBalance ||
  mongoose.model<IInventoryBalance>("InventoryBalance", InventoryBalanceSchema);

export default InventoryBalanceModel;
