export interface IDeviceHandler {
  /**
   * Parse telemetry data coming from the DCN (ESP32) for this specific device.
   * @param rawData Raw data structure for this slave device.
   */
  parseTelemetry(rawData: any): Record<string, any>;

  /**
   * Build a command payload to set parameters on this device type.
   * @param param The parameter name (e.g. SV, delay, active).
   * @param value The value to set.
   */
  buildControlCommand(param: string, value: any): Record<string, any>;

  /**
   * Validate configuration settings for this device type.
   * @param config The config object to validate.
   */
  validateConfig?(config: Record<string, any>): { isValid: boolean; error?: string };
}
