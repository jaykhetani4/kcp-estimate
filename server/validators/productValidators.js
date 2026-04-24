const { body } = require('express-validator');

exports.productValidators = [
  body('name').trim().notEmpty().withMessage('Product name is required').isLength({ max: 255 }),
  body('product_type').isIn(['paver_block', 'curb_stone']).withMessage('Invalid product type'),
  body('thickness_dimension').optional().isLength({ max: 100 }),
  body('available_colors').optional().isArray().withMessage('Available colors must be an array')
];
