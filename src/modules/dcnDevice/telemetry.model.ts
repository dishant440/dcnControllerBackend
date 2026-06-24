import { Schema, model, Document, connection } from 'mongoose';

export interface ITelemetry extends Document {
  timestamp: Date;
  metadata: {
    batchId: string;
    dcnName: string;
    deviceName: string;
    deviceType: string;
    logRate?: number;
  };
  values: Record<string, any>;
}

const telemetrySchema = new Schema<ITelemetry>(
  {
    timestamp: {
      type: Date,
      required: true,
    },
    metadata: {
      batchId: { type: String, required: true },
      dcnName: { type: String, required: true },
      deviceName: { type: String, required: true },
      deviceType: { type: String, required: true },
      logRate: { type: Number, default: 30 },
    },
    values: {
      type: Schema.Types.Mixed,
      required: true,
    },
  },
  {
    collection: 'TelemetryData',
  }
);

telemetrySchema.index({ 'metadata.batchId': 1, timestamp: 1 });
telemetrySchema.index({ 'metadata.dcnName': 1, 'metadata.deviceName': 1 });
telemetrySchema.index({ 'metadata.deviceType': 1, timestamp: -1 });

export const Telemetry = model<ITelemetry>('Telemetry', telemetrySchema);

/**
 * Ensures the TelemetryData collection is initialized as a MongoDB Time-Series collection
 */
export async function ensureTelemetryTimeSeriesCollection(): Promise<void> {
  const db = connection.db;
  if (!db) {
    console.warn('[Telemetry] Database connection not ready. Skipping time-series enforcement.');
    return;
  }

  const collectionName = 'TelemetryData';
  try {
    const collections = await db.listCollections({ name: collectionName }).toArray();
    if (collections.length === 0) {
      console.log(`[Telemetry] Collection "${collectionName}" does not exist, creating as time-series...`);
      await db.createCollection(collectionName, {
        timeseries: {
          timeField: 'timestamp',
          metaField: 'metadata',
          granularity: 'seconds',
        },
      });
      console.log(`[Telemetry] Successfully created "${collectionName}" as time-series.`);
    } else {
      console.log(`[Telemetry] "${collectionName}" collection already exists.`);
    }
  } catch (err) {
    console.error(`[Telemetry] Error ensuring time-series collection:`, err);
  }
}
