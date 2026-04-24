import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, FileText, Download, Printer, Trash2 } from 'lucide-react';
import { Layout } from '../components/layout/Layout';
import { Button } from '../components/common/Button';
import { Input } from '../components/common/Input';
import { Select } from '../components/common/Select';
import { EmptyState } from '../components/common/EmptyState';
import { Modal } from '../components/common/Modal';
import api from '../utils/api';
import { formatDate } from '../utils/formatters';
import { toast } from 'sonner';

export const Estimates = () => {
  const navigate = useNavigate();
  const [estimates, setEstimates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    month: '',
    year: new Date().getFullYear().toString(),
    fy: ''
  });
  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; estimateId: string | null }>({
    isOpen: false,
    estimateId: null
  });

  useEffect(() => {
    loadEstimates();
  }, [filters]);

  const loadEstimates = async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (filters.fy) {
        params.fy = filters.fy;
      } else {
        if (filters.month) params.month = filters.month;
        if (filters.year) params.year = filters.year;
      }
      if (searchTerm) params.search = searchTerm;

      const response = await api.get('/estimates', { params });
      setEstimates(response.data.data);
    } catch (error) {
      console.error('Failed to load estimates', error);
      toast.error('Failed to load estimates');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (id: string, estimateNumber: string) => {
    try {
      toast.info('Generating document...');
      const response = await api.get(`/estimates/${id}/export`, {
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${estimateNumber}.docx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success('Download started');
    } catch (error) {
      console.error('Export failed', error);
      toast.error('Failed to export document');
    }
  };

  const handleDelete = (id: string) => {
    setDeleteModal({ isOpen: true, estimateId: id });
  };

  const confirmDelete = async () => {
    if (deleteModal.estimateId) {
      try {
        await api.delete(`/estimates/${deleteModal.estimateId}`);
        toast.success('Estimate deleted successfully');
        loadEstimates();
      } catch (error) {
        console.error('Failed to delete estimate', error);
        toast.error('Failed to delete estimate');
      }
    }
    setDeleteModal({ isOpen: false, estimateId: null });
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Estimates</h1>
          <Button onClick={() => navigate('/estimates/new')} size="sm" className="sm:text-base">
            <Plus size={20} className="mr-2" />
            Create Estimate
          </Button>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-1">
              <Input
                placeholder="Search customer..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && loadEstimates()}
              />
            </div>
            <Select
              placeholder="Month"
              value={filters.month}
              onChange={e => setFilters({ ...filters, month: e.target.value, fy: '' })}
              options={[
                { value: '', label: 'All Months' },
                ...Array.from({ length: 12 }, (_, i) => ({
                  value: (i + 1).toString(),
                  label: new Date(2000, i).toLocaleString('default', { month: 'long' })
                }))
              ]}
            />
            <Select
              placeholder="Year"
              value={filters.year}
              onChange={e => setFilters({ ...filters, year: e.target.value, fy: '' })}
              options={Array.from({ length: 5 }, (_, i) => {
                const y = (new Date().getFullYear() - i).toString();
                return { value: y, label: y };
              })}
            />
            <Select
              placeholder="Financial Year"
              value={filters.fy}
              onChange={e => setFilters({ ...filters, fy: e.target.value, month: '', year: '' })}
              options={[
                { value: '', label: 'No FY Filter' },
                ...Array.from({ length: 3 }, (_, i) => {
                  const y = new Date().getFullYear() - i;
                  return { value: (y - (new Date().getMonth() < 3 ? 1 : 0)).toString(), label: `FY ${y - 1}-${y.toString().slice(-2)}` };
                })
              ]}
            />
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="text-gray-500">Loading estimates...</div>
          </div>
        ) : estimates.length > 0 ? (
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estimate #</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Items</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {estimates.map(est => (
                    <tr key={est.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-red-600">
                        {est.estimate_number}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{est.customer_name}</div>
                        <div className="text-sm text-gray-500">{est.city}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(est.date)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {est.items_count} items
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                        <button
                          onClick={() => navigate(`/estimates/${est.id}/preview`)}
                          className="text-gray-600 hover:text-red-600 transition-colors"
                          title="Preview"
                        >
                          <FileText size={18} />
                        </button>
                        <button
                          onClick={() => handleDownload(est.id, est.estimate_number)}
                          className="text-gray-600 hover:text-red-600 transition-colors"
                          title="Download DOCX"
                        >
                          <Download size={18} />
                        </button>
                        <button
                          onClick={() => navigate(`/estimates/${est.id}/edit`)}
                          className="text-gray-600 hover:text-red-600 transition-colors"
                          title="Edit"
                        >
                          <Printer size={18} />
                        </button>
                        <button
                          onClick={() => handleDelete(est.id)}
                          className="text-gray-600 hover:text-red-600 transition-colors"
                          title="Delete"
                        >
                          <Trash2 size={18} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <EmptyState
            icon={<FileText size={48} />}
            title="No estimates found"
            description="Create your first quotation for a customer"
            action={
              <Button onClick={() => navigate('/estimates/new')}>
                <Plus size={20} className="mr-2" />
                Create Estimate
              </Button>
            }
          />
        )}
      </div>

      <Modal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false, estimateId: null })}
        title="Delete Estimate"
        size="sm"
      >
        <p className="text-gray-700 mb-4">
          Are you sure you want to delete this estimate? All items and notes will be permanently removed.
        </p>
        <div className="flex gap-3">
          <Button variant="danger" onClick={confirmDelete}>
            Delete
          </Button>
          <Button
            variant="outline"
            onClick={() => setDeleteModal({ isOpen: false, estimateId: null })}
          >
            Cancel
          </Button>
        </div>
      </Modal>
    </Layout>
  );
};
