import { IDeviceHandler } from '../deviceHandler.interface';

export class PidHandler implements IDeviceHandler {
  public parseTelemetry(rawData: any): Record<string, any> {
    const slide1 = rawData?.SLIDE_1?.PARA_1;
    
    // Support both flat attributes and nested slides structures
    const pv = typeof rawData?.pv === 'number' ? rawData.pv : (slide1?.PARAMETER_VALUE ?? null);
    const sv = typeof rawData?.sv === 'number' ? rawData.sv : (slide1?.SET_VALUE ?? null);
    const runStopState = slide1?.RUN_STOP_STATE ?? null;

    return {
      pv: pv !== null ? Number(pv) : null,
      sv: sv !== null ? Number(sv) : null,
      runStopState,
      mode: rawData?.mode || slide1?.MODE || null,
      steps: rawData?.steps || slide1?.STEPS || null,
      softwareAlarmThreshold: rawData?.software_alarm_threshold || slide1?.SOFTWARE_ALARM_THRESHOLD || null,
      softwareAlarmStatus: rawData?.software_alarm_status || slide1?.SOFTWARE_ALARM_STATUS || null,
    };
  }

  public buildControlCommand(param: string, value: any): Record<string, any> {
    return {
      cmd: 'SET_PARAMETER',
      deviceType: 'PID',
      param,
      value,
    };
  }

  public validateConfig(config: Record<string, any>): { isValid: boolean; error?: string } {
    if (!config) {
      return { isValid: false, error: 'Config object is missing' };
    }

    const slaveId = config.slaveId ?? config.slaveAddress;
    if (slaveId === undefined || slaveId === null) {
      return { isValid: false, error: 'slaveId/slaveAddress is required' };
    }
    if (typeof slaveId !== 'number' || slaveId < 1 || slaveId > 247) {
      return { isValid: false, error: 'slaveId/slaveAddress must be a number between 1 and 247' };
    }

    return { isValid: true };
  }
}
