import { useState, KeyboardEvent } from 'react';
import { X } from 'lucide-react';
import { Input } from '../common/Input';
import { Button } from '../common/Button';

interface ColorTagInputProps {
  colors: string[];
  onChange: (colors: string[]) => void;
}

export const ColorTagInput = ({ colors, onChange }: ColorTagInputProps) => {
  const [inputValue, setInputValue] = useState('');

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addColor();
    }
  };

  const addColor = () => {
    const trimmedValue = inputValue.trim();
    if (trimmedValue && !colors.includes(trimmedValue)) {
      onChange([...colors, trimmedValue]);
      setInputValue('');
    }
  };

  const removeColor = (colorToRemove: string) => {
    onChange(colors.filter(c => c !== colorToRemove));
  };

  return (
    <div className="w-full">
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Available Colors
      </label>
      <div className="flex flex-wrap gap-2 mb-2">
        {colors.map(color => (
          <span
            key={color}
            className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800"
          >
            {color}
            <button
              type="button"
              onClick={() => removeColor(color)}
              className="ml-2 text-blue-600 hover:text-blue-800"
            >
              <X size={14} />
            </button>
          </span>
        ))}
      </div>
      <div className="flex gap-2">
        <Input
          value={inputValue}
          onChange={e => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type a color and press Enter"
        />
        <Button type="button" variant="outline" onClick={addColor}>
          Add
        </Button>
      </div>
    </div>
  );
};
