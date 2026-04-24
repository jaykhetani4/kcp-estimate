import { Trash2 } from 'lucide-react';
import { Input } from '../common/Input';
import { Select } from '../common/Select';
import { Button } from '../common/Button';

export interface EstimateItem {
  id: string;
  product_id: string;
  product_snapshot?: any;
  price_per_unit: string;
  price_unit: 'per_sqft' | 'per_piece';
  gst_percent: string;
  transportation_cost: string;
  loading_unloading_cost: string;
}

interface ItemRowProps {
  item: EstimateItem;
  products: any[];
  onChange: (item: EstimateItem) => void;
  onRemove: () => void;
  error?: Record<string, string>;
}

export const ItemRow = ({ item, products, onChange, onRemove, error = {} }: ItemRowProps) => {
  const updateField = (field: keyof EstimateItem, value: string) => {
    const updatedItem = { ...item, [field]: value };

    // If product changed, save snapshot
    if (field === 'product_id' && value) {
      const product = products.find(p => p.id === value);
      if (product) {
        updatedItem.product_snapshot = {
          name: product.name,
          product_type: product.product_type,
          thickness_dimension: product.thickness_dimension,
          available_colors: product.available_colors
        };
      }
    }

    onChange(updatedItem);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-12 gap-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
      <div className="md:col-span-3">
        <Select
          label="Product"
          required
          value={item.product_id}
          onChange={e => updateField('product_id', e.target.value)}
          error={error.product_id}
          options={[
            { value: '', label: 'Select a product' },
            ...(products || []).map(p => ({
              value: p.id,
              label: `${p.name} (${p.product_type === 'paver_block' ? 'Paver' : 'Curb'})`
            }))
          ]}
        />
      </div>

      <div className="md:col-span-2">
        <Input
          label="Price (₹)"
          required
          type="number"
          step="0.01"
          min="0.01"
          value={item.price_per_unit}
          onChange={e => updateField('price_per_unit', e.target.value)}
          error={error.price_per_unit}
          placeholder="0.00"
        />
      </div>

      <div className="md:col-span-2">
        <Select
          label="Price Unit"
          required
          value={item.price_unit}
          onChange={e => updateField('price_unit', e.target.value as any)}
          options={[
            { value: 'per_sqft', label: 'Per Sq.Ft' },
            { value: 'per_piece', label: 'Per Piece' }
          ]}
        />
      </div>

      <div className="md:col-span-1">
        <Input
          label="GST %"
          required
          type="number"
          step="0.01"
          min="0"
          max="28"
          value={item.gst_percent}
          onChange={e => updateField('gst_percent', e.target.value)}
          error={error.gst_percent}
          placeholder="18"
        />
      </div>

      <div className="md:col-span-2">
        <Input
          label="Transport (₹)"
          type="number"
          step="0.01"
          min="0"
          value={item.transportation_cost}
          onChange={e => updateField('transportation_cost', e.target.value)}
          placeholder="0.00"
        />
      </div>

      <div className="md:col-span-2">
        <Input
          label="Loading (₹)"
          type="number"
          step="0.01"
          min="0"
          value={item.loading_unloading_cost}
          onChange={e => updateField('loading_unloading_cost', e.target.value)}
          placeholder="0.00"
        />
      </div>

      <div className="flex items-end md:col-span-12">
        <Button
          type="button"
          variant="danger"
          size="sm"
          onClick={onRemove}
          className="w-full md:w-auto"
        >
          <Trash2 size={16} className="mr-2" />
          Remove
        </Button>
      </div>
    </div>
  );
};
