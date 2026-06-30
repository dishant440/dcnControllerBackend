import mongoose from 'mongoose';
import { ensureTelemetryTimeSeriesCollection } from '../modules/dcnDevice/telemetry.model';
import { AccessPermission } from '../modules/user/accessPermission.model';

const seedDefaultPolicies = async (): Promise<void> => {
  try {
    const adminPolicyName = 'ADMIN ACCESS POLICY';
    const exists = await AccessPermission.findOne({ policyName: adminPolicyName });
    if (!exists) {
      const pages: ('profile' | 'blanket' | 'blade' | 'report' | 'settings' | 'users' | 'policy' | 'deviceConfig' | 'graph' | 'productionArea')[] = [
        'profile', 'blanket', 'blade', 'report', 'settings', 'users', 'policy', 'deviceConfig', 'graph', 'productionArea'
      ];
      const actions: ('view' | 'edit' | 'delete' | 'configure' | 'export' | 'create')[] = [
        'view', 'edit', 'delete', 'configure', 'export', 'create'
      ];

      const permissions = pages.map((page) => ({
        page,
        actions: actions.map((action) => ({
          action,
          access: 'allowed' as const
        }))
      }));

      const adminPolicy = new AccessPermission({
        policyName: adminPolicyName,
        description: 'Default System Administrator policy with full access to all features.',
        isActive: true,
        permissions
      });

      await adminPolicy.save();
      console.log(`[SEED] Default '${adminPolicyName}' seeded successfully.`);
    }
  } catch (error: any) {
    console.error(`[SEED] Error seeding policies: ${error?.message || error}`);
  }
};

export const connectDB = async (): Promise<void> => {
  try {
    const mongoURI = process.env.MONGO_URI || 'mongodb://localhost:27017/siren_db';
    
    const conn = await mongoose.connect(mongoURI);
    
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    
    // Enforce MongoDB timeseries collection setup
    await ensureTelemetryTimeSeriesCollection();

    // Enforce default policy seeding
    await seedDefaultPolicies();
  } catch (error) {
    console.error(`Error connecting to MongoDB: ${(error as Error).message}`);
    process.exit(1);
  }
};
