import { TerminalTemplate, ITerminalTemplate } from './terminalTemplate.model';
import { Terminal, ITerminal } from './terminal.model';

export class TerminalService {
  /**
   * Helper function to validate dynamic attributes against a terminal template
   */
  public static validateAttributes(template: ITerminalTemplate, attributes: Record<string, any>): { isValid: boolean; error?: string } {
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
  // Terminal Template Methods
  // =========================================================================

  public static async createTemplate(templateData: Partial<ITerminalTemplate>): Promise<ITerminalTemplate> {
    const newTemplate = new TerminalTemplate(templateData);
    return await newTemplate.save();
  }

  public static async getAllTemplates(): Promise<ITerminalTemplate[]> {
    return await TerminalTemplate.find();
  }

  public static async getTemplateById(id: string): Promise<ITerminalTemplate | null> {
    return await TerminalTemplate.findById(id);
  }

  public static async updateTemplate(id: string, updateData: Partial<ITerminalTemplate>): Promise<ITerminalTemplate | null> {
    return await TerminalTemplate.findByIdAndUpdate(id, { $set: updateData }, { new: true });
  }

  public static async deleteTemplate(id: string): Promise<any> {
    return await TerminalTemplate.deleteOne({ _id: id });
  }

  // =========================================================================
  // Terminal Instance Methods
  // =========================================================================

  public static async createTerminal(terminalData: { name: string; template: string; attributes?: Record<string, any> }): Promise<ITerminal> {
    const template = await TerminalTemplate.findById(terminalData.template);
    if (!template) {
      throw new Error(`TerminalTemplate with ID ${terminalData.template} not found`);
    }

    const attributes = terminalData.attributes || {};
    const validation = this.validateAttributes(template, attributes);
    if (!validation.isValid) {
      throw new Error(`[Attribute Validation Error] ${validation.error}`);
    }

    const newTerminal = new Terminal({
      name: terminalData.name,
      template: terminalData.template,
      attributes
    });

    return await newTerminal.save();
  }

  public static async getAllTerminals(filter: any = {}): Promise<ITerminal[]> {
    return await Terminal.find(filter).populate('template').populate('currentProduct');
  }

  public static async getTerminalById(id: string): Promise<ITerminal | null> {
    return await Terminal.findById(id).populate('template').populate('currentProduct');
  }

  public static async updateTerminal(id: string, terminalData: { name?: string; template?: string; attributes?: Record<string, any> }): Promise<ITerminal | null> {
    const existingTerminal = await Terminal.findById(id);
    if (!existingTerminal) {
      throw new Error(`Terminal with ID ${id} not found`);
    }

    const templateId = terminalData.template || existingTerminal.template.toString();
    const template = await TerminalTemplate.findById(templateId);
    if (!template) {
      throw new Error(`TerminalTemplate with ID ${templateId} not found`);
    }

    const attributes = terminalData.attributes || existingTerminal.attributes || {};
    const validation = this.validateAttributes(template, attributes);
    if (!validation.isValid) {
      throw new Error(`[Attribute Validation Error] ${validation.error}`);
    }

    return await Terminal.findByIdAndUpdate(
      id,
      {
        $set: {
          name: terminalData.name || existingTerminal.name,
          template: templateId,
          attributes
        }
      },
      { new: true }
    ).populate('template').populate('currentProduct');
  }

  public static async deleteTerminal(id: string): Promise<any> {
    return await Terminal.deleteOne({ _id: id });
  }

  /**
   * Assign a product to a terminal
   */
  public static async assignProduct(terminalId: string, productId: string): Promise<ITerminal | null> {
    return await Terminal.findByIdAndUpdate(
      terminalId,
      {
        $set: {
          currentProduct: productId,
          isOccupied: true
        }
      },
      { new: true }
    ).populate('template').populate('currentProduct');
  }

  /**
   * Release product from a terminal
   */
  public static async releaseProduct(terminalId: string): Promise<ITerminal | null> {
    return await Terminal.findByIdAndUpdate(
      terminalId,
      {
        $set: {
          currentProduct: null,
          isOccupied: false
        }
      },
      { new: true }
    ).populate('template').populate('currentProduct');
  }
}
