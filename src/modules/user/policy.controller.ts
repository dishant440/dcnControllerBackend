import { Request, Response, NextFunction } from 'express';
import { AccessPermission } from './accessPermission.model';

export class PolicyController {
  /**
   * @desc    Create a new policy
   * @route   POST /api/policy/createPolicy
   * @access  Private (Admin/User with policy permission)
   */
  public static async createPolicy(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { policyName, description, permissions } = req.body;

      if (!policyName || !Array.isArray(permissions)) {
        res.status(400).json({ error: 'policyName and permissions are required' });
        return;
      }

      const exists = await AccessPermission.findOne({ policyName });
      if (exists) {
        res.status(409).json({ error: 'Policy with this name already exists' });
        return;
      }

      const newPolicy = new AccessPermission({ policyName, description, permissions });
      await newPolicy.save();

      res.status(201).json({ message: 'Policy created', policy: newPolicy });
    } catch (err: any) {
      next(err);
    }
  }

  /**
   * @desc    Get all policies
   * @route   GET /api/policy/policies
   * @access  Private (Admin/User with policy permission)
   */
  public static async getAllPolicies(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const policies = await AccessPermission.find().sort({ createdAt: -1 });
      res.status(200).json(policies);
    } catch (err: any) {
      next(err);
    }
  }

  /**
   * @desc    Get a single policy by ID
   * @route   GET /api/policy/policies/:id
   * @access  Private (Admin/User with policy permission)
   */
  public static async getPolicyById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const policy = await AccessPermission.findById(id);

      if (!policy) {
        res.status(404).json({ error: 'Policy not found' });
        return;
      }

      res.status(200).json(policy);
    } catch (err: any) {
      next(err);
    }
  }

  /**
   * @desc    Get active policies for suggested selection dropdowns
   * @route   GET /api/policy/selectedPolicy
   * @access  Private
   */
  public static async getSelectedPolicy(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const policies = await AccessPermission.find({ isActive: true });
      
      const finalData = policies.map((policy) => {
        return {
          policyName: policy.policyName,
          _id: policy._id,
          isActive: policy.isActive,
          description: policy.description,
          permissions: policy.permissions.map((perm) => perm.page)
        };
      });

      res.status(200).json({
        success: true,
        policy: [finalData] // wrapped in array to maintain legacy response structure
      });
    } catch (err: any) {
      next(err);
    }
  }

  /**
   * @desc    Update a policy
   * @route   PUT /api/policy/updatepolicy/:id
   * @access  Private (Admin/User with policy permission)
   */
  public static async updatePolicy(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const { policyName, description, permissions, isActive } = req.body;

      const updatedPolicy = await AccessPermission.findByIdAndUpdate(
        id,
        { policyName, description, permissions, isActive },
        { new: true, runValidators: true }
      );

      if (!updatedPolicy) {
        res.status(404).json({ error: 'Policy not found' });
        return;
      }

      res.status(200).json({ message: 'Policy updated', policy: updatedPolicy });
    } catch (err: any) {
      next(err);
    }
  }

  /**
   * @desc    Delete a policy
   * @route   DELETE /api/policy/deletePolicy/:id
   * @access  Private (Admin/User with policy permission)
   */
  public static async deletePolicy(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const deleted = await AccessPermission.findByIdAndDelete(id);

      if (!deleted) {
        res.status(404).json({ error: 'Policy not found' });
        return;
      }

      res.status(200).json({ message: 'Policy deleted' });
    } catch (err: any) {
      next(err);
    }
  }
}
