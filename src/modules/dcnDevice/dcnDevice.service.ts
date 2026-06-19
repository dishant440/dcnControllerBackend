import { DCN, IDCN } from './dcnDevice.model';

export class DCNService {
  /**
   * Fetch all registered dcn devices
   */
  public static async getAllDevices(): Promise<IDCN[]> {
    return await DCN.find().sort({ updatedAt: -1 });
  }

  /**
   * Fetch a single dcn device by ID
   */
  public static async getDeviceById(id: string): Promise<IDCN | null> {
    return await DCN.findById(id);
  }

  /**
   * Upsert a device by name (used by mDNS discovery service)
   */
  public static async upsertDevice(deviceData: Partial<IDCN>): Promise<IDCN> {
    const { dcnSerialNumber, dcnMacAddress, dcnIpAddress, dcnName, slaveCount, availableSlaveDevice, runningSlaveDevice, isAvailable, isAlive, lastSeen } = deviceData;

    // Find device by name (hostname) or create/update it
    return await DCN.findOneAndUpdate(
      { dcnSerialNumber },
      {
        dcnMacAddress,
        dcnIpAddress,
        dcnName,
        slaveCount,
        availableSlaveDevice,
        runningSlaveDevice,
        isAvailable,
        isAlive,
        lastSeen: new Date(),
      },
      { new: true, upsert: true }
    );
  }

  /**
   * Mark a device as offline by name
   */
  public static async markOffline(name: string): Promise<IDCN | null> {
    return await DCN.findOneAndUpdate(
      { name },
      { status: 'offline' },
      { new: true }
    );
  }
}
