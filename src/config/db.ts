import mongoose from 'mongoose';
import { ensureTelemetryTimeSeriesCollection } from '../modules/dcnDevice/telemetry.model';

export const connectDB = async (): Promise<void> => {
  try {
    const mongoURI = process.env.MONGO_URI || 'mongodb://localhost:27017/siren_db';
    
    const conn = await mongoose.connect(mongoURI);
    
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    
    // Enforce MongoDB timeseries collection setup
    await ensureTelemetryTimeSeriesCollection();
  } catch (error) {
    console.error(`Error connecting to MongoDB: ${(error as Error).message}`);
    process.exit(1);
  }
};
