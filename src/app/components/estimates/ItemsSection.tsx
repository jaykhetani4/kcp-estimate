import { useState, useEffect } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '../common/Button';
import { ItemRow, EstimateItem } from './ItemRow';
import api from '../../utils/api';

interface ItemsSectionProps {
  items: EstimateItem[];
  onChange: (items: EstimateItem[]) => void;
  errors: Record<string, any>;
}

export const ItemsSection = ({ items, onChange, errors }: ItemsSectionProps) => {
  const [products, setProducts] = useState<any[]>([]);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await api.get('/products');
        setProducts(response.data.data);
      } catch (error) {
        console.error('Failed to fetch products', error);
      }
    };
    fetchProducts();
  }, []);

  const addItem = () => {
    const newItem: EstimateItem = {
      id: `item_${Date.now()}`,
      product_id: '',
      price_per_unit: '',
      price_unit: 'per_sqft',
      gst_percent: '18',
      transportation_cost: '0',
      loading_unloading_cost: '0'
    };
    onChange([...items, newItem]);
  };

  const updateItem = (index: number, updatedItem: EstimateItem) => {
    const newItems = [...items];
    newItems[index] = updatedItem;
    onChange(newItems);
  };

  const removeItem = (index: number) => {
    onChange(items.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Items</h3>
        <Button type="button" variant="outline" size="sm" onClick={addItem}>
          <Plus size={16} className="mr-2" />
          Add Item
        </Button>
      </div>

      {items.length === 0 && (
        <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg">
          <p className="text-gray-500 mb-3">No items added yet</p>
          <Button type="button" variant="primary" size="sm" onClick={addItem}>
            <Plus size={16} className="mr-2" />
            Add First Item
          </Button>
        </div>
      )}

      <div className="space-y-4">
        {items.map((item, index) => (
          <ItemRow
            key={item.id}
            item={item}
            products={products}
            onChange={updatedItem => updateItem(index, updatedItem)}
            onRemove={() => removeItem(index)}
            error={errors[`items.${index}`] || {}}
          />
        ))}
      </div>

      {items.length > 0 && items.length < 20 && (
        <Button type="button" variant="outline" onClick={addItem} className="w-full">
          <Plus size={16} className="mr-2" />
          Add Another Item
        </Button>
      )}

      {items.length >= 20 && (
        <p className="text-sm text-orange-600">Maximum 20 items per estimate reached</p>
      )}
    </div>
  );
};
