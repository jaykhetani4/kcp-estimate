const { Table, TableRow, TableCell, Paragraph, TextRun, AlignmentType, WidthType, BorderStyle, HeadingLevel } = require('docx');

/**
 * Builds the dynamic body content for the DOCX export
 * @param {Object} estimate - The full estimate object
 */
function buildBody(estimate) {
  const sections = [];

  // Header Title
  sections.push(
    new Paragraph({
      text: "QUOTATION",
      heading: HeadingLevel.HEADING_1,
      alignment: AlignmentType.CENTER,
      spacing: { after: 400 }
    })
  );

  // Customer & Estimate Info Table
  sections.push(
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [
        new TableRow({
          children: [
            new TableCell({
              width: { size: 50, type: WidthType.PERCENTAGE },
              children: [
                new Paragraph({ children: [new TextRun({ text: "Quotation No: ", bold: true }), new TextRun(estimate.estimate_number)] }),
                new Paragraph({ children: [new TextRun({ text: "Date: ", bold: true }), new TextRun(new Date(estimate.date).toLocaleDateString('en-IN'))] }),
              ],
              borders: { right: { style: BorderStyle.NONE, size: 0 } }
            }),
            new TableCell({
              width: { size: 50, type: WidthType.PERCENTAGE },
              children: [
                new Paragraph({ children: [new TextRun({ text: "TO:", bold: true })] }),
                new Paragraph({ children: [new TextRun({ text: estimate.customer_name, bold: true })] }),
                estimate.company_name ? new Paragraph({ text: estimate.company_name }) : null,
                new Paragraph({ text: `${estimate.city}, ${estimate.state}` }),
              ].filter(Boolean),
              borders: { left: { color: "000000", size: 20, style: BorderStyle.SINGLE } }
            })
          ]
        })
      ],
      spacing: { after: 400 }
    })
  );

  sections.push(new Paragraph({ text: "Product Details", heading: HeadingLevel.HEADING_3, spacing: { before: 200, after: 200 } }));

  // Items Tables (One table per item to match frontend card style)
  estimate.items.forEach((item, index) => {
    const basePrice = parseFloat(item.price_per_unit);
    const gstPercent = parseFloat(item.gst_percent);
    const gstAmount = (basePrice * gstPercent) / 100;
    const transport = parseFloat(item.transportation_cost) || 0;
    const loading = parseFloat(item.loading_unloading_cost) || 0;
    const total = basePrice + gstAmount + transport + loading;
    const snapshot = item.product_snapshot || {};

    sections.push(
      new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: [
          // Item Header
          new TableRow({
            children: [
              new TableCell({
                children: [new Paragraph({ children: [new TextRun({ text: snapshot.name || "Unknown Product", bold: true, size: 24 })] })],
                shading: { fill: "F3F4F6" }
              })
            ]
          }),
          // Details
          new TableRow({
            children: [
              new TableCell({
                children: [
                   new Paragraph({
                     children: [
                       new TextRun({ text: "Type: ", bold: true }), 
                       new TextRun(snapshot.product_type === 'paver_block' ? 'Paver Block' : 'Curb Stone'),
                       new TextRun({ text: "    Dimension: ", bold: true }),
                       new TextRun(snapshot.thickness_dimension || 'N/A')
                     ]
                   }),
                   snapshot.available_colors && snapshot.available_colors.length > 0 ? 
                   new Paragraph({ children: [new TextRun({ text: "Colors: ", bold: true }), new TextRun(snapshot.available_colors.join(', '))] }) : null,
                   new Paragraph({ text: "" }), // spacer
                   new Table({
                    width: { size: 100, type: WidthType.PERCENTAGE },
                    borders: { top: { style: BorderStyle.DASHED, size: 1 }, bottom: { style: BorderStyle.DASHED, size: 1 }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE } },
                    rows: [
                      new TableRow({
                        children: [
                          new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Price: ", bold: true }), new TextRun(`₹${basePrice} ${item.price_unit === 'per_sqft' ? '/sq.ft' : '/pc'}`)] })] }),
                          new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "GST: ", bold: true }), new TextRun(`${gstPercent}%`)] })] })
                        ]
                      })
                    ]
                   }),
                   (transport > 0 || loading > 0) ? new Paragraph({
                     children: [
                       transport > 0 ? new TextRun({ text: `Transportation: ₹${transport}/unit    `, size: 18 }) : null,
                       loading > 0 ? new TextRun({ text: `Loading/Unloading: ₹${loading}/unit`, size: 18 }) : null
                     ].filter(Boolean)
                   }) : null,
                   new Paragraph({
                    alignment: AlignmentType.RIGHT,
                    spacing: { before: 100 },
                    children: [
                      new TextRun({ text: "Total Cost: ", bold: true }),
                      new TextRun({ text: `₹${total.toFixed(2)} ${item.price_unit === 'per_sqft' ? '/sq.ft' : '/pc'}`, bold: true, color: "DC2626", size: 24 })
                    ]
                   })
                ].filter(Boolean)
              })
            ]
          })
        ],
        spacing: { after: 300 }
      })
    );
  });

  // Summary
  sections.push(
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [
        new TableRow({
          children: [
            new TableCell({
              shading: { fill: "FEF2F2" },
              children: [
                new Paragraph({
                  alignment: AlignmentType.CENTER,
                  children: [
                    new TextRun({ text: "Total Number of Products: ", bold: true }),
                    new TextRun({ text: `${estimate.items.length}`, bold: true, color: "DC2626", size: 28 })
                  ]
                })
              ]
            })
          ]
        })
      ],
      spacing: { before: 200, after: 400 }
    })
  );

  // Notes
  if (estimate.notes && estimate.notes.length > 0) {
    sections.push(new Paragraph({ text: "Terms & Conditions", heading: HeadingLevel.HEADING_3, spacing: { after: 100 } }));
    estimate.notes.forEach(note => {
      sections.push(new Paragraph({
        text: note.note_text,
        bullet: { level: 0 },
        spacing: { after: 50 }
      }));
    });
  }

  return sections;
}

module.exports = {
  buildBody
};
