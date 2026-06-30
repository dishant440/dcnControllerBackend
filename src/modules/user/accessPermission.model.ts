import { Schema, model, Document } from 'mongoose';

export interface IAction {
  action: 'view' | 'edit' | 'delete' | 'configure' | 'export' | 'create';
  access: 'allowed' | 'denied';
}

export interface IPagePermission {
  page: 'profile' | 'blanket' | 'blade' | 'report' | 'settings' | 'users' | 'policy' | 'deviceConfig' | 'graph' | 'productionArea';
  actions: IAction[];
}

export interface IAccessPermission extends Document {
  policyName: string;
  description?: string;
  isActive: boolean;
  permissions: IPagePermission[];
}

export const actionSchema = new Schema<IAction>({
  action: {
    type: String,
    required: true,
    enum: ['view', 'edit', 'delete', 'configure', 'export', 'create']
  },
  access: {
    type: String,
    required: true,
    enum: ['allowed', 'denied'],
    default: 'denied'
  }
}, { _id: false });

export const pagePermissionSchema = new Schema<IPagePermission>({
  page: {
    type: String,
    required: true,
    enum: ['profile', 'blanket', 'blade', 'report', 'settings', 'users', 'policy', 'deviceConfig', 'graph', 'productionArea']
  },
  actions: [actionSchema]
}, { _id: false });

const accessPermissionSchema = new Schema<IAccessPermission>({
  policyName: {
    type: String,
    required: true,
    unique: true
  },
  description: String,
  isActive: {
    type: Boolean,
    default: true
  },
  permissions: [pagePermissionSchema]
}, { timestamps: true });

export const AccessPermission = model<IAccessPermission>('AccessPermission', accessPermissionSchema);
