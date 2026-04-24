// Note: For now, we are generating the document from scratch with a fallback header
// the header and footer accurately mirror the formatting approved in the frontend.

const { Document, Packer, Paragraph, TextRun, AlignmentType, HeadingLevel, BorderStyle, Header, Footer } = require('docx');
const bodyBuilder = require('./bodyBuilder');

/**
 * Generates a DOCX buffer for the given estimate
 * @param {Object} estimate - The full estimate object
 * @returns {Promise<Buffer>}
 */
async function generateDocx(estimate) {
  const bodyContent = bodyBuilder.buildBody(estimate);

  const doc = new Document({
    sections: [{
      properties: {},
      headers: {
        default: new Header({
          children: [fallbackHeader()]
        }),
      },
      footers: {
        default: new Footer({
          children: [fallbackFooter()]
        }),
      },
      children: bodyContent
    }]
  });

  return await Packer.toBuffer(doc);
}

function fallbackHeader() {
  return new Paragraph({
    alignment: AlignmentType.CENTER,
    border: { bottom: { color: "666666", space: 1, style: BorderStyle.SINGLE, size: 6 } },
    children: [
      new TextRun({
        text: "KHETANI CEMENT PRODUCTS",
        bold: true,
        size: 48,
        font: "Georgia",
      }),
      new TextRun({
        text: "\nNr. Hapa Railway Crossing, Behind Renault Showroom, Jamnagar – Rajkot Highway, Jamnagar, Gujarat.",
        size: 18,
        break: 1
      }),
      new TextRun({
        text: "\nGSTIN: 24AEDPK0520Q1ZM    CONTACT NO.: 76218 07404 ; 98243 97944",
        bold: true,
        size: 18,
        break: 1
      })
    ]
  });
}

function fallbackFooter() {
  return new Paragraph({
    alignment: AlignmentType.CENTER,
    border: { top: { color: "666666", space: 1, style: BorderStyle.SINGLE, size: 6 } },
    children: [
      new TextRun({
        text: "Note: Due to the characteristics of rubber mould casting, dimensional variations—particularly in thickness—as well as slight color differences, are to be expected in paver blocks and curb stones.",
        size: 16,
        italics: true
      })
    ]
  });
}

module.exports = {
  generateDocx
};
