import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Layout } from '../components/layout/Layout';
import { EstimateForm } from '../components/estimates/EstimateForm';
import api from '../utils/api';
import { toast } from 'sonner';

export const EstimateFormPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [estimate, setEstimate] = useState<any>(null);
  const [loading, setLoading] = useState(!!id);
  const isEdit = !!id;

  useEffect(() => {
    if (id) {
      loadEstimate();
    }
  }, [id]);

  const loadEstimate = async () => {
    try {
      const response = await api.get(`/estimates/${id}`);
      setEstimate(response.data.data);
    } catch (error) {
      console.error('Failed to load estimate', error);
      toast.error('Estimate not found');
      navigate('/estimates');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex justify-center items-center h-64">
          <div className="text-gray-500">Loading estimate data...</div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-gray-900">
          {isEdit ? 'Edit Estimate' : 'Create New Estimate'}
        </h1>
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <EstimateForm estimate={estimate} isEdit={isEdit} />
        </div>
      </div>
    </Layout>
  );
};
