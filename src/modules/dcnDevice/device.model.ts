import { Schema, model, Document } from 'mongoose';

export interface IDevice extends Document {
  slaveId: number;
  deviceName: string;
  deviceType: string;
  make: string;
  modelName: string;
  config: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

const deviceSchema = new Schema<IDevice>(
  {
    slaveId: {
      type: Number,
      required: true,
    },
    deviceName: {
      type: String,
      required: true,
    },
    deviceType: {
      type: String,
      required: true,
      enum: ['PID', 'ENERGY_METER', 'VFD', 'GENERIC_MODBUS'],
    },
    make: {
      type: String,
      required: true,
    },
    modelName: {
      type: String,
      required: true,
    },
    config: {
      type: Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

export const Device = model<IDevice>('Device', deviceSchema);
