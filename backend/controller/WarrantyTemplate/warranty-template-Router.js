import { Router } from 'express';
import { verifyLoginToken } from '../../middleware/verify-token.js';
import { checkSubscribedModule } from '../../middleware/check-subscribed-module.js';
import { getCategoriesEndpoint } from './get-categories/index.js';
import { getTemplatesEndpoint } from './get-templates/index.js';
import { getAllTemplatesEndpoint } from './get-all-templates/index.js';
import { initializeDefaultsEndpoint } from './initialize-defaults/index.js';
import { getTemplateWithFieldsEndpoint } from './get-template-with-fields/index.js';
import { createTemplateEndpoint } from './create-template/index.js';
import { updateTemplateEndpoint } from './update-template/index.js';
import { deleteTemplateEndpoint } from './delete-template/index.js';
import { createFieldEndpoint } from './create-field/index.js';
import { updateFieldEndpoint } from './update-field/index.js';
import { deleteFieldEndpoint } from './delete-field/index.js';
import { registerWarrantyEndpoint } from './register-warranty/index.js';
import { getRegistrationsEndpoint } from './get-registrations/index.js';

const router = Router();

router.get('/categories', verifyLoginToken, checkSubscribedModule, getCategoriesEndpoint);
router.get('/templates-all', verifyLoginToken, checkSubscribedModule, getAllTemplatesEndpoint);
router.post('/initialize-defaults', verifyLoginToken, checkSubscribedModule, initializeDefaultsEndpoint);
router.get('/templates', verifyLoginToken, checkSubscribedModule, getTemplatesEndpoint);
router.get('/templates/:id', verifyLoginToken, checkSubscribedModule, getTemplateWithFieldsEndpoint);
router.post('/templates', verifyLoginToken, checkSubscribedModule, createTemplateEndpoint);
router.put('/templates/:id', verifyLoginToken, checkSubscribedModule, updateTemplateEndpoint);
router.delete('/templates/:id', verifyLoginToken, checkSubscribedModule, deleteTemplateEndpoint);
router.post('/templates/:templateId/fields', verifyLoginToken, checkSubscribedModule, createFieldEndpoint);
router.put('/fields/:fieldId', verifyLoginToken, checkSubscribedModule, updateFieldEndpoint);
router.delete('/fields/:fieldId', verifyLoginToken, checkSubscribedModule, deleteFieldEndpoint);
router.post('/register', verifyLoginToken, checkSubscribedModule, registerWarrantyEndpoint);
router.get('/registrations', verifyLoginToken, checkSubscribedModule, getRegistrationsEndpoint);

export default router;
