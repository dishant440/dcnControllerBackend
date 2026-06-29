import { ProductTemplate, IProductTemplate } from './productTemplate.model';
import { Product, IProduct } from './product.model';

export class ProductService {
  /**
   * Helper function to validate dynamic attributes against a template
   */
  public static validateAttributes(template: IProductTemplate, attributes: Record<string, any>): { isValid: boolean; error?: string } {
    const fields = template.fields || [];
    for (const field of fields) {
      const value = attributes[field.name];

      // Check required
      if (field.required && (value === undefined || value === null || value === '')) {
        return { isValid: false, error: `Field "${field.label}" (${field.name}) is required.` };
      }

      if (value !== undefined && value !== null && value !== '') {
        // Validate type
        if (field.type === 'number') {
          if (typeof value !== 'number' && isNaN(Number(value))) {
            return { isValid: false, error: `Field "${field.label}" (${field.name}) must be a number.` };
          }
        } else if (field.type === 'boolean') {
          if (typeof value !== 'boolean' && value !== 'true' && value !== 'false' && value !== 1 && value !== 0 && value !== '1' && value !== '0') {
            return { isValid: false, error: `Field "${field.label}" (${field.name}) must be a boolean.` };
          }
        } else if (field.type === 'date') {
          if (isNaN(Date.parse(value))) {
            return { isValid: false, error: `Field "${field.label}" (${field.name}) must be a valid date.` };
          }
        }
        
        // Validate options if provided
        if (field.options && field.options.length > 0) {
          if (!field.options.includes(String(value))) {
            return { isValid: false, error: `Field "${field.label}" (${field.name}) must be one of: ${field.options.join(', ')}` };
          }
        }
      }
    }
    return { isValid: true };
  }

  // =========================================================================
  // Product Template Methods
  // =========================================================================

  public static async createTemplate(templateData: Partial<IProductTemplate>): Promise<IProductTemplate> {
    const newTemplate = new ProductTemplate(templateData);
    return await newTemplate.save();
  }

  public static async getAllTemplates(): Promise<IProductTemplate[]> {
    return await ProductTemplate.find();
  }

  public static async getTemplateById(id: string): Promise<IProductTemplate | null> {
    return await ProductTemplate.findById(id);
  }

  public static async updateTemplate(id: string, updateData: Partial<IProductTemplate>): Promise<IProductTemplate | null> {
    return await ProductTemplate.findByIdAndUpdate(id, { $set: updateData }, { new: true });
  }

  public static async deleteTemplate(id: string): Promise<any> {
    return await ProductTemplate.deleteOne({ _id: id });
  }

  // =========================================================================
  // Product Instance Methods
  // =========================================================================

  public static async createProduct(productData: { name: string; template: string; attributes?: Record<string, any> }): Promise<IProduct> {
    const template = await ProductTemplate.findById(productData.template);
    if (!template) {
      throw new Error(`ProductTemplate with ID ${productData.template} not found`);
    }

    const attributes = productData.attributes || {};
    const validation = this.validateAttributes(template, attributes);
    if (!validation.isValid) {
      throw new Error(`[Attribute Validation Error] ${validation.error}`);
    }

    const newProduct = new Product({
      name: productData.name,
      template: productData.template,
      attributes
    });

    return await newProduct.save();
  }

  public static async getAllProducts(filter: any = {}): Promise<IProduct[]> {
    return await Product.find(filter).populate('template');
  }

  public static async getProductById(id: string): Promise<IProduct | null> {
    return await Product.findById(id).populate('template');
  }

  public static async updateProduct(id: string, productData: { name?: string; template?: string; attributes?: Record<string, any> }): Promise<IProduct | null> {
    const existingProduct = await Product.findById(id);
    if (!existingProduct) {
      throw new Error(`Product with ID ${id} not found`);
    }

    const templateId = productData.template || existingProduct.template.toString();
    const template = await ProductTemplate.findById(templateId);
    if (!template) {
      throw new Error(`ProductTemplate with ID ${templateId} not found`);
    }

    const attributes = productData.attributes || existingProduct.attributes || {};
    const validation = this.validateAttributes(template, attributes);
    if (!validation.isValid) {
      throw new Error(`[Attribute Validation Error] ${validation.error}`);
    }

    return await Product.findByIdAndUpdate(
      id,
      {
        $set: {
          name: productData.name || existingProduct.name,
          template: templateId,
          attributes
        }
      },
      { new: true }
    ).populate('template');
  }

  public static async deleteProduct(id: string): Promise<any> {
    return await Product.deleteOne({ _id: id });
  }
}
