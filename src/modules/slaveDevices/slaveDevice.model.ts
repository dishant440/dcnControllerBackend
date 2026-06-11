import { Schema, model, Document } from 'mongoose';

export interface ISlaveDevice extends Document {
  name: string;
  ipAddress: string;
  port: number;
  status: 'online' | 'offline';
  lastSeen: Date;
  createdAt: Date;
  updatedAt: Date;
}

const slaveDeviceSchema = new Schema<ISlaveDevice>(
  {
    name: {
      type: String,
      required: [true, 'Please add a name'],
      trim: true,
      unique: true,
    },
    ipAddress: {
      type: String,
      required: [true, 'Please add an IP address'],
      trim: true,
    },
    port: {
      type: Number,
      default: 80,
    },
    status: {
      type: String,
      enum: ['online', 'offline'],
      default: 'offline',
    },
    lastSeen: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

export const SlaveDevice = model<ISlaveDevice>('SlaveDevice', slaveDeviceSchema);
