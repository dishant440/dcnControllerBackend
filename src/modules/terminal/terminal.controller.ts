import { Request, Response, NextFunction } from 'express';
import { TerminalService } from './terminal.service';

export class TerminalController {
  // =========================================================================
  // Terminal Template Handlers
  // =========================================================================

  public static async createTemplate(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const templateData = req.body;
      if (!templateData.name || !templateData.fields || !Array.isArray(templateData.fields)) {
        res.status(400).json({ success: false, message: 'Template name and fields array are required' });
        return;
      }

      const template = await TerminalService.createTemplate(templateData);
      res.status(201).json({ success: true, data: template });
    } catch (error: any) {
      console.error('Error creating terminal template:', error);
      res.status(400).json({ success: false, message: error.message || 'Failed to create template' });
    }
  }

  public static async getAllTemplates(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const templates = await TerminalService.getAllTemplates();
      res.status(200).json({ success: true, data: templates });
    } catch (error: any) {
      console.error('Error getting templates:', error);
      res.status(500).json({ success: false, message: 'Server Error' });
    }
  }

  public static async getTemplateById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = req.params.id as string;
      const template = await TerminalService.getTemplateById(id);
      if (!template) {
        res.status(404).json({ success: false, message: 'Template not found' });
        return;
      }
      res.status(200).json({ success: true, data: template });
    } catch (error: any) {
      console.error('Error getting template:', error);
      res.status(500).json({ success: false, message: 'Server Error' });
    }
  }

  public static async updateTemplate(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = req.params.id as string;
      const updateData = req.body;
      const template = await TerminalService.updateTemplate(id, updateData);
      if (!template) {
        res.status(404).json({ success: false, message: 'Template not found' });
        return;
      }
      res.status(200).json({ success: true, data: template });
    } catch (error: any) {
      console.error('Error updating template:', error);
      res.status(400).json({ success: false, message: error.message || 'Failed to update template' });
    }
  }

  public static async deleteTemplate(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = req.params.id as string;
      await TerminalService.deleteTemplate(id);
      res.status(200).json({ success: true, message: 'Template deleted successfully' });
    } catch (error: any) {
      console.error('Error deleting template:', error);
      res.status(500).json({ success: false, message: 'Server Error' });
    }
  }

  // =========================================================================
  // Terminal Instance Handlers
  // =========================================================================

  public static async createTerminal(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { name, template, attributes } = req.body;
      if (!name || !template) {
        res.status(400).json({ success: false, message: 'Terminal name and template ID are required' });
        return;
      }

      const terminal = await TerminalService.createTerminal({ name, template, attributes });
      res.status(201).json({ success: true, data: terminal });
    } catch (error: any) {
      console.error('Error creating terminal:', error);
      res.status(400).json({ success: false, message: error.message || 'Failed to create terminal' });
    }
  }

  public static async getAllTerminals(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const filter: any = {};
      for (const key of Object.keys(req.query)) {
        if (key === 'template') {
          filter.template = req.query.template;
        } else {
          filter[`attributes.${key}`] = req.query[key];
        }
      }
      const terminals = await TerminalService.getAllTerminals(filter);
      res.status(200).json({ success: true, data: terminals });
    } catch (error: any) {
      console.error('Error getting terminals:', error);
      res.status(500).json({ success: false, message: 'Server Error' });
    }
  }

  public static async getTerminalById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = req.params.id as string;
      const terminal = await TerminalService.getTerminalById(id);
      if (!terminal) {
        res.status(404).json({ success: false, message: 'Terminal not found' });
        return;
      }
      res.status(200).json({ success: true, data: terminal });
    } catch (error: any) {
      console.error('Error getting terminal:', error);
      res.status(500).json({ success: false, message: 'Server Error' });
    }
  }

  public static async updateTerminal(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = req.params.id as string;
      const { name, template, attributes } = req.body;
      const terminal = await TerminalService.updateTerminal(id, { name, template, attributes });
      if (!terminal) {
        res.status(404).json({ success: false, message: 'Terminal not found' });
        return;
      }
      res.status(200).json({ success: true, data: terminal });
    } catch (error: any) {
      console.error('Error updating terminal:', error);
      res.status(400).json({ success: false, message: error.message || 'Failed to update terminal' });
    }
  }

  public static async deleteTerminal(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = req.params.id as string;
      await TerminalService.deleteTerminal(id);
      res.status(200).json({ success: true, message: 'Terminal deleted successfully' });
    } catch (error: any) {
      console.error('Error deleting terminal:', error);
      res.status(500).json({ success: false, message: 'Server Error' });
    }
  }

  public static async assignProduct(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = req.params.id as string;
      const { productId } = req.body;
      if (!productId) {
        res.status(400).json({ success: false, message: 'Product ID is required' });
        return;
      }

      const terminal = await TerminalService.assignProduct(id, productId);
      if (!terminal) {
        res.status(404).json({ success: false, message: 'Terminal not found' });
        return;
      }
      res.status(200).json({ success: true, data: terminal });
    } catch (error: any) {
      console.error('Error assigning product to terminal:', error);
      res.status(500).json({ success: false, message: 'Server Error' });
    }
  }

  public static async releaseProduct(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = req.params.id as string;
      const terminal = await TerminalService.releaseProduct(id);
      if (!terminal) {
        res.status(404).json({ success: false, message: 'Terminal not found' });
        return;
      }
      res.status(200).json({ success: true, data: terminal });
    } catch (error: any) {
      console.error('Error releasing product from terminal:', error);
      res.status(500).json({ success: false, message: 'Server Error' });
    }
  }
}
