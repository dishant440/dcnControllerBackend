import { Schema, model, Document, Types } from 'mongoose';

export interface ITerminal extends Document {
  template: Types.ObjectId;
  name: string;
  isOccupied: boolean;
  currentProduct?: Types.ObjectId | null;
  attributes: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

const terminalSchema = new Schema<ITerminal>(
  {
    template: { type: Schema.Types.ObjectId, ref: 'TerminalTemplate', required: true },
    name: { type: String, required: true, trim: true },
    isOccupied: { type: Boolean, default: false },
    currentProduct: { type: Schema.Types.ObjectId, ref: 'Product', default: null },
    attributes: { type: Schema.Types.Mixed, default: {} },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

terminalSchema.index({ template: 1 });
terminalSchema.index({ name: 1 });

export const Terminal = model<ITerminal>('Terminal', terminalSchema);
