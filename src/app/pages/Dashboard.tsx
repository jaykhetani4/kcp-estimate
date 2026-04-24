import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, FileText, Package, TrendingUp } from 'lucide-react';
import { Layout } from '../components/layout/Layout';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';
import api from '../utils/api';
import { formatDate, getCurrentFinancialYear } from '../utils/formatters';
import { toast } from 'sonner';

export const Dashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalEstimatesThisMonth: 0,
    totalEstimatesThisFY: 0,
    totalProducts: 0
  });
  const [recentEstimates, setRecentEstimates] = useState<any[]>([]);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const [estimatesRes, productsRes] = await Promise.all([
        api.get('/estimates'),
        api.get('/products')
      ]);

      const estimates = estimatesRes.data.data;
      const products = productsRes.data.data;

      const now = new Date();
      const currentMonth = now.getMonth();
      const currentYear = now.getFullYear();

      // FY start date (April 1)
      const fyStartYear = now.getMonth() >= 3 ? currentYear : currentYear - 1;
      const fyStartDate = new Date(fyStartYear, 3, 1); // April 1

      const totalEstimatesThisMonth = estimates.filter((e: any) => {
        const date = new Date(e.date);
        return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
      }).length;

      const totalEstimatesThisFY = estimates.filter((e: any) => {
        const date = new Date(e.date);
        return date >= fyStartDate;
      }).length;

      setStats({
        totalEstimatesThisMonth,
        totalEstimatesThisFY,
        totalProducts: products.length
      });

      setRecentEstimates(estimates.slice(0, 5));
    } catch (error) {
      console.error('Failed to load dashboard data', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-gray-600 mt-1">{getCurrentFinancialYear()}</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
            <Button variant="outline" onClick={() => navigate('/products/new')} size="sm" className="sm:text-base">
              <Plus size={18} className="mr-2" />
              Add Product
            </Button>
            <Button onClick={() => navigate('/estimates/new')} size="sm" className="sm:text-base">
              <Plus size={18} className="mr-2" />
              New Estimate
            </Button>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="text-gray-500">Loading dashboard...</div>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-gradient-to-br from-red-600 to-red-700 rounded-xl p-6 text-white shadow-lg">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium opacity-90">This Month</h3>
                  <TrendingUp size={24} className="opacity-75" />
                </div>
                <p className="text-4xl font-bold">{stats.totalEstimatesThisMonth}</p>
                <p className="text-sm opacity-75 mt-2">Estimates Generated</p>
              </div>

              <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-6 text-white shadow-lg">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium opacity-90">Financial Year</h3>
                  <FileText size={24} className="opacity-75" />
                </div>
                <p className="text-4xl font-bold">{stats.totalEstimatesThisFY}</p>
                <p className="text-sm opacity-75 mt-2">Total Estimates</p>
              </div>

              <div className="bg-gradient-to-br from-red-800 to-red-950 rounded-xl p-6 text-white shadow-lg">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium opacity-90">Product Catalog</h3>
                  <Package size={24} className="opacity-75" />
                </div>
                <p className="text-4xl font-bold">{stats.totalProducts}</p>
                <p className="text-sm opacity-75 mt-2">Different Products</p>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="p-4 sm:p-6 border-b border-gray-200 flex items-center justify-between">
                <h2 className="text-lg font-bold text-gray-900">Recent Estimates</h2>
                <Button variant="ghost" size="sm" onClick={() => navigate('/estimates')}>View All</Button>
              </div>
              {recentEstimates.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                          Estimate #
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                          Customer
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                          Date
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">
                          Action
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {recentEstimates.map(estimate => (
                        <tr
                          key={estimate.id}
                          className="hover:bg-gray-50 transition-colors"
                        >
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="text-sm font-bold text-red-600">
                              {estimate.estimate_number}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm font-medium text-gray-900">
                              {estimate.customer_name}
                            </div>
                            <div className="text-xs text-gray-500">{estimate.city}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {formatDate(estimate.date)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right">
                            <Button 
                              variant="outline" 
                              size="sm" 
                              onClick={() => navigate(`/estimates/${estimate.id}/preview`)}
                            >
                              Preview
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="p-12 text-center text-gray-500">
                  <p className="mb-4">No estimates yet. Create your first quotation to get started!</p>
                  <Button onClick={() => navigate('/estimates/new')}>Create Estimate</Button>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </Layout>
  );
};
