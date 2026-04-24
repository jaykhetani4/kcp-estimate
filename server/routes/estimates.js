const express = require('express');
const router = express.Router();
const estimatesController = require('../controllers/estimatesController');
const auth = require('../middleware/auth');
const validate = require('../middleware/validate');
const { body } = require('express-validator');

const estimateValidators = [
  body('customer_name').trim().notEmpty().withMessage('Customer name is required'),
  body('city').trim().notEmpty().withMessage('City is required'),
  body('state').trim().notEmpty().withMessage('State is required'),
  body('date').isISO8601().withMessage('Valid date is required'),
  body('items').isArray({ min: 1 }).withMessage('At least one item is required'),
  body('items.*.product_id').notEmpty().withMessage('Product ID is required'),
  body('items.*.price_per_unit').isNumeric({ min: 0.01 }).withMessage('Price must be greater than 0'),
  body('items.*.price_unit').isIn(['per_sqft', 'per_piece']).withMessage('Invalid price unit'),
  body('items.*.gst_percent').isNumeric({ min: 0 }).withMessage('GST must be at least 0')
];

router.use(auth);

router.get('/', estimatesController.getEstimates);
router.get('/:id', estimatesController.getEstimateById);
router.post('/', estimateValidators, validate, estimatesController.createEstimate);
router.put('/:id', estimateValidators, validate, estimatesController.updateEstimate);
router.delete('/:id', estimatesController.deleteEstimate);
router.get('/:id/export', estimatesController.exportEstimate);
router.get('/:id/preview', estimatesController.previewEstimate);

module.exports = router;
