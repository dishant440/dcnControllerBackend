import { SlaveDevice, ISlaveDevice } from './dcnDevice.model';

export class SlaveDeviceService {
  /**
   * Fetch all registered slave devices
   */
  public static async getAllDevices(): Promise<ISlaveDevice[]> {
    return await SlaveDevice.find().sort({ updatedAt: -1 });
  }

  /**
   * Fetch a single slave device by ID
   */
  public static async getDeviceById(id: string): Promise<ISlaveDevice | null> {
    return await SlaveDevice.findById(id);
  }

  /**
   * Upsert a device by name (used by mDNS discovery service)
   */
  public static async upsertDevice(deviceData: Partial<ISlaveDevice>): Promise<ISlaveDevice> {
    const { name, ipAddress, port, status } = deviceData;

    // Find device by name (hostname) or create/update it
    return await SlaveDevice.findOneAndUpdate(
      { name },
      {
        ipAddress,
        port: port || 80,
        status: status || 'online',
        lastSeen: new Date(),
      },
      { new: true, upsert: true }
    );
  }

  /**
   * Mark a device as offline by name
   */
  public static async markOffline(name: string): Promise<ISlaveDevice | null> {
    return await SlaveDevice.findOneAndUpdate(
      { name },
      { status: 'offline' },
      { new: true }
    );
  }
}
