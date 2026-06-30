import { Schema, model, Document, Types } from 'mongoose';
import bcrypt from 'bcrypt';
import { IPagePermission, pagePermissionSchema } from './accessPermission.model';

export interface IUser extends Document {
  Name: string;
  name?: string;
  email: string;
  password: string;
  EmployeeId: string;
  designation: 'admin' | 'operator' | 'manager';
  phoneNo: string;
  isAdmin: boolean;
  policy: Types.ObjectId | null;
  customPermissions: IPagePermission[];
  createdAt: Date;
  updatedAt: Date;
  comparePassword(password: string): Promise<boolean>;
}

const userSchema = new Schema<IUser>(
  {
    Name: {
      type: String,
      required: [true, 'Please add a name'],
      trim: true,
    },
    name: {
      type: String,
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Please add an email'],
      unique: true,
      trim: true,
      lowercase: true,
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
        'Please add a valid email',
      ],
    },
    password: {
      type: String,
      required: [true, 'Please add a password'],
      trim: true,
      minlength: 6,
    },
    EmployeeId: {
      type: String,
      required: [true, 'Please add an employee ID'],
      unique: true,
      trim: true,
    },
    designation: {
      type: String,
      required: [true, 'Please select a designation'],
      enum: ['admin', 'operator', 'manager'],
    },
    phoneNo: {
      type: String,
      required: [true, 'Please add a phone number'],
      unique: true,
      trim: true,
    },
    isAdmin: {
      type: Boolean,
      required: true,
      default: false,
    },
    policy: {
      type: Schema.Types.ObjectId,
      ref: 'AccessPermission',
      default: null,
    },
    customPermissions: [pagePermissionSchema],
  },
  {
    timestamps: true,
  }
);

userSchema.pre('save', async function (this: any, next: any) {
  if (this.Name && !this.name) {
    this.name = this.Name;
  } else if (this.name && !this.Name) {
    this.Name = this.name;
  }

  if (!this.isModified('password')) {
    return next();
  }
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error: any) {
    next(error);
  }
});

userSchema.methods.comparePassword = async function (password: string): Promise<boolean> {
  return await bcrypt.compare(password, this.password);
};

export const User = model<IUser>('User', userSchema);
