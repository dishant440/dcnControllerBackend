import { Request, Response, NextFunction } from 'express';
import { SlaveDeviceService } from './dcnDevice.service';

export class SlaveDeviceController {
  /**
   * @desc    Get all discovered slave devices
   * @route   GET /api/slave-devices
   * @access  Public
   */
  public static async getDevices(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const devices = await SlaveDeviceService.getAllDevices();
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
      const device = await SlaveDeviceService.getDeviceById(req.params.id as string);
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
}
