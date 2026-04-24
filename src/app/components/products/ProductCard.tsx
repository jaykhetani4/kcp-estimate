import { useNavigate } from 'react-router-dom';
import { Edit, Trash2, Package } from 'lucide-react';
import { Badge } from '../common/Badge';
import { Button } from '../common/Button';

interface Product {
  id: string;
  name: string;
  product_type: 'paver_block' | 'curb_stone';
  thickness_dimension?: string;
  available_colors: string[];
}

interface ProductCardProps {
  product: Product;
  onDelete: (id: string) => void;
}

export const ProductCard = ({ product, onDelete }: ProductCardProps) => {
  const navigate = useNavigate();

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-start space-x-3">
          <div className="p-2 bg-blue-100 rounded-lg">
            <Package className="text-blue-600" size={24} />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">{product.name}</h3>
            <Badge variant={product.product_type === 'paver_block' ? 'primary' : 'secondary'} size="sm">
              {product.product_type === 'paver_block' ? 'Paver Block' : 'Curb Stone'}
            </Badge>
          </div>
        </div>
      </div>

      {product.thickness_dimension && (
        <div className="mb-3">
          <span className="text-sm text-gray-600">Dimension: </span>
          <span className="text-sm font-medium text-gray-900">{product.thickness_dimension}</span>
        </div>
      )}

      {product.available_colors.length > 0 && (
        <div className="mb-4">
          <span className="text-sm text-gray-600 block mb-2">Colors:</span>
          <div className="flex flex-wrap gap-1">
            {product.available_colors.map(color => (
              <span
                key={color}
                className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded"
              >
                {color}
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="flex gap-2 pt-3 border-t border-gray-200">
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate(`/products/${product.id}/edit`)}
          className="flex-1"
        >
          <Edit size={16} className="mr-1" />
          Edit
        </Button>
        <Button
          variant="danger"
          size="sm"
          onClick={() => onDelete(product.id)}
          className="flex-1"
        >
          <Trash2 size={16} className="mr-1" />
          Delete
        </Button>
      </div>
    </div>
  );
};
