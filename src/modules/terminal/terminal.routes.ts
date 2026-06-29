import { Router } from 'express';
import { TerminalController } from './terminal.controller';
import { authMiddleware, CheckPolicyAccess } from '../../middlewares/auth';

const router = Router();

// =========================================================================
// Terminal Templates Routes
// =========================================================================
router.post(
  '/templates',
  authMiddleware as any,
  CheckPolicyAccess('terminalTemplate', 'create') as any,
  TerminalController.createTemplate
);

router.get(
  '/templates',
  authMiddleware as any,
  CheckPolicyAccess('terminalTemplate', 'view') as any,
  TerminalController.getAllTemplates
);

router.get(
  '/templates/:id',
  authMiddleware as any,
  CheckPolicyAccess('terminalTemplate', 'view') as any,
  TerminalController.getTemplateById
);

router.put(
  '/templates/:id',
  authMiddleware as any,
  CheckPolicyAccess('terminalTemplate', 'edit') as any,
  TerminalController.updateTemplate
);

router.delete(
  '/templates/:id',
  authMiddleware as any,
  CheckPolicyAccess('terminalTemplate', 'delete') as any,
  TerminalController.deleteTemplate
);

// =========================================================================
// Terminal Instances Routes
// =========================================================================
router.post(
  '/',
  authMiddleware as any,
  CheckPolicyAccess('terminal', 'create') as any,
  TerminalController.createTerminal
);

router.get(
  '/',
  authMiddleware as any,
  CheckPolicyAccess('terminal', 'view') as any,
  TerminalController.getAllTerminals
);

router.get(
  '/:id',
  authMiddleware as any,
  CheckPolicyAccess('terminal', 'view') as any,
  TerminalController.getTerminalById
);

router.put(
  '/:id',
  authMiddleware as any,
  CheckPolicyAccess('terminal', 'edit') as any,
  TerminalController.updateTerminal
);

router.delete(
  '/:id',
  authMiddleware as any,
  CheckPolicyAccess('terminal', 'delete') as any,
  TerminalController.deleteTerminal
);

router.post(
  '/:id/assign',
  authMiddleware as any,
  CheckPolicyAccess('terminal', 'edit') as any,
  TerminalController.assignProduct
);

router.post(
  '/:id/release',
  authMiddleware as any,
  CheckPolicyAccess('terminal', 'edit') as any,
  TerminalController.releaseProduct
);

export default router;
