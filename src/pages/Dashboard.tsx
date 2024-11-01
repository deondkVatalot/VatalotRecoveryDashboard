import React, { useState, useEffect } from 'react';
import { 
  Chart as ChartJS, 
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';
import { Line, Bar } from 'react-chartjs-2';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../store/authStore';
import { supabase } from '../utils/supabase';
import { ArrowUpRight, ArrowDownRight, Users, FileText, CheckCircle, AlertCircle } from 'lucide-react';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      display: false,
    },
  },
  scales: {
    x: {
      grid: {
        display: false,
      },
    },
    y: {
      grid: {
        color: 'rgba(0, 0, 0, 0.05)',
      },
      beginAtZero: true,
    },
  },
};

export default function Dashboard() {
  const { t } = useTranslation();
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState('monthly');
  const [stats, setStats] = useState({
    totalRecords: 0,
    verifiedRecords: 0,
    pendingRecords: 0,
    errorRecords: 0,
    dailyImports: [],
    weeklyImports: [],
    monthlyImports: [],
    yearlyImports: [],
    userDistribution: { users: 0, admins: 0 },
    recentActivity: []
  });

  useEffect(() => {
    const loadDashboardData = async () => {
      if (!user?.id) return;

      try {
        // Get current data stats
        const { data: currentData, error: dataError } = await supabase
          .from('data')
          .select('verified');

        if (dataError) throw dataError;

        const totalRecords = currentData?.length || 0;
        const verifiedRecords = currentData?.filter(r => r.verified === '1').length || 0;
        const pendingRecords = currentData?.filter(r => r.verified === '0').length || 0;
        const errorRecords = currentData?.filter(r => r.verified === '2').length || 0;

        // Get imports for different periods
        const now = new Date();
        const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        const oneYearAgo = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);

        const { data: imports } = await supabase
          .from('data_imports')
          .select('imported_at, record_count')
          .gte('imported_at', oneYearAgo.toISOString())
          .order('imported_at', { ascending: true });

        // Process data for different periods
        const dailyData = new Array(24).fill(0);
        const weeklyData = new Array(7).fill(0);
        const monthlyData = new Array(12).fill(0);
        const yearlyData = new Array(12).fill(0);

        imports?.forEach(imp => {
          const importDate = new Date(imp.imported_at);
          
          // Daily data (last 24 hours)
          if (importDate >= oneDayAgo) {
            const hourIndex = 23 - Math.floor((now - importDate) / (60 * 60 * 1000));
            if (hourIndex >= 0) dailyData[hourIndex] += imp.record_count;
          }

          // Weekly data (last 7 days)
          if (importDate >= oneWeekAgo) {
            const dayIndex = 6 - Math.floor((now - importDate) / (24 * 60 * 60 * 1000));
            if (dayIndex >= 0) weeklyData[dayIndex] += imp.record_count;
          }

          // Monthly data (last 12 months)
          if (importDate >= oneMonthAgo) {
            const monthIndex = importDate.getMonth();
            monthlyData[monthIndex] += imp.record_count;
          }

          // Yearly data
          if (importDate >= oneYearAgo) {
            const monthIndex = importDate.getMonth();
            yearlyData[monthIndex] += imp.record_count;
          }
        });

        // Get recent activity
        const { data: recentActivity } = await supabase
          .from('data_imports')
          .select('*, users:created_by(first_name, last_name)')
          .order('imported_at', { ascending: false })
          .limit(5);

        setStats({
          totalRecords,
          verifiedRecords,
          pendingRecords,
          errorRecords,
          dailyImports: dailyData,
          weeklyImports: weeklyData,
          monthlyImports: monthlyData,
          yearlyImports: yearlyData,
          userDistribution: { users: 0, admins: 0 },
          recentActivity: recentActivity || []
        });
      } catch (error) {
        console.error('Error loading dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, [user?.id]);

  const getLabels = () => {
    switch (selectedPeriod) {
      case 'daily':
        return Array.from({ length: 24 }, (_, i) => `${i}:00`);
      case 'weekly':
        return ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      case 'yearly':
      case 'monthly':
      default:
        return ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    }
  };

  const getData = () => {
    switch (selectedPeriod) {
      case 'daily':
        return stats.dailyImports;
      case 'weekly':
        return stats.weeklyImports;
      case 'yearly':
        return stats.yearlyImports;
      case 'monthly':
      default:
        return stats.monthlyImports;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">{t('common.loading')}</div>
      </div>
    );
  }

  const labels = getLabels();
  const data = getData();

  const lineData = {
    labels,
    datasets: [
      {
        label: t('dashboard.importTrends'),
        data: data,
        borderColor: '#214866',
        backgroundColor: 'rgba(33, 72, 102, 0.1)',
        tension: 0.4,
        fill: true,
      },
    ],
  };

  const barData = {
    labels,
    datasets: [
      {
        label: t('dashboard.records'),
        data: data,
        backgroundColor: '#214866',
        borderRadius: 4,
      },
    ],
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          {t('dashboard.title')}
        </h1>
        <div className="flex gap-2">
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="px-3 py-2 border rounded-lg bg-white dark:bg-gray-800 dark:border-gray-700"
          >
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
            <option value="yearly">Yearly</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Total Records</p>
              <h3 className="text-2xl font-bold mt-1">{stats.totalRecords.toLocaleString()}</h3>
            </div>
            <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <FileText className="w-6 h-6 text-blue-500 dark:text-blue-400" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm">
            <ArrowUpRight className="w-4 h-4 text-green-500 mr-1" />
            <span className="text-green-500 font-medium">12%</span>
            <span className="text-gray-500 dark:text-gray-400 ml-2">vs last month</span>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Verified Records</p>
              <h3 className="text-2xl font-bold mt-1">{stats.verifiedRecords.toLocaleString()}</h3>
            </div>
            <div className="p-2 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <CheckCircle className="w-6 h-6 text-green-500 dark:text-green-400" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm">
            <ArrowUpRight className="w-4 h-4 text-green-500 mr-1" />
            <span className="text-green-500 font-medium">8%</span>
            <span className="text-gray-500 dark:text-gray-400 ml-2">vs last month</span>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Pending Records</p>
              <h3 className="text-2xl font-bold mt-1">{stats.pendingRecords.toLocaleString()}</h3>
            </div>
            <div className="p-2 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
              <Users className="w-6 h-6 text-yellow-500 dark:text-yellow-400" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm">
            <ArrowDownRight className="w-4 h-4 text-red-500 mr-1" />
            <span className="text-red-500 font-medium">5%</span>
            <span className="text-gray-500 dark:text-gray-400 ml-2">vs last month</span>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Error Records</p>
              <h3 className="text-2xl font-bold mt-1">{stats.errorRecords.toLocaleString()}</h3>
            </div>
            <div className="p-2 bg-red-50 dark:bg-red-900/20 rounded-lg">
              <AlertCircle className="w-6 h-6 text-red-500 dark:text-red-400" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm">
            <ArrowDownRight className="w-4 h-4 text-red-500 mr-1" />
            <span className="text-red-500 font-medium">2%</span>
            <span className="text-gray-500 dark:text-gray-400 ml-2">vs last month</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-semibold">Import Trends</h3>
            <select
              className="px-3 py-1 border rounded-lg text-sm bg-white dark:bg-gray-800 dark:border-gray-700"
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
            >
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
              <option value="yearly">Yearly</option>
            </select>
          </div>
          <div className="h-80">
            <Line data={lineData} options={chartOptions} />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-semibold">Records Overview</h3>
            <select
              className="px-3 py-1 border rounded-lg text-sm bg-white dark:bg-gray-800 dark:border-gray-700"
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
            >
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
              <option value="yearly">Yearly</option>
            </select>
          </div>
          <div className="h-80">
            <Bar data={barData} options={chartOptions} />
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-6">Recent Activity</h3>
        <div className="space-y-4">
          {stats.recentActivity.map((activity: any) => (
            <div key={activity.id} className="flex items-center justify-between py-3 border-b dark:border-gray-700 last:border-0">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                  <FileText className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium">{activity.filename}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Imported by {activity.users?.first_name} {activity.users?.last_name}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-medium">{activity.record_count.toLocaleString()} records</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {new Date(activity.imported_at).toLocaleDateString()}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}