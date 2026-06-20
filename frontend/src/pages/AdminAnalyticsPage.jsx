import { useEffect, useState } from 'react';
import Card from '../components/ui/Card';
import LoadingSkeleton from '../components/ui/LoadingSkeleton';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

export default function AdminAnalyticsPage() {
  const [analyticsData, setAnalyticsData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      await new Promise((r) => setTimeout(r, 500));
      setAnalyticsData({
        learnerGrowth: [
          { month: 'Jan', learners: 45, active: 40 },
          { month: 'Feb', learners: 62, active: 55 },
          { month: 'Mar', learners: 85, active: 72 },
          { month: 'Apr', learners: 110, active: 95 },
          { month: 'May', learners: 138, active: 120 },
          { month: 'Jun', learners: 165, active: 145 },
        ],
        challengeCompletion: [
          { name: 'Compute', completed: 145, inProgress: 30, failed: 15 },
          { name: 'Storage', completed: 128, inProgress: 25, failed: 12 },
          { name: 'Networking', completed: 95, inProgress: 40, failed: 20 },
          { name: 'Security', completed: 78, inProgress: 35, failed: 25 },
          { name: 'DevOps', completed: 56, inProgress: 28, failed: 18 },
        ],
        trackDistribution: [
          { name: 'Compute', value: 28 },
          { name: 'Storage', value: 20 },
          { name: 'Networking', value: 18 },
          { name: 'Security', value: 15 },
          { name: 'DevOps', value: 12 },
          { name: 'Architecture', value: 7 },
        ],
      });
      setLoading(false);
    };

    loadData();
  }, []);

  if (loading) {
    return <LoadingSkeleton count={4} type="card" />;
  }

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold text-cloud-900">Analytics & Reports</h1>
        <p className="text-lg text-cloud-600 mt-2">View detailed analytics and platform insights</p>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Learner Growth */}
        <Card>
          <h2 className="text-2xl font-bold text-cloud-900 mb-4">Learner Growth Trend</h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={analyticsData?.learnerGrowth}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="learners" stroke="#3b82f6" strokeWidth={2} name="Total Learners" />
              <Line type="monotone" dataKey="active" stroke="#10b981" strokeWidth={2} name="Active Users" />
            </LineChart>
          </ResponsiveContainer>
        </Card>

        {/* Challenge Completion */}
        <Card>
          <h2 className="text-2xl font-bold text-cloud-900 mb-4">Challenge Completion Status</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={analyticsData?.challengeCompletion}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="completed" fill="#10b981" name="Completed" />
              <Bar dataKey="inProgress" fill="#f59e0b" name="In Progress" />
              <Bar dataKey="failed" fill="#ef4444" name="Failed" />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        {/* Track Distribution */}
        <Card>
          <h2 className="text-2xl font-bold text-cloud-900 mb-4">Challenges by Track</h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={analyticsData?.trackDistribution}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, value }) => `${name}: ${value}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {analyticsData?.trackDistribution.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </Card>

        {/* Statistics Summary */}
        <Card>
          <h2 className="text-2xl font-bold text-cloud-900 mb-4">Key Metrics</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-primary-50 rounded-lg">
              <span className="text-base font-medium text-cloud-700">Avg Completion Time</span>
              <span className="text-2xl font-bold text-primary-600">65 min</span>
            </div>
            <div className="flex items-center justify-between p-4 bg-success/5 rounded-lg">
              <span className="text-base font-medium text-cloud-700">Overall Pass Rate</span>
              <span className="text-2xl font-bold text-success">83%</span>
            </div>
            <div className="flex items-center justify-between p-4 bg-warning/5 rounded-lg">
              <span className="text-base font-medium text-cloud-700">Avg Challenge per Learner</span>
              <span className="text-2xl font-bold text-warning">7.2</span>
            </div>
            <div className="flex items-center justify-between p-4 bg-info/5 rounded-lg">
              <span className="text-base font-medium text-cloud-700">Total Hours Logged</span>
              <span className="text-2xl font-bold text-info">1,240 hrs</span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
