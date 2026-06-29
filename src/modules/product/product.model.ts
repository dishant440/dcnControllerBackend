import { Schema, model, Document, Types } from 'mongoose';

export interface IProduct extends Document {
  template: Types.ObjectId;
  name: string;
  attributes: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

const productSchema = new Schema<IProduct>(
  {
    template: { type: Schema.Types.ObjectId, ref: 'ProductTemplate', required: true },
    name: { type: String, required: true, trim: true },
    attributes: { type: Schema.Types.Mixed, default: {} },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

productSchema.index({ template: 1 });
productSchema.index({ name: 1 });

export const Product = model<IProduct>('Product', productSchema);
