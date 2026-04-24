const express = require('express');
const router = express.Router();
const productsController = require('../controllers/productsController');
const auth = require('../middleware/auth');
const validate = require('../middleware/validate');
const { productValidators } = require('../validators/productValidators');

router.use(auth);

router.get('/', productsController.getProducts);
router.get('/:id', productsController.getProductById);
router.post('/', productValidators, validate, productsController.createProduct);
router.put('/:id', productValidators, validate, productsController.updateProduct);
router.delete('/:id', productsController.deleteProduct);

module.exports = router;
