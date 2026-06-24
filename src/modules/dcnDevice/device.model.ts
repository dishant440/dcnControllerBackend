import { Schema, model, Document } from 'mongoose';
import { DeviceHandlerFactory } from '../../services/deviceHandlers/deviceHandler.factory';

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
      validate: {
        validator: function(v: string) {
          return DeviceHandlerFactory.hasHandler(v);
        },
        message: (props: any) => `[Device Validation] Device type "${props.value}" is not supported or does not have a registered module handler.`
      }
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

// Pre-save validation for device-specific configs
deviceSchema.pre('save', function () {
  const handler = DeviceHandlerFactory.getHandler(this.deviceType);
  if (handler && handler.validateConfig) {
    const { isValid, error } = handler.validateConfig(this.config);
    if (!isValid) {
      throw new Error(`[Device Validation] Invalid configuration for ${this.deviceType}: ${error}`);
    }
  }
});

// Compile model as 'SlaveDevice' to match the references in DCN model
export const Device = model<IDevice>('SlaveDevice', deviceSchema);
