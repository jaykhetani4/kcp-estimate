import { useState, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Input } from '../common/Input';
import { Select } from '../common/Select';
import { Button } from '../common/Button';
import { ColorTagInput } from './ColorTagInput';
import { storage } from '../../utils/storage';
import { toast } from 'sonner';

interface Product {
  id?: string;
  name: string;
  product_type: 'paver_block' | 'curb_stone';
  thickness_dimension: string;
  available_colors: string[];
}

interface ProductFormProps {
  product?: Product;
  isEdit?: boolean;
}

export const ProductForm = ({ product, isEdit = false }: ProductFormProps) => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState<Product>(
    product || {
      name: '',
      product_type: 'paver_block',
      thickness_dimension: '',
      available_colors: []
    }
  );
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Product name is required';
    }

    if (!formData.product_type) {
      newErrors.product_type = 'Please select a product type';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    const products = storage.getProducts();

    if (isEdit && product?.id) {
      const updatedProducts = products.map(p =>
        p.id === product.id
          ? { ...formData, id: product.id, updated_at: new Date().toISOString() }
          : p
      );
      storage.setProducts(updatedProducts);
      toast.success('Product updated successfully');
    } else {
      const newProduct = {
        ...formData,
        id: `p${Date.now()}`,
        is_active: true,
        created_at: new Date().toISOString()
      };
      storage.setProducts([...products, newProduct]);
      toast.success('Product created successfully');
    }

    navigate('/products');
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
      <Input
        label="Product Name"
        required
        value={formData.name}
        onChange={e => setFormData({ ...formData, name: e.target.value })}
        error={errors.name}
        placeholder="e.g. Standard Grey Paver"
      />

      <Select
        label="Product Type"
        required
        value={formData.product_type}
        onChange={e => setFormData({ ...formData, product_type: e.target.value as any })}
        error={errors.product_type}
        options={[
          { value: 'paver_block', label: 'Paver Block' },
          { value: 'curb_stone', label: 'Curb Stone' }
        ]}
      />

      <Input
        label="Thickness / Dimension"
        value={formData.thickness_dimension}
        onChange={e => setFormData({ ...formData, thickness_dimension: e.target.value })}
        placeholder="e.g. 60mm or 100x200x60mm"
      />

      <ColorTagInput
        colors={formData.available_colors}
        onChange={colors => setFormData({ ...formData, available_colors: colors })}
      />

      <div className="flex gap-3 pt-4">
        <Button type="submit" variant="primary">
          {isEdit ? 'Update Product' : 'Create Product'}
        </Button>
        <Button type="button" variant="outline" onClick={() => navigate('/products')}>
          Cancel
        </Button>
      </div>
    </form>
  );
};
