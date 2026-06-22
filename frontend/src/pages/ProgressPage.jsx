import { useEffect, useState } from 'react';
import Card from '../components/ui/Card';
import LoadingSkeleton from '../components/ui/LoadingSkeleton';
import api from '../api/mockApi';
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

export default function ProgressPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const chartData = await api.getProgressCharts();
        setData(chartData);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <LoadingSkeleton count={4} type="card" />
      </div>
    );
  }

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-cloud-900">Learning Progress</h1>
        <p className="text-cloud-600 mt-1">Track your learning journey and skill development</p>
      </div>

      {/* Progress Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <p className="text-sm text-cloud-600">Challenges Completed</p>
          <p className="text-3xl font-bold text-primary-600 mt-2">8</p>
          <p className="text-xs text-cloud-500 mt-2">+2 this month</p>
        </Card>
        <Card>
          <p className="text-sm text-cloud-600">Success Rate</p>
          <p className="text-3xl font-bold text-success mt-2">92%</p>
          <p className="text-xs text-cloud-500 mt-2">↑ 7% improvement</p>
        </Card>
        <Card>
          <p className="text-sm text-cloud-600">Learning Streak</p>
          <p className="text-3xl font-bold text-warning mt-2">12 days</p>
          <p className="text-xs text-cloud-500 mt-2">Keep it up!</p>
        </Card>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Learning Progress Trend */}
        <Card>
          <h2 className="text-lg font-bold text-cloud-900 mb-4">Learning Progress Trend</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data?.progressTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="completed" fill="#3b82f6" name="Completed" />
              <Bar dataKey="inProgress" fill="#f59e0b" name="In Progress" />
              <Bar dataKey="failed" fill="#ef4444" name="Failed" />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        {/* Success Rate Trend */}
        <Card>
          <h2 className="text-lg font-bold text-cloud-900 mb-4">Success Rate Trend</h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={data?.successRateTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="month" />
              <YAxis domain={[0, 100]} />
              <Tooltip formatter={(value) => `${value}%`} />
              <Line
                type="monotone"
                dataKey="rate"
                stroke="#10b981"
                strokeWidth={2}
                dot={{ fill: '#10b981', r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </Card>

        {/* Challenges by Domain */}
        <Card>
          <h2 className="text-lg font-bold text-cloud-900 mb-4">Challenges Completed by Domain</h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={data?.trackDistribution}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ track, value }) => `${track}: ${value}`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {data?.trackDistribution.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </Card>

        {/* Skill Growth */}
        <Card>
          <h2 className="text-lg font-bold text-cloud-900 mb-4">Skill Growth Over Time</h2>
          <div className="space-y-4">
            {data?.skillGrowth.map((skill) => (
              <div key={skill.skill}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-cloud-700">{skill.skill}</span>
                  <span className="text-sm font-bold text-primary-600">{skill.current}%</span>
                </div>
                <div className="w-full bg-cloud-200 rounded-full h-2">
                  <div
                    className="bg-primary-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${skill.current}%` }}
                  ></div>
                </div>
                <p className="text-xs text-cloud-500 mt-1">
                  Previous: {skill.previous}% (↑ {skill.current - skill.previous}%)
                </p>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Detailed Stats Table */}
      <Card>
        <h2 className="text-lg font-bold text-cloud-900 mb-4">Detailed Statistics</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-cloud-200">
                <th className="text-left py-3 px-4 font-bold text-cloud-900">Track</th>
                <th className="text-center py-3 px-4 font-bold text-cloud-900">Completed</th>
                <th className="text-center py-3 px-4 font-bold text-cloud-900">Avg Score</th>
                <th className="text-center py-3 px-4 font-bold text-cloud-900">Difficulty</th>
              </tr>
            </thead>
            <tbody>
              {[
                { track: 'Compute', completed: 2, avgScore: 88, difficulty: 'Intermediate' },
                { track: 'Storage', completed: 1, avgScore: 87, difficulty: 'Beginner' },
                { track: 'Networking', completed: 3, avgScore: 92, difficulty: 'Advanced' },
                { track: 'Security', completed: 1, avgScore: 91, difficulty: 'Intermediate' },
                { track: 'DevOps', completed: 1, avgScore: 85, difficulty: 'Intermediate' },
              ].map((row) => (
                <tr key={row.track} className="border-b border-cloud-100">
                  <td className="py-3 px-4 text-cloud-900">{row.track}</td>
                  <td className="text-center py-3 px-4 text-cloud-700">{row.completed}</td>
                  <td className="text-center py-3 px-4 font-bold text-primary-600">{row.avgScore}%</td>
                  <td className="text-center py-3 px-4 text-cloud-700">{row.difficulty}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
