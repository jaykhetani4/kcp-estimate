const db = require('../config/db');

exports.getProducts = async (req, res, next) => {
  try {
    const { search, type } = req.query;
    let query = 'SELECT * FROM products WHERE is_active = TRUE';
    const params = [];

    if (search) {
      params.push(`%${search}%`);
      query += ` AND name ILIKE $${params.length}`;
    }

    if (type && type !== 'all') {
      params.push(type);
      query += ` AND product_type = $${params.length}`;
    }

    query += ' ORDER BY name ASC';
    
    const result = await db.query(query, params);
    res.json({ data: result.rows });
  } catch (err) {
    next(err);
  }
};

exports.getProductById = async (req, res, next) => {
  try {
    const result = await db.query('SELECT * FROM products WHERE id = $1 AND is_active = TRUE', [req.params.id]);
    const product = result.rows[0];

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    res.json({ data: product });
  } catch (err) {
    next(err);
  }
};

exports.createProduct = async (req, res, next) => {
  const { name, product_type, thickness_dimension, available_colors } = req.body;

  try {
    const result = await db.query(
      'INSERT INTO products (name, product_type, thickness_dimension, available_colors) VALUES ($1, $2, $3, $4) RETURNING *',
      [name, product_type, thickness_dimension, available_colors || []]
    );
    res.status(201).json({ message: 'Product created successfully', data: result.rows[0] });
  } catch (err) {
    next(err);
  }
};

exports.updateProduct = async (req, res, next) => {
  const { name, product_type, thickness_dimension, available_colors } = req.body;
  const { id } = req.params;

  try {
    const result = await db.query(
      'UPDATE products SET name = $1, product_type = $2, thickness_dimension = $3, available_colors = $4, updated_at = NOW() WHERE id = $5 AND is_active = TRUE RETURNING *',
      [name, product_type, thickness_dimension, available_colors || [], id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }

    res.json({ message: 'Product updated successfully', data: result.rows[0] });
  } catch (err) {
    next(err);
  }
};

exports.deleteProduct = async (req, res, next) => {
  const { id } = req.params;

  try {
    const result = await db.query(
      'UPDATE products SET is_active = FALSE, updated_at = NOW() WHERE id = $1 RETURNING *',
      [id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }

    res.json({ message: 'Product deleted successfully (soft delete)' });
  } catch (err) {
    next(err);
  }
};
