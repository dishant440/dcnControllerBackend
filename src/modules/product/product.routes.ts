import { Router } from 'express';
import { ProductController } from './product.controller';
import { authMiddleware, CheckPolicyAccess } from '../../middlewares/auth';

const router = Router();

// =========================================================================
// Product Templates Routes
// =========================================================================
router.post(
  '/templates',
  authMiddleware as any,
  CheckPolicyAccess('productTemplate', 'create') as any,
  ProductController.createTemplate
);

router.get(
  '/templates',
  authMiddleware as any,
  CheckPolicyAccess('productTemplate', 'view') as any,
  ProductController.getAllTemplates
);

router.get(
  '/templates/:id',
  authMiddleware as any,
  CheckPolicyAccess('productTemplate', 'view') as any,
  ProductController.getTemplateById
);

router.put(
  '/templates/:id',
  authMiddleware as any,
  CheckPolicyAccess('productTemplate', 'edit') as any,
  ProductController.updateTemplate
);

router.delete(
  '/templates/:id',
  authMiddleware as any,
  CheckPolicyAccess('productTemplate', 'delete') as any,
  ProductController.deleteTemplate
);

// =========================================================================
// Products Routes
// =========================================================================
router.post(
  '/',
  authMiddleware as any,
  CheckPolicyAccess('product', 'create') as any,
  ProductController.createProduct
);

router.get(
  '/',
  authMiddleware as any,
  CheckPolicyAccess('product', 'view') as any,
  ProductController.getAllProducts
);

router.get(
  '/:id',
  authMiddleware as any,
  CheckPolicyAccess('product', 'view') as any,
  ProductController.getProductById
);

router.put(
  '/:id',
  authMiddleware as any,
  CheckPolicyAccess('product', 'edit') as any,
  ProductController.updateProduct
);

router.delete(
  '/:id',
  authMiddleware as any,
  CheckPolicyAccess('product', 'delete') as any,
  ProductController.deleteProduct
);

export default router;
