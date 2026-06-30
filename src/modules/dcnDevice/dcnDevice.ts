import { Request, Response, NextFunction } from 'express';
import { Types } from 'mongoose';
import { DCNService } from './dcnDevice.service';
import { DCN } from './dcnDevice.model';
import { Device } from './device.model';
import { DeviceHandlerFactory } from '../../services/deviceHandlers/deviceHandler.factory';

// Helper to get IST date time
const getISTDateTime = (mode: 'formatted' | 'iso' = 'formatted'): any => {
  const now = new Date();
  switch (mode) {
    case 'formatted': {
      const options: Intl.DateTimeFormatOptions = { timeZone: 'Asia/Kolkata', day: '2-digit', month: 'short', year: 'numeric' };
      const date = now.toLocaleDateString('en-GB', options);
      const timeOptions: Intl.DateTimeFormatOptions = { timeZone: 'Asia/Kolkata', hour: 'numeric', minute: '2-digit', hour12: true };
      const time = now.toLocaleTimeString('en-US', timeOptions);
      return { date, time };
    }
    case 'iso': {
      const istNow = new Date(now.getTime() + 5.5 * 60 * 60 * 1000);
      return istNow.toISOString().split('.')[0];
    }
    default:
      throw new Error('Invalid mode');
  }
};

// Helper to add slave devices to DB
async function addDevice(devices: any, count: number): Promise<Types.ObjectId[]> {
  const Available_Devices: Types.ObjectId[] = [];
  for (let i = 1; i <= count; i++) {
    const slave = `SLAVE_${i}`;
    const slaveData = devices[slave];
    if (!slaveData) continue;

    let deviceType = (slaveData.DEVICE_TYPE || slaveData.SLAVE_TYPE || 'PID').toUpperCase();
    if (deviceType === 'ENERGY_METER') deviceType = 'ENERGYMETER';
    if (!DeviceHandlerFactory.hasHandler(deviceType)) {
      deviceType = 'PID';
    }

    const calculatedSlaveId = Number(slaveData.SLAVE_ID || slaveData.COMMUNICATION_ID || slaveData.SLAVE_NO || i);
    const newDevice = new Device({
      slaveId: calculatedSlaveId,
      deviceName: slaveData.SLAVE_NAME || `Device ${i}`,
      deviceType,
      make: slaveData.SLAVE_MAKE || 'Unknown',
      modelName: slaveData.SLAVE_MODEL || 'Unknown',
      config: {
        slaveId: calculatedSlaveId
      }
    });

    const resp = await newDevice.save();
    Available_Devices.push(resp._id as Types.ObjectId);
  }
  return Available_Devices;
}

// Helper to delete devices
async function deleteDevices(devices: Types.ObjectId[]): Promise<void> {
  await Device.deleteMany({ _id: { $in: devices } });
}

// Helper to compare running devices
async function checkRunningDevices(deviceIds: Types.ObjectId[], devices: any, count: number) {
  const Running_Devices: Types.ObjectId[] = [];
  const Available_Devices: Types.ObjectId[] = [];
  for (let i = 1; i <= count; i++) {
    const slave = `SLAVE_${i}`;
    const slaveData = devices[slave];
    if (!slaveData) continue;

    let deviceType = (slaveData.DEVICE_TYPE || slaveData.SLAVE_TYPE || 'PID').toUpperCase();
    if (deviceType === 'ENERGY_METER') deviceType = 'ENERGYMETER';
    if (!DeviceHandlerFactory.hasHandler(deviceType)) deviceType = 'PID';

    const device = await Device.findOne({
      slaveId: slaveData.SLAVE_ID || slaveData.COMMUNICATION_ID || slaveData.SLAVE_NO || i,
      deviceName: slaveData.SLAVE_NAME,
      make: slaveData.SLAVE_MAKE,
      modelName: slaveData.SLAVE_MODEL,
      _id: { $in: deviceIds }
    });

    if (device) {
      Running_Devices.push(device._id as Types.ObjectId);
    } else {
      const calculatedSlaveId = Number(slaveData.SLAVE_ID || slaveData.COMMUNICATION_ID || slaveData.SLAVE_NO || i);
      const newDevice = new Device({
        slaveId: calculatedSlaveId,
        deviceName: slaveData.SLAVE_NAME,
        deviceType,
        make: slaveData.SLAVE_MAKE,
        modelName: slaveData.SLAVE_MODEL,
        config: {
          slaveId: calculatedSlaveId
        }
      });
      const resp = await newDevice.save();
      Available_Devices.push(resp._id as Types.ObjectId);
    }
  }
  return { Available_Devices, Running_Devices };
}

export class SlaveDeviceController {
  /**
   * @desc    Get all discovered slave devices
   * @route   GET /api/slave-devices
   * @access  Public
   */
  public static async getDevices(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const devices = await DCNService.getAllDevices();
      res.status(200).json({
        success: true,
        count: devices.length,
        data: devices,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * @desc    Get a single slave device by ID
   * @route   GET /api/slave-devices/:id
   * @access  Public
   */
  public static async getDeviceById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const device = await DCNService.getDeviceById(req.params.id as string);
      if (!device) {
        res.status(404);
        throw new Error('Slave device not found');
      }
      res.status(200).json({
        success: true,
        data: device,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * @desc    Add / Register DCN logger device and its slave devices
   * @route   POST /api/slave-devices/addesp
   * @route   POST /api/addesp
   * @access  Public
   */
  public static async addDcn(req: Request, res: Response, next: NextFunction): Promise<void> {
    console.log("function called : addDcn")
    try {
      const { DCN_SERIAL_NUMBER, DCN_MAC_ADDRESS, DCN_IP_ADDRESS, DCN_NAME, SLAVE_COUNT, SLAVE_DEVICES } = req.body?.DCN_LOGGER_DATA || {};

      if (!DCN_SERIAL_NUMBER || !DCN_MAC_ADDRESS || !DCN_IP_ADDRESS || !DCN_NAME) {
        res.status(400).json({ message: 'All fields are required' });
        return;
      }

      console.log(`[DCN Registry] Located device "${DCN_NAME}" (MAC: ${DCN_MAC_ADDRESS}, IP: ${DCN_IP_ADDRESS}) attempting registration.`);

      const dcnData = {
        SERIAL_NUMBER: DCN_SERIAL_NUMBER,
        MAC_ADDRESS: DCN_MAC_ADDRESS,
        IP_ADDRESS: DCN_IP_ADDRESS,
        DCN_NAME,
        SLAVE_COUNT,
        SLAVE_DEVICES
      };

      const existingMAC = await DCN.findOne({ dcnMacAddress: DCN_MAC_ADDRESS });
      const formattedDateTime = getISTDateTime('formatted');
      const isoDateTime = getISTDateTime('iso');

      if (!existingMAC) {
        const existingSerialNumber = await DCN.findOne({ dcnSerialNumber: dcnData.SERIAL_NUMBER });
        if (existingSerialNumber && existingSerialNumber.isAlive) {
          res.status(200).json({
            message: 'Other DCN with same Serial Number Exists!',
            SYSTEM_DATE_TIME: {
              CREATE_TIME: formattedDateTime.time,
              CREATE_DATE: formattedDateTime.date,
              DATE_TIME: isoDateTime
            }
          });
          return;
        }
        await DCN.deleteOne({ dcnSerialNumber: dcnData.SERIAL_NUMBER });

        const existingDcnName = await DCN.findOne({ dcnName: dcnData.DCN_NAME });
        if (existingDcnName && existingDcnName.isAlive) {
          res.status(200).json({
            message: 'Other DCN with same DCN Name Exists!',
            SYSTEM_DATE_TIME: {
              CREATE_TIME: formattedDateTime.time,
              CREATE_DATE: formattedDateTime.date,
              DATE_TIME: isoDateTime
            }
          });
          return;
        }
        await DCN.deleteOne({ dcnName: dcnData.DCN_NAME });

        const Available_Devices = await addDevice(dcnData.SLAVE_DEVICES, dcnData.SLAVE_COUNT);

        const newDCN = new DCN({
          dcnSerialNumber: dcnData.SERIAL_NUMBER,
          dcnMacAddress: dcnData.MAC_ADDRESS,
          dcnIpAddress: dcnData.IP_ADDRESS,
          dcnName: dcnData.DCN_NAME,
          slaveCount: dcnData.SLAVE_COUNT,
          availableSlaveDevice: Available_Devices,
          runningSlaveDevice: [],
          isAvailable: true,
          isAlive: true,
          lastSeen: new Date()
        });
        await newDCN.save();
        console.log(`[DCN Registry] Registered new DCN: ${dcnData.DCN_NAME} successfully.`);

        res.status(200).json({
          message: 'New DCN Added successfully',
          SYSTEM_DATE_TIME: {
            CREATE_TIME: formattedDateTime.time,
            CREATE_DATE: formattedDateTime.date,
            DATE_TIME: isoDateTime
          }
        });
      } else {
        const existingSerialNumber = await DCN.findOne({ dcnSerialNumber: dcnData.SERIAL_NUMBER, dcnMacAddress: { $ne: dcnData.MAC_ADDRESS } });
        if (existingSerialNumber && existingSerialNumber.isAlive) {
          res.status(200).json({
            message: 'Other DCN with same Serial Number Exists!',
            SYSTEM_DATE_TIME: {
              CREATE_TIME: formattedDateTime.time,
              CREATE_DATE: formattedDateTime.date,
              DATE_TIME: isoDateTime
            }
          });
          return;
        }
        await DCN.deleteOne({ dcnSerialNumber: dcnData.SERIAL_NUMBER, dcnMacAddress: { $ne: dcnData.MAC_ADDRESS } });

        const existingDcnName = await DCN.findOne({ dcnName: dcnData.DCN_NAME, dcnMacAddress: { $ne: dcnData.MAC_ADDRESS } });
        if (existingDcnName && existingDcnName.isAlive) {
          res.status(200).json({
            message: 'Other DCN with same DCN Name Exists!',
            SYSTEM_DATE_TIME: {
              CREATE_TIME: formattedDateTime.time,
              CREATE_DATE: formattedDateTime.date,
              DATE_TIME: isoDateTime
            }
          });
          return;
        }
        await DCN.deleteOne({ dcnName: dcnData.DCN_NAME, dcnMacAddress: { $ne: dcnData.MAC_ADDRESS } });

        if (existingMAC.isAvailable === true) {
          await deleteDevices(existingMAC.availableSlaveDevice);
          const Available_Devices = await addDevice(dcnData.SLAVE_DEVICES, dcnData.SLAVE_COUNT);
          await DCN.findByIdAndUpdate(
            existingMAC._id,
            {
              $set: {
                dcnSerialNumber: dcnData.SERIAL_NUMBER,
                dcnIpAddress: dcnData.IP_ADDRESS,
                dcnName: dcnData.DCN_NAME,
                slaveCount: dcnData.SLAVE_COUNT,
                availableSlaveDevice: Available_Devices,
                runningSlaveDevice: [],
                isAvailable: true,
                isAlive: true,
                lastSeen: new Date()
              }
            }
          );
        } else {
          const { Available_Devices, Running_Devices } = await checkRunningDevices(existingMAC.runningSlaveDevice, dcnData.SLAVE_DEVICES, dcnData.SLAVE_COUNT);
          await DCN.findByIdAndUpdate(
            existingMAC._id,
            {
              $set: {
                dcnSerialNumber: dcnData.SERIAL_NUMBER,
                dcnIpAddress: dcnData.IP_ADDRESS,
                dcnName: dcnData.DCN_NAME,
                slaveCount: dcnData.SLAVE_COUNT,
                availableSlaveDevice: Available_Devices,
                runningSlaveDevice: Running_Devices,
                isAvailable: Running_Devices.length === 0,
                isAlive: true,
                lastSeen: new Date()
              }
            }
          );
        }

        console.log(`[DCN Registry] Updated existing DCN: ${dcnData.DCN_NAME} successfully.`);

        res.status(200).json({
          message: 'New DCN Added successfully',
          SYSTEM_DATE_TIME: {
            CREATE_TIME: formattedDateTime.time,
            CREATE_DATE: formattedDateTime.date,
            DATE_TIME: isoDateTime
          }
        });
      }
    } catch (error: any) {
      console.error('[DCN Registry] Error in addDcn controller:', error?.message || error);
      res.status(500).json({ message: 'Error registering device' });
    }
  }
}
