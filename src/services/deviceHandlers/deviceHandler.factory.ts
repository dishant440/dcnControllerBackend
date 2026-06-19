import { IDeviceHandler } from './deviceHandler.interface';
import { PidHandler } from './pidHandler';
import { EnergyMeterHandler } from './energyMeterHandler';

export class DeviceHandlerFactory {
  private static handlers: Record<string, IDeviceHandler> = {
    'PID': new PidHandler(),
    'ENERGY_METER': new EnergyMeterHandler(),
  };

  /**
   * Returns the registered handler for the given device type
   */
  public static getHandler(deviceType: string): IDeviceHandler {
    const typeUpper = deviceType.toUpperCase();
    const handler = this.handlers[typeUpper];
    if (!handler) {
      throw new Error(`[DeviceHandlerFactory] Unsupported device type: ${deviceType}`);
    }
    return handler;
  }

  /**
   * Checks if a handler exists for the given device type
   */
  public static hasHandler(deviceType: string): boolean {
    return !!this.handlers[deviceType.toUpperCase()];
  }
}
