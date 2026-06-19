import { Schema, model, Document } from 'mongoose';

export interface IStep {
  SV: number;
  DELAY: number;
}

export interface IProfile extends Document {
  profileName: string;
  No_Of_Steps: number;
  steps: IStep[];
  Alarm_Delay: number;
  createdAt: Date;
  updatedAt: Date;
}

const stepSchema = new Schema<IStep>({
  SV: { type: Number, required: true },
  DELAY: { type: Number, required: true },
});

const profileSchema = new Schema<IProfile>(
  {
    profileName: { type: String, required: true, unique: true },
    No_Of_Steps: { type: Number, required: true },
    steps: [stepSchema],
    Alarm_Delay: { type: Number, required: true },
  },
  { timestamps: true }
);

export const Profile = model<IProfile>('Profile', profileSchema);
