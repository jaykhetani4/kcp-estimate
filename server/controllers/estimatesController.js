const db = require('../config/db');
const generateEstimateNumber = require('../utils/generateEstimateNumber');
const exportService = require('../services/exportService');

exports.getEstimates = async (req, res, next) => {
  const { month, year, fy, search } = req.query;
  try {
    let query = `
      SELECT e.*, 
             (SELECT COUNT(*) FROM estimate_items WHERE estimate_id = e.id) as items_count 
      FROM estimates e 
      WHERE 1=1
    `;
    const params = [];

    if (month && year) {
      params.push(month, year);
      query += ` AND EXTRACT(MONTH FROM e.date) = $${params.length - 1} AND EXTRACT(YEAR FROM e.date) = $${params.length}`;
    } else if (year) {
      params.push(year);
      query += ` AND EXTRACT(YEAR FROM e.date) = $${params.length}`;
    } else if (fy) {
      const fyStart = parseInt(fy);
      params.push(`${fyStart}-04-01`, `${fyStart + 1}-03-31`);
      query += ` AND e.date >= $${params.length - 1} AND e.date <= $${params.length}`;
    }

    if (search) {
      params.push(`%${search}%`);
      query += ` AND (e.customer_name ILIKE $${params.length} OR e.estimate_number ILIKE $${params.length})`;
    }

    query += ' ORDER BY e.date DESC, e.estimate_number DESC';

    const result = await db.query(query, params);
    res.json({ data: result.rows });
  } catch (err) {
    next(err);
  }
};

exports.getEstimateById = async (req, res, next) => {
  try {
    const estimateResult = await db.query('SELECT * FROM estimates WHERE id = $1', [req.params.id]);
    const estimate = estimateResult.rows[0];

    if (!estimate) {
      return res.status(404).json({ error: 'Estimate not found' });
    }

    const itemsResult = await db.query('SELECT * FROM estimate_items WHERE estimate_id = $1 ORDER BY sort_order ASC', [req.params.id]);
    const notesResult = await db.query('SELECT * FROM estimate_notes WHERE estimate_id = $1 ORDER BY sort_order ASC', [req.params.id]);

    res.json({
      data: {
        ...estimate,
        items: itemsResult.rows,
        notes: notesResult.rows
      }
    });
  } catch (err) {
    next(err);
  }
};

exports.createEstimate = async (req, res, next) => {
  const { customer_name, company_name, city, state, date, items, notes } = req.body;
  const client = await db.pool.connect();

  try {
    await client.query('BEGIN');

    const estimate_number = await generateEstimateNumber(date);
    
    // Create estimate
    const estimateResult = await client.query(
      `INSERT INTO estimates (estimate_number, customer_name, company_name, city, state, date, created_by) 
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [estimate_number, customer_name, company_name, city, state, date, req.user.id]
    );
    const estimateId = estimateResult.rows[0].id;

    // Create items
    if (items && items.length > 0) {
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        await client.query(
          `INSERT INTO estimate_items (estimate_id, product_id, product_snapshot, price_per_unit, price_unit, gst_percent, transportation_cost, loading_unloading_cost, sort_order) 
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
          [estimateId, item.product_id, item.product_snapshot, item.price_per_unit, item.price_unit, item.gst_percent, item.transportation_cost || 0, item.loading_unloading_cost || 0, i]
        );
      }
    }

    // Create notes
    if (notes && notes.length > 0) {
      const filteredNotes = notes.filter(n => n.note_text && n.note_text.trim() !== '');
      for (let i = 0; i < filteredNotes.length; i++) {
        const note = filteredNotes[i];
        await client.query(
          `INSERT INTO estimate_notes (estimate_id, note_text, sort_order) VALUES ($1, $2, $3)`,
          [estimateId, note.note_text, i]
        );
      }
    }

    await client.query('COMMIT');
    res.status(201).json({ message: 'Estimate created successfully', data: { id: estimateId, estimate_number } });
  } catch (err) {
    await client.query('ROLLBACK');
    next(err);
  } finally {
    client.release();
  }
};

exports.updateEstimate = async (req, res, next) => {
  const { customer_name, company_name, city, state, date, items, notes } = req.body;
  const { id } = req.params;
  const client = await db.pool.connect();

  try {
    await client.query('BEGIN');

    // Update estimate
    const estimateResult = await client.query(
      `UPDATE estimates SET customer_name = $1, company_name = $2, city = $3, state = $4, date = $5, updated_at = NOW() 
       WHERE id = $6 RETURNING *`,
      [customer_name, company_name, city, state, date, id]
    );

    if (estimateResult.rowCount === 0) {
      throw new Error('Estimate not found');
    }

    // Delete existing items and notes (Full Replace Strategy)
    await client.query('DELETE FROM estimate_items WHERE estimate_id = $1', [id]);
    await client.query('DELETE FROM estimate_notes WHERE estimate_id = $1', [id]);

    // Re-insert items
    if (items && items.length > 0) {
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        await client.query(
          `INSERT INTO estimate_items (estimate_id, product_id, product_snapshot, price_per_unit, price_unit, gst_percent, transportation_cost, loading_unloading_cost, sort_order) 
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
          [id, item.product_id, item.product_snapshot, item.price_per_unit, item.price_unit, item.gst_percent, item.transportation_cost || 0, item.loading_unloading_cost || 0, i]
        );
      }
    }

    // Re-insert notes
    if (notes && notes.length > 0) {
      const filteredNotes = notes.filter(n => n.note_text && n.note_text.trim() !== '');
      for (let i = 0; i < filteredNotes.length; i++) {
        const note = filteredNotes[i];
        await client.query(
          `INSERT INTO estimate_notes (estimate_id, note_text, sort_order) VALUES ($1, $2, $3)`,
          [id, note.note_text, i]
        );
      }
    }

    await client.query('COMMIT');
    res.json({ message: 'Estimate updated successfully' });
  } catch (err) {
    await client.query('ROLLBACK');
    next(err);
  } finally {
    client.release();
  }
};

exports.deleteEstimate = async (req, res, next) => {
  try {
    const result = await db.query('DELETE FROM estimates WHERE id = $1 RETURNING *', [req.params.id]);
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Estimate not found' });
    }
    res.json({ message: 'Estimate deleted successfully (hard delete)' });
  } catch (err) {
    next(err);
  }
};

exports.exportEstimate = async (req, res, next) => {
  try {
    const estimateResult = await db.query('SELECT * FROM estimates WHERE id = $1', [req.params.id]);
    const estimate = estimateResult.rows[0];

    if (!estimate) {
      return res.status(404).json({ error: 'Estimate not found' });
    }

    const itemsResult = await db.query('SELECT * FROM estimate_items WHERE estimate_id = $1 ORDER BY sort_order ASC', [req.params.id]);
    const notesResult = await db.query('SELECT * FROM estimate_notes WHERE estimate_id = $1 ORDER BY sort_order ASC', [req.params.id]);

    const fullEstimate = {
      ...estimate,
      items: itemsResult.rows,
      notes: notesResult.rows
    };

    const docBuffer = await exportService.generateDocx(fullEstimate);
    
    const filename = `${estimate.estimate_number}_${estimate.customer_name.replace(/\s+/g, '_')}.docx`;

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    res.setHeader('Content-Disposition', `attachment; filename=${filename}`);
    res.send(Buffer.from(docBuffer));

  } catch (err) {
    next(err);
  }
};

exports.previewEstimate = async (req, res, next) => {
  // Preview is just the full estimate data in JSON format for the frontend to render
  this.getEstimateById(req, res, next);
};
