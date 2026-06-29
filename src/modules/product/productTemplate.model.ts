import { Schema, model, Document } from 'mongoose';

export interface ITemplateField {
  name: string;
  label: string;
  type: 'string' | 'number' | 'boolean' | 'date';
  required: boolean;
  options?: string[];
}

export interface IProductTemplate extends Document {
  name: string;
  description?: string;
  fields: ITemplateField[];
  createdAt: Date;
  updatedAt: Date;
}

const templateFieldSchema = new Schema<ITemplateField>({
  name: { type: String, required: true },
  label: { type: String, required: true },
  type: { type: String, required: true, enum: ['string', 'number', 'boolean', 'date'] },
  required: { type: Boolean, default: false },
  options: { type: [String], default: undefined }
}, { _id: false });

const productTemplateSchema = new Schema<IProductTemplate>(
  {
    name: { type: String, required: true, unique: true, trim: true },
    description: { type: String },
    fields: [templateFieldSchema],
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

export const ProductTemplate = model<IProductTemplate>('ProductTemplate', productTemplateSchema);
