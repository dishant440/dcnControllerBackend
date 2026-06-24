import { Schema, model, Document, Types } from 'mongoose';
import './device.model';


export interface IDCN extends Document {
  dcnSerialNumber: string;
  dcnMacAddress: string;
  dcnIpAddress: string;
  dcnName: string;
  slaveCount: number;
  availableSlaveDevice: Types.ObjectId[];
  runningSlaveDevice: Types.ObjectId[];
  isAvailable: boolean;
  isAlive: boolean;
  lastSeen: Date;
}

const dcnSchema = new Schema<IDCN>(
  {
    dcnSerialNumber: {
      type: String,
      required: true,
    },
    dcnMacAddress: {
      type: String,
      required: true,
    },
    dcnIpAddress: {
      type: String,
      required: true,
    },
    dcnName: {
      type: String,
      required: true,
    },
    slaveCount: {
      type: Number,
      required: true,
    },
    availableSlaveDevice: [
      {
        type: Schema.Types.ObjectId,
        ref: 'SlaveDevice',
      },
    ],
    runningSlaveDevice: [
      {
        type: Schema.Types.ObjectId,
        ref: 'SlaveDevice',
      },
    ],
    isAvailable: {
      type: Boolean,
      default: false,
    },
    isAlive: {
      type: Boolean,
      default: true,
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

export const DCN = model<IDCN>('DCN', dcnSchema);
