const db = require('../config/db');

/**
 * Generates a sequential estimate number in format KCP-YYYY-NNNN
 * @param {string} dateString - ISO date string
 * @returns {Promise<string>} - Generated estimate number
 */
async function generateEstimateNumber(dateString) {
  const date = new Date(dateString);
  const year = date.getFullYear();

  // Count estimates in the same calendar year
  const result = await db.query(
    'SELECT COUNT(*) FROM estimates WHERE EXTRACT(YEAR FROM date) = $1',
    [year]
  );
  
  const count = parseInt(result.rows[0].count);
  const nextNumber = (count + 1).toString().padStart(4, '0');
  
  return `KCP-${year}-${nextNumber}`;
}

module.exports = generateEstimateNumber;
