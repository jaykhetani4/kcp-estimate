import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Layout } from '../components/layout/Layout';
import { Button } from '../components/common/Button';
import { Input } from '../components/common/Input';
import { Select } from '../components/common/Select';
import { TagInput } from '../components/products/TagInput';
import api from '../utils/api';
import { toast } from 'sonner';

export const ProductFormPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(!!id);
  const [formData, setFormData] = useState({
    name: '',
    product_type: 'paver_block',
    thickness_dimension: '',
    available_colors: [] as string[]
  });

  useEffect(() => {
    if (id) {
      loadProduct();
    }
  }, [id]);

  const loadProduct = async () => {
    try {
      const response = await api.get(`/products/${id}`);
      const product = response.data.data;
      setFormData({
        name: product.name,
        product_type: product.product_type,
        thickness_dimension: product.thickness_dimension || '',
        available_colors: product.available_colors || []
      });
    } catch (error) {
      console.error('Failed to load product', error);
      toast.error('Product not found');
      navigate('/products');
    } finally {
      setInitialLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) {
      toast.error('Product name is required');
      return;
    }

    setLoading(true);
    try {
      if (id) {
        await api.put(`/products/${id}`, formData);
        toast.success('Product updated successfully');
      } else {
        await api.post('/products', formData);
        toast.success('Product created successfully');
      }
      navigate('/products');
    } catch (error: any) {
      console.error('Failed to save product', error);
      toast.error(error.response?.data?.error || 'Failed to save product');
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) {
    return (
      <Layout>
        <div className="flex justify-center items-center h-64">
          <div className="text-gray-500">Loading product data...</div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-2xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">
            {id ? 'Edit Product' : 'Add New Product'}
          </h1>
          <p className="text-gray-600">
            {id ? 'Update product details in your catalog' : 'Create a new product for your catalog'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="p-6 space-y-6">
            <Input
              label="Product Name"
              placeholder="e.g., Standard Grey Paver"
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
              required
            />

            <Select
              label="Product Type"
              value={formData.product_type}
              onChange={e => setFormData({ ...formData, product_type: e.target.value })}
              options={[
                { value: 'paver_block', label: 'Paver Block' },
                { value: 'curb_stone', label: 'Curb Stone' }
              ]}
              required
            />

            <Input
              label="Thickness / Dimension"
              placeholder="e.g., 60mm or 100x200x60"
              value={formData.thickness_dimension}
              onChange={e => setFormData({ ...formData, thickness_dimension: e.target.value })}
            />

            <TagInput
              label="Available Colors"
              placeholder="Type color and press enter"
              tags={formData.available_colors}
              setTags={tags => setFormData({ ...formData, available_colors: tags })}
            />
          </div>

          <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate('/products')}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Saving...' : id ? 'Update Product' : 'Save Product'}
            </Button>
          </div>
        </form>
      </div>
    </Layout>
  );
};
