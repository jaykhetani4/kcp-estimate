import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Download, Printer, Share2 } from 'lucide-react';
import { Layout } from '../components/layout/Layout';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';
import api from '../utils/api';
import { formatDate, formatCurrency } from '../utils/formatters';
import { toast } from 'sonner';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

interface PageContent {
  items: any[];
  notes: any[];
}

export const EstimatePreview = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [estimate, setEstimate] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [pages, setPages] = useState<PageContent[]>([]);
  const previewRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (id) {
      loadEstimate();
    }
  }, [id]);

  const loadEstimate = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/estimates/${id}`);
      const data = response.data.data;
      setEstimate(data);

      if (data) {
        const itemsPerPage = 2;
        const paginatedPages: PageContent[] = [];

        for (let i = 0; i < data.items.length; i += itemsPerPage) {
          const pageItems = data.items.slice(i, i + itemsPerPage);
          paginatedPages.push({ items: pageItems, notes: [] });
        }

        if (paginatedPages.length === 0) {
          paginatedPages.push({ items: [], notes: data.notes || [] });
        } else {
          paginatedPages[paginatedPages.length - 1].notes = data.notes || [];
        }

        setPages(paginatedPages);
      }
    } catch (error) {
      console.error('Failed to load estimate', error);
      toast.error('Estimate not found');
      navigate('/estimates');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Generates a PDF Blob from the rendered preview pages.
   * Uses foreignObjectRendering so the browser's native engine renders it —
   * fully supporting Tailwind v4 oklch colors.
   */
  const generatePdf = async (): Promise<Blob> => {
    const container = previewRef.current;
    if (!container) throw new Error('Preview not ready');

    const pageEls = container.querySelectorAll<HTMLElement>('.pdf-page');
    if (pageEls.length === 0) throw new Error('No pages found');

    const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

    for (let i = 0; i < pageEls.length; i++) {
      const canvas = await html2canvas(pageEls[i], {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
        foreignObjectRendering: true, // Uses browser's native renderer — supports oklch
        logging: false,
      });
      const imgData = canvas.toDataURL('image/jpeg', 0.95);
      if (i > 0) pdf.addPage();
      pdf.addImage(imgData, 'JPEG', 0, 0, 210, 297);
    }

    return pdf.output('blob');
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = async () => {
    if (!estimate || generating) return;
    setGenerating(true);
    const toastId = toast.loading('Generating PDF...');
    try {
      const blob = await generatePdf();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${estimate.estimate_number}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      toast.success('PDF downloaded!', { id: toastId });
    } catch (err) {
      console.error('PDF generation failed:', err);
      toast.error('Failed to generate PDF', { id: toastId });
    } finally {
      setGenerating(false);
    }
  };

  const handleWhatsAppShare = async () => {
    if (!estimate || generating) return;
    setGenerating(true);
    const toastId = toast.loading('Generating PDF for WhatsApp...');
    try {
      const blob = await generatePdf();
      const file = new File([blob], `${estimate.estimate_number}.pdf`, { type: 'application/pdf' });

      const text = `Quotation from Khetani Cement Products\nQuotation No: ${estimate.estimate_number}\nDate: ${formatDate(estimate.date)}\nCustomer: ${estimate.customer_name}\n\nPlease find the attached PDF quotation.`;

      // Web Share API — directly shares PDF to WhatsApp on mobile and modern browsers
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        toast.dismiss(toastId);
        await navigator.share({ files: [file], title: estimate.estimate_number, text });
      } else {
        // Desktop fallback: download PDF + open WhatsApp Web
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${estimate.estimate_number}.pdf`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
        window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
        toast.success('PDF saved — attach it in WhatsApp!', { id: toastId });
      }
    } catch (err: any) {
      if (err?.name !== 'AbortError') {
        console.error('WhatsApp share failed:', err);
        toast.error('Failed to share', { id: toastId });
      } else {
        toast.dismiss(toastId);
      }
    } finally {
      setGenerating(false);
    }
  };


  if (loading) {
    return (
      <Layout>
        <div className="flex justify-center items-center h-64">
          <div className="text-gray-500">Loading preview...</div>
        </div>
      </Layout>
    );
  }

  if (!estimate) {
    return (
      <Layout>
        <div className="text-center py-12">
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">Estimate not found</h2>
          <Button onClick={() => navigate('/estimates')}>Back to Estimates</Button>
        </div>
      </Layout>
    );
  }

  const LetterheadHeader = () => (
    <div className="border-b-2 border-gray-300 pb-4 mb-6">
      <div className="text-center mb-3">
        <h1 className="text-3xl font-extrabold text-gray-900 tracking-wider" style={{ fontFamily: 'Georgia, serif' }}>
          KHETANI CEMENT PRODUCTS
        </h1>
      </div>

      <div className="text-center text-xs text-gray-700 space-y-1">
        <p className="font-medium">
          Nr. Hapa Railway Crossing, Behind Renault Showroom, Jamnagar – Rajkot Highway, Jamnagar, Gujarat.
        </p>
        <p className="pt-1">
          <span className="font-semibold">GSTIN: </span>
          <span className="font-bold">24AEDPK0520Q1ZM</span>
        </p>
        <p className="font-semibold">
          CONTACT NO.: 76218 07404 ; 98243 97944
        </p>
      </div>
    </div>
  );

  const LetterheadFooter = ({ pageNum, totalPages }: { pageNum: number; totalPages: number }) => (
    <div className="border-t border-gray-300 pt-3 mt-6 text-center text-xs text-gray-600">
      <p className="mb-2 leading-relaxed">
        <span className="font-semibold">Note:</span> Due to the characteristics of rubber mould casting,
        dimensional variations—particularly in thickness—as well as slight color differences, are to be
        expected in paver blocks and curb stones.
      </p>
      <p className="text-gray-500">Page {pageNum} of {totalPages}</p>
    </div>
  );

  return (
    <>
      <div className="no-print bg-gray-50 border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
            <Button variant="ghost" onClick={() => navigate('/estimates')} size="sm">
              <ArrowLeft size={16} className="sm:w-[18px] sm:h-[18px] mr-2" />
              Back to Estimates
            </Button>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" size="sm" onClick={handlePrint}>
                <Printer size={16} className="sm:w-[18px] sm:h-[18px] mr-2" />
                <span className="hidden sm:inline">Print</span>
                <span className="sm:hidden">Print</span>
              </Button>
              <Button variant="outline" size="sm" onClick={handleDownload} disabled={generating}>
                <Download size={16} className="sm:w-[18px] sm:h-[18px] mr-2" />
                <span className="hidden sm:inline">{generating ? 'Generating...' : 'Download PDF'}</span>
                <span className="sm:hidden">PDF</span>
              </Button>
              <Button variant="outline" size="sm" onClick={handleWhatsAppShare} disabled={generating}>
                <Share2 size={16} className="sm:w-[18px] sm:h-[18px] mr-2" />
                <span className="hidden sm:inline">{generating ? 'Preparing...' : 'WhatsApp'}</span>
                <span className="sm:hidden">Share</span>
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div ref={previewRef} className="bg-gray-100 min-h-screen py-4 sm:py-8 print:py-0 print:bg-white px-2 sm:px-0">
        {pages.map((page, pageIndex) => (
          <div
            key={pageIndex}
            className="bg-white w-full sm:max-w-[210mm] mx-auto mb-8 print:mb-0 shadow-lg print:shadow-none page-break pdf-page flex flex-col print:h-[297mm]"
            style={{
              minHeight: '297mm',
              padding: '8mm 10mm',
            }}
          >
            {/* Header - appears on every page */}
            <LetterheadHeader />

            {/* Content Area */}
            <div className="flex-1">
            {/* Customer Info - only on first page */}
            {pageIndex === 0 && (
              <div className="mb-6">
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900 mb-3">QUOTATION</h2>
                    <div className="space-y-1 text-sm">
                      <div className="flex">
                        <span className="font-semibold text-gray-700 w-32">Quotation No:</span>
                        <span className="text-gray-900">{estimate.estimate_number}</span>
                      </div>
                      <div className="flex">
                        <span className="font-semibold text-gray-700 w-32">Date:</span>
                        <span className="text-gray-900">{formatDate(estimate.date)}</span>
                      </div>
                    </div>
                  </div>
                  <div className="border-l-4 border-black pl-4">
                    <h3 className="font-semibold text-gray-700 mb-2">TO:</h3>
                    <div className="space-y-1 text-sm">
                      <p className="font-semibold text-gray-900">{estimate.customer_name}</p>
                      {estimate.company_name && (
                        <p className="text-gray-700">{estimate.company_name}</p>
                      )}
                      <p className="text-gray-700">
                        {estimate.city}, {estimate.state}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Items for this page */}
            {page.items.length > 0 && (
              <div className="mb-6">
                <h3 className="text-base font-semibold text-gray-900 mb-3">
                  {pageIndex === 0 ? 'Product Details' : 'Product Details (continued)'}
                </h3>
                <div className="space-y-4">
                  {page.items.map((item: any, index: number) => {
                    // Calculate total cost
                    const basePrice = parseFloat(item.price_per_unit);
                    const gstAmount = (basePrice * parseFloat(item.gst_percent)) / 100;
                    const transportCost = parseFloat(item.transportation_cost) || 0;
                    const loadingCost = parseFloat(item.loading_unloading_cost) || 0;
                    const totalCost = basePrice + gstAmount + transportCost + loadingCost;

                    return (
                      <div key={index} className="border border-gray-300 rounded-lg overflow-hidden shadow-sm">
                        {/* Product Name Header */}
                        <div className="bg-white px-4 py-2.5 border-b border-gray-300">
                          <h4 className="text-lg font-bold text-gray-900">
                            {item.product_snapshot?.name || 'Unknown Product'}
                          </h4>
                        </div>

                        {/* Product Details */}
                        <div className="bg-gray-50 px-4 py-3">
                          {/* Type and Dimension Row */}
                          <div className="grid grid-cols-2 gap-6 mb-3">
                            <div className="text-sm">
                              <span className="text-gray-700 font-medium">Type: </span>
                              <Badge
                                variant="primary"
                                size="sm"
                              >
                                {item.product_snapshot?.product_type === 'paver_block'
                                  ? 'Paver Block'
                                  : 'Curb Stone'}
                              </Badge>
                            </div>
                            {item.product_snapshot?.thickness_dimension && (
                              <div className="text-sm">
                                <span className="text-gray-700 font-medium">Dimension: </span>
                                <span className="text-gray-900">{item.product_snapshot.thickness_dimension}</span>
                              </div>
                            )}
                          </div>

                          {/* Available Colors Row */}
                          {item.product_snapshot?.available_colors?.length > 0 && (
                            <div className="text-sm mb-3">
                              <span className="text-gray-700 font-medium">Available Colors: </span>
                              <span className="text-gray-900">
                                {item.product_snapshot.available_colors.join(', ')}
                              </span>
                            </div>
                          )}

                          {/* Divider */}
                          <div className="border-t border-gray-300 my-3"></div>

                          {/* Price and GST Row */}
                          <div className="grid grid-cols-2 gap-6 mb-3">
                            <div className="text-sm">
                              <span className="text-gray-700 font-medium">Price: </span>
                              <span className="text-gray-900 font-semibold">
                                {formatCurrency(basePrice)}{' '}
                                {item.price_unit === 'per_sqft' ? 'per sq.ft' : 'per piece'}
                              </span>
                            </div>
                            <div className="text-sm">
                              <span className="text-gray-700 font-medium">GST: </span>
                              <span className="text-gray-900 font-semibold">{item.gst_percent}%</span>
                            </div>
                          </div>

                          {/* Transportation and Loading Row - Only show if values exist */}
                          {(transportCost > 0 || loadingCost > 0) && (
                            <div className={`grid ${transportCost > 0 && loadingCost > 0 ? 'grid-cols-2' : 'grid-cols-1'} gap-6 mb-3`}>
                              {transportCost > 0 && (
                                <div className="text-sm">
                                  <span className="text-gray-700 font-medium">Transportation: </span>
                                  <span className="text-gray-900">
                                    {formatCurrency(transportCost)} per unit
                                  </span>
                                </div>
                              )}
                              {loadingCost > 0 && (
                                <div className="text-sm">
                                  <span className="text-gray-700 font-medium">Loading & Unloading: </span>
                                  <span className="text-gray-900">
                                    {formatCurrency(loadingCost)} per unit
                                  </span>
                                </div>
                              )}
                            </div>
                          )}

                          {/* Total Cost */}
                          <div className="border-t border-gray-300 pt-3 mt-3">
                            <div className="flex justify-between items-center">
                              <span className="text-sm font-bold text-gray-800">Total Cost:</span>
                              <span className="text-base font-bold text-red-600">
                                {formatCurrency(totalCost)}{' '}
                                {item.price_unit === 'per_sqft' ? 'per sq.ft' : 'per piece'}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Summary - only on last page */}
            {pageIndex === pages.length - 1 && (
              <div className="mb-4">
                <div className="bg-red-50 border border-red-200 rounded p-3">
                  <div className="flex justify-between items-center text-sm">
                    <span className="font-semibold text-gray-700">Total Number of Products:</span>
                    <span className="text-lg font-bold text-red-600">{estimate.items.length}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Notes - only on last page */}
            {pageIndex === pages.length - 1 && page.notes.length > 0 && (
              <div className="mb-4">
                <h3 className="text-base font-semibold text-gray-900 mb-2">
                  Terms & Conditions
                </h3>
                <ul className="list-disc list-inside space-y-1 text-sm text-gray-700">
                  {page.notes.map((note: any, index: number) => (
                    <li key={index}>{note.note_text}</li>
                  ))}
                </ul>
              </div>
            )}
            </div>

            {/* Footer - appears on every page */}
            <div className="mt-auto">
              <LetterheadFooter pageNum={pageIndex + 1} totalPages={pages.length} />
            </div>
          </div>
        ))}
      </div>

      <style>{`
        @media print {
          .no-print {
            display: none !important;
          }

          body {
            margin: 0;
            padding: 0;
            background: white;
          }

          .page-break {
            page-break-after: always;
            box-shadow: none !important;
            margin: 0 !important;
            max-width: 210mm !important;
            width: 210mm !important;
            height: 297mm !important;
            padding: 12mm 15mm !important;
          }

          .page-break:last-child {
            page-break-after: auto;
          }

          @page {
            size: A4;
            margin: 0;
          }
        }
      `}</style>
    </>
  );
};
