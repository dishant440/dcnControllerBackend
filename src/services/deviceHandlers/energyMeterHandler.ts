import { IDeviceHandler } from './deviceHandler.interface';

export class EnergyMeterHandler implements IDeviceHandler {
  public parseTelemetry(rawData: any): Record<string, any> {
    const slide1 = rawData?.SLIDE_1?.PARA_1;

    // Support both direct values and nested structures
    const voltage = rawData?.voltage ?? slide1?.VOLTAGE ?? null;
    const current = rawData?.current ?? slide1?.CURRENT ?? null;
    const powerActive = rawData?.powerActive ?? rawData?.activePower ?? slide1?.ACTIVE_POWER ?? null;
    const powerFactor = rawData?.powerFactor ?? slide1?.POWER_FACTOR ?? null;
    const frequency = rawData?.frequency ?? slide1?.FREQUENCY ?? null;
    const energyActive = rawData?.energyActive ?? rawData?.totalEnergy ?? slide1?.TOTAL_ENERGY ?? null;

    return {
      voltage: voltage !== null ? Number(voltage) : null,
      current: current !== null ? Number(current) : null,
      powerActive: powerActive !== null ? Number(powerActive) : null,
      powerFactor: powerFactor !== null ? Number(powerFactor) : null,
      frequency: frequency !== null ? Number(frequency) : null,
      energyActive: energyActive !== null ? Number(energyActive) : null,
    };
  }

  public buildControlCommand(param: string, value: any): Record<string, any> {
    // Energy meters are usually read-only telemetry, but could support resets
    return {
      cmd: 'METER_COMMAND',
      deviceType: 'ENERGY_METER',
      param,
      value,
    };
  }
}
