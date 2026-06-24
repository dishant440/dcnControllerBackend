/// <reference types="node" />
import path from 'path';
import { IDeviceHandler } from './deviceHandler.interface';

export class DeviceHandlerFactory {
  private static handlers: Record<string, IDeviceHandler> = {};

  /**
   * Returns the registered handler for the given device type, loading it dynamically if necessary.
   */
  public static getHandler(deviceType: string): IDeviceHandler {
    const typeUpper = deviceType.toUpperCase();
    let handler = this.handlers[typeUpper];
    
    if (!handler) {
      const resolved = this.resolveDynamicHandler(deviceType);
      if (resolved) {
        handler = resolved;
        this.handlers[typeUpper] = handler;
      } else {
        throw new Error(`[DeviceHandlerFactory] Unsupported device type: ${deviceType}`);
      }
    }
    
    return handler;
  }

  /**
   * Checks if a handler exists (or can be dynamically loaded) for the given device type.
   */
  public static hasHandler(deviceType: string): boolean {
    const typeUpper = deviceType.toUpperCase();
    if (this.handlers[typeUpper]) {
      return true;
    }
    
    try {
      const handler = this.resolveDynamicHandler(deviceType);
      if (handler) {
        this.handlers[typeUpper] = handler;
        return true;
      }
    } catch (e) {
      // Ignored during check
    }
    
    return false;
  }

  /**
   * Dynamically loads a device handler by its type.
   */
  private static resolveDynamicHandler(deviceType: string): IDeviceHandler | null {
    const raw = deviceType;
    const lower = deviceType.toLowerCase();
    const flat = lower.replace(/[_-]/g, '');
    const kebab = lower.replace(/_/g, '-');
    
    const parts = lower.split(/[_-]/).filter(Boolean);
    const pascal = parts.map(word => word.charAt(0).toUpperCase() + word.slice(1)).join('');
    const camel = parts.map((word, idx) => idx === 0 ? word : word.charAt(0).toUpperCase() + word.slice(1)).join('');

    // Candidate names for the module file
    const fileNames = [
      `${camel}Handler`,
      `${pascal}Handler`,
      `${flat}Handler`,
      `${lower}Handler`,
      `${kebab}Handler`,
      camel,
      pascal,
      flat,
      lower,
      kebab
    ];

    // Directories to check (under modules/ subfolder and current folder)
    const searchDirs = [
      path.join(__dirname, 'modules'),
      __dirname
    ];

    for (const dir of searchDirs) {
      for (const name of fileNames) {
        const fullPath = path.join(dir, name);
        try {
          const module = require(fullPath);
          const handler = this.extractHandler(module, raw);
          if (handler) {
            console.log(`[DeviceHandlerFactory] Dynamically loaded handler for "${deviceType}" from: ${fullPath}`);
            return handler;
          }
        } catch (err: any) {
          // If the file exists but failed to compile/load due to a syntax/runtime error, log it.
          // Otherwise, ignore MODULE_NOT_FOUND to check the next path.
          if (err?.code !== 'MODULE_NOT_FOUND' || (err.message && !err.message.includes(fullPath))) {
            console.error(`[DeviceHandlerFactory] Error loading module from ${fullPath}:`, err);
          }
        }
      }
    }

    return null;
  }

  /**
   * Safely extracts the handler instance from the resolved module.
   */
  private static extractHandler(module: any, deviceType: string): IDeviceHandler | null {
    if (!module) return null;

    // 1. Check if the module default/root export is already an instance of IDeviceHandler
    if (typeof module.parseTelemetry === 'function' && typeof module.buildControlCommand === 'function') {
      return module;
    }
    if (module.default && typeof module.default.parseTelemetry === 'function' && typeof module.default.buildControlCommand === 'function') {
      return module.default;
    }

    // 2. Check if default export is a class/constructor
    if (typeof module.default === 'function') {
      try {
        const instance = new module.default();
        if (typeof instance.parseTelemetry === 'function' && typeof instance.buildControlCommand === 'function') {
          return instance;
        }
      } catch (e) {}
    }

    // 3. Check if the module itself is a class/constructor
    if (typeof module === 'function') {
      try {
        const instance = new module();
        if (typeof instance.parseTelemetry === 'function' && typeof instance.buildControlCommand === 'function') {
          return instance;
        }
      } catch (e) {}
    }

    // 4. Check for named exports matching name patterns (e.g. EnergyMeterHandler, PidHandler)
    const snakeToPascal = (str: string) => str.split(/[_-]/).map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join('');
    const pascalName = snakeToPascal(deviceType);
    const possibleKeys = [
      pascalName + 'Handler',
      pascalName,
      deviceType.toUpperCase() + 'Handler',
      deviceType.toUpperCase()
    ];

    for (const key of possibleKeys) {
      const exported = module[key];
      if (!exported) continue;

      if (typeof exported.parseTelemetry === 'function' && typeof exported.buildControlCommand === 'function') {
        return exported;
      }
      if (typeof exported === 'function') {
        try {
          const instance = new exported();
          if (typeof instance.parseTelemetry === 'function' && typeof instance.buildControlCommand === 'function') {
            return instance;
          }
        } catch (e) {}
      }
    }

    // 5. Look for any exported property that implements the interface
    for (const key of Object.keys(module)) {
      const exported = module[key];
      if (!exported) continue;

      if (typeof exported.parseTelemetry === 'function' && typeof exported.buildControlCommand === 'function') {
        return exported;
      }
      if (typeof exported === 'function') {
        try {
          const instance = new exported();
          if (typeof instance.parseTelemetry === 'function' && typeof instance.buildControlCommand === 'function') {
            return instance;
          }
        } catch (e) {}
      }
    }

    return null;
  }
}
