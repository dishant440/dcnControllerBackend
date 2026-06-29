import { Request, Response, NextFunction } from 'express';
import { ProductService } from './product.service';

export class ProductController {
  // =========================================================================
  // Product Template Handlers
  // =========================================================================

  public static async createTemplate(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const templateData = req.body;
      if (!templateData.name || !templateData.fields || !Array.isArray(templateData.fields)) {
        res.status(400).json({ success: false, message: 'Template name and fields array are required' });
        return;
      }

      const template = await ProductService.createTemplate(templateData);
      res.status(201).json({ success: true, data: template });
    } catch (error: any) {
      console.error('Error creating template:', error);
      res.status(400).json({ success: false, message: error.message || 'Failed to create template' });
    }
  }

  public static async getAllTemplates(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const templates = await ProductService.getAllTemplates();
      res.status(200).json({ success: true, data: templates });
    } catch (error: any) {
      console.error('Error getting templates:', error);
      res.status(500).json({ success: false, message: 'Server Error' });
    }
  }

  public static async getTemplateById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = req.params.id as string;
      const template = await ProductService.getTemplateById(id);
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
      const template = await ProductService.updateTemplate(id, updateData);
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
      await ProductService.deleteTemplate(id);
      res.status(200).json({ success: true, message: 'Template deleted successfully' });
    } catch (error: any) {
      console.error('Error deleting template:', error);
      res.status(500).json({ success: false, message: 'Server Error' });
    }
  }

  // =========================================================================
  // Product Instance Handlers
  // =========================================================================

  public static async createProduct(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { name, template, attributes } = req.body;
      if (!name || !template) {
        res.status(400).json({ success: false, message: 'Product name and template ID are required' });
        return;
      }

      const product = await ProductService.createProduct({ name, template, attributes });
      res.status(201).json({ success: true, data: product });
    } catch (error: any) {
      console.error('Error creating product:', error);
      res.status(400).json({ success: false, message: error.message || 'Failed to create product' });
    }
  }

  public static async getAllProducts(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const filter: any = {};
      if (req.query.template) {
        filter.template = req.query.template;
      }
      const products = await ProductService.getAllProducts(filter);
      res.status(200).json({ success: true, data: products });
    } catch (error: any) {
      console.error('Error getting products:', error);
      res.status(500).json({ success: false, message: 'Server Error' });
    }
  }

  public static async getProductById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = req.params.id as string;
      const product = await ProductService.getProductById(id);
      if (!product) {
        res.status(404).json({ success: false, message: 'Product not found' });
        return;
      }
      res.status(200).json({ success: true, data: product });
    } catch (error: any) {
      console.error('Error getting product:', error);
      res.status(500).json({ success: false, message: 'Server Error' });
    }
  }

  public static async updateProduct(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = req.params.id as string;
      const { name, template, attributes } = req.body;
      const product = await ProductService.updateProduct(id, { name, template, attributes });
      if (!product) {
        res.status(404).json({ success: false, message: 'Product not found' });
        return;
      }
      res.status(200).json({ success: true, data: product });
    } catch (error: any) {
      console.error('Error updating product:', error);
      res.status(400).json({ success: false, message: error.message || 'Failed to update product' });
    }
  }

  public static async deleteProduct(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = req.params.id as string;
      await ProductService.deleteProduct(id);
      res.status(200).json({ success: true, message: 'Product deleted successfully' });
    } catch (error: any) {
      console.error('Error deleting product:', error);
      res.status(500).json({ success: false, message: 'Server Error' });
    }
  }
}
