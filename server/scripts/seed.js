const db = require('../config/db');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');

async function seed() {
  const client = await db.pool.connect();
  try {
    console.log('Creating schema...');
    const schemaSql = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf-8');
    await client.query(schemaSql);

    await client.query('BEGIN');

    console.log('Seeding users...');
    const hashedPwd = await bcrypt.hash('admin123', 10);
    
    // Admin / Dad
    await client.query(`
      INSERT INTO users (name, username, password_hash, role) 
      VALUES ($1, $2, $3, $4) 
      ON CONFLICT (username) DO NOTHING`,
      ['Chetan Khetani', 'chetankhetani', hashedPwd, 'admin']
    );

    // Son / Admin
    await client.query(`
      INSERT INTO users (name, username, password_hash, role) 
      VALUES ($1, $2, $3, $4) 
      ON CONFLICT (username) DO NOTHING`,
      ['Jay Khetani', 'jaykhetani', hashedPwd, 'admin']
    );

    console.log('Seeding products...');
    const products = [
      {
        name: 'Standard Grey Paver',
        product_type: 'paver_block',
        thickness_dimension: '60mm',
        available_colors: ['Grey']
      },
      {
        name: 'Red Interlock Paver',
        product_type: 'paver_block',
        thickness_dimension: '80mm',
        available_colors: ['Red', 'Terracotta']
      },
      {
        name: 'Standard Curb Stone',
        product_type: 'curb_stone',
        thickness_dimension: '12x12x6',
        available_colors: ['Grey']
      }
    ];

    // Read current products to avoid duplicates during simple rerun
    const { rows: existingProducts } = await client.query('SELECT name FROM products');
    const existingNames = new Set(existingProducts.map(p => p.name));

    for (const p of products) {
      if (!existingNames.has(p.name)) {
        await client.query(`
          INSERT INTO products (name, product_type, thickness_dimension, available_colors) 
          VALUES ($1, $2, $3, $4)`,
          [p.name, p.product_type, p.thickness_dimension, p.available_colors]
        );
      }
    }

    await client.query('COMMIT');
    console.log('Seeding completed successfully!');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error seeding database:', err);
  } finally {
    client.release();
    process.exit();
  }
}

seed();
