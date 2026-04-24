import { Input } from '../common/Input';
import { Select } from '../common/Select';
import { INDIAN_STATES } from '../../utils/indianStates';

interface CustomerData {
  customer_name: string;
  company_name: string;
  city: string;
  state: string;
  date: string;
}

interface CustomerSectionProps {
  data: CustomerData;
  onChange: (data: CustomerData) => void;
  errors: Record<string, string>;
}

export const CustomerSection = ({ data, onChange, errors }: CustomerSectionProps) => {
  const updateField = (field: keyof CustomerData, value: string) => {
    onChange({ ...data, [field]: value });
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Customer Details</h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input
          label="Customer Name"
          required
          value={data.customer_name}
          onChange={e => updateField('customer_name', e.target.value)}
          error={errors.customer_name}
          placeholder="Enter customer name"
        />

        <Input
          label="Company Name"
          value={data.company_name}
          onChange={e => updateField('company_name', e.target.value)}
          placeholder="Optional"
        />

        <Input
          label="City"
          required
          value={data.city}
          onChange={e => updateField('city', e.target.value)}
          error={errors.city}
          placeholder="Enter city"
        />

        <Select
          label="State"
          required
          value={data.state}
          onChange={e => updateField('state', e.target.value)}
          error={errors.state}
          options={[
            { value: '', label: 'Select a state' },
            ...INDIAN_STATES.map(state => ({ value: state, label: state }))
          ]}
        />

        <Input
          label="Date"
          required
          type="date"
          value={data.date}
          onChange={e => updateField('date', e.target.value)}
          error={errors.date}
        />
      </div>
    </div>
  );
};
