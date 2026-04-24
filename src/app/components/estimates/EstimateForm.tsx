import { useState, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Save, Eye, Download } from 'lucide-react';
import { CustomerSection } from './CustomerSection';
import { ItemsSection } from './ItemsSection';
import { NotesSection } from './NotesSection';
import { Button } from '../common/Button';
import api from '../../utils/api';
import { formatDateInput } from '../../utils/formatters';
import { toast } from 'sonner';
import { EstimateItem } from './ItemRow';
import { EstimateNote } from './NotesSection';

interface Estimate {
  id?: string;
  estimate_number?: string;
  customer_name: string;
  company_name: string;
  city: string;
  state: string;
  date: string;
  items: EstimateItem[];
  notes: EstimateNote[];
  status?: 'draft' | 'sent';
}

interface EstimateFormProps {
  estimate?: Estimate;
  isEdit?: boolean;
}

export const EstimateForm = ({ estimate, isEdit = false }: EstimateFormProps) => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState<Estimate>(
    estimate || {
      customer_name: '',
      company_name: '',
      city: '',
      state: '',
      date: formatDateInput(new Date()),
      items: [],
      notes: [],
      status: 'draft'
    }
  );
  const [errors, setErrors] = useState<Record<string, any>>({});
  const [isSaving, setIsSaving] = useState(false);

  const validate = () => {
    const newErrors: Record<string, any> = {};

    if (!formData.customer_name.trim()) {
      newErrors.customer_name = 'Customer name is required';
    }
    if (!formData.city.trim()) {
      newErrors.city = 'City is required';
    }
    if (!formData.state) {
      newErrors.state = 'State is required';
    }
    if (!formData.date) {
      newErrors.date = 'Date is required';
    }
    if (formData.items.length === 0) {
      newErrors.items = 'At least one item is required';
    }

    // Validate items
    formData.items.forEach((item, index) => {
      const itemErrors: Record<string, string> = {};

      if (!item.product_id) {
        itemErrors.product_id = 'Product is required';
      }
      if (!item.price_per_unit || parseFloat(item.price_per_unit) <= 0) {
        itemErrors.price_per_unit = 'Valid price is required';
      }
      if (item.gst_percent === undefined || parseFloat(item.gst_percent) < 0 || parseFloat(item.gst_percent) > 28) {
        itemErrors.gst_percent = 'GST must be between 0 and 28';
      }

      if (Object.keys(itemErrors).length > 0) {
        newErrors[`items.${index}`] = itemErrors;
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!validate()) {
      toast.error('Please fix the errors before saving');
      return;
    }

    setIsSaving(true);

    try {
      // Filter out empty notes
      const filteredNotes = formData.notes.filter(n => n.note_text.trim() !== '');
      const payload = { ...formData, notes: filteredNotes };

      if (isEdit && estimate?.id) {
        await api.put(`/estimates/${estimate.id}`, payload);
        toast.success('Estimate updated successfully');
      } else {
        await api.post('/estimates', payload);
        toast.success('Estimate created successfully');
      }

      navigate('/estimates');
    } catch (error: any) {
      console.error('Failed to save estimate', error);
      toast.error(error.response?.data?.error || 'Failed to save estimate');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDownload = async () => {
    if (!estimate?.id) return;
    try {
      toast.info('Generating document...');
      const response = await api.get(`/estimates/${estimate.id}/export`, {
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${estimate.estimate_number || 'estimate'}.docx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success('Download started');
    } catch (error) {
      console.error('Export failed', error);
      toast.error('Failed to export document');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <CustomerSection
        data={{
          customer_name: formData.customer_name,
          company_name: formData.company_name,
          city: formData.city,
          state: formData.state,
          date: formData.date
        }}
        onChange={customerData => setFormData({ ...formData, ...customerData })}
        errors={errors}
      />

      <div className="border-t border-gray-200 pt-6">
        <ItemsSection
          items={formData.items}
          onChange={items => setFormData({ ...formData, items })}
          errors={errors}
        />
      </div>

      <div className="border-t border-gray-200 pt-6">
        <NotesSection
          notes={formData.notes}
          onChange={notes => setFormData({ ...formData, notes })}
        />
      </div>

      <div className="sticky bottom-0 bg-white border-t border-gray-200 pt-6 pb-4 -mx-6 px-6 flex flex-wrap gap-3">
        <Button variant="primary" disabled={isSaving}>
          <Save size={18} className="mr-2" />
          {isSaving ? 'Saving...' : isEdit ? 'Update Estimate' : 'Save Estimate'}
        </Button>

        {isEdit && estimate?.id && (
          <>
            <Button type="button" variant="outline" onClick={() => navigate(`/estimates/${estimate.id}/preview`)}>
              <Eye size={18} className="mr-2" />
              Preview
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={handleDownload}
            >
              <Download size={18} className="mr-2" />
              Download
            </Button>
          </>
        )}

        <Button type="button" variant="ghost" onClick={() => navigate('/estimates')}>
          Cancel
        </Button>
      </div>
    </form>
  );
};
