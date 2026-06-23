import { useEffect, useState } from 'react';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import LoadingSkeleton from '../components/ui/LoadingSkeleton';
import api from '../api/mockApi';
import { Users, Zap, Activity, Server } from 'lucide-react';

export default function AdminDashboardPage() {
  const [adminData, setAdminData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const data = await api.getAdminData();
        setAdminData(data);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  if (loading) {
    return <LoadingSkeleton count={4} type="card" />;
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold text-cloud-900">Admin Dashboard</h1>
        <p className="text-lg text-cloud-600 mt-2">Monitor system health and user activity</p>
      </div>

      {/* System Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="hover:shadow-lg transition">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-base text-cloud-600 font-medium">Active Learners</p>
              <p className="text-3xl font-bold text-cloud-900 mt-2">{adminData?.activeLearners}</p>
            </div>
            <Users className="w-12 h-12 text-primary-100" />
          </div>
        </Card>

        <Card className="hover:shadow-lg transition">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-base text-cloud-600 font-medium">Active Challenges</p>
              <p className="text-3xl font-bold text-cloud-900 mt-2">{adminData?.activeChallenges}</p>
            </div>
            <Zap className="w-12 h-12 text-warning/20" />
          </div>
        </Card>

        <Card className="hover:shadow-lg transition">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-base text-cloud-600 font-medium">Avg Completion Time</p>
              <p className="text-3xl font-bold text-cloud-900 mt-2">{adminData?.avgCompletionTime}</p>
            </div>
            <Activity className="w-12 h-12 text-success/20" />
          </div>
        </Card>

        <Card className="hover:shadow-lg transition">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-base text-cloud-600 font-medium">System Health</p>
              <div className="flex items-center gap-2 mt-2">
                <div className="w-3 h-3 bg-success rounded-full"></div>
                <p className="text-xl font-bold text-success">{adminData?.systemHealth}</p>
              </div>
            </div>
            <Server className="w-12 h-12 text-success/20" />
          </div>
        </Card>
      </div>

      {/* Monitoring Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Scenario Generation Logs */}
        <Card>
          <h2 className="text-2xl font-bold text-cloud-900 mb-4">Scenario Generation Logs</h2>
          <div className="space-y-3">
            {adminData?.scenarioGenerationLogs?.map((log) => (
              <div key={log.id} className="p-4 border border-cloud-200 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-base text-cloud-900">{log.scenario}</p>
                    <p className="text-sm text-cloud-600 mt-1">{log.timestamp}</p>
                  </div>
                  <Badge variant={log.status === 'success' ? 'success' : 'error'}>
                    {log.status}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Evaluation Logs */}
        <Card>
          <h2 className="text-2xl font-bold text-cloud-900 mb-4">Recent Evaluations</h2>
          <div className="space-y-3">
            {adminData?.evaluationLogs?.map((log) => (
              <div key={log.id} className="p-4 border border-cloud-200 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-base text-cloud-900">{log.challenge}</p>
                    <p className="text-sm text-cloud-600 mt-1">{log.timestamp}</p>
                  </div>
                  <Badge variant={log.result === 'Pass' ? 'success' : 'error'}>
                    {log.result}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* LangSmith Integration Status */}
      <Card className="bg-blue-50 border border-blue-200">
        <h2 className="text-2xl font-bold text-blue-900 mb-6">LangSmith Tracing Status</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div>
            <p className="text-base font-semibold text-blue-700">Scenario Generation</p>
            <div className="flex items-center gap-2 mt-3">
              <div className="w-3 h-3 bg-success rounded-full"></div>
              <p className="font-semibold text-base text-blue-900">Active</p>
            </div>
          </div>
          <div>
            <p className="text-base font-semibold text-blue-700">Evaluation Engine</p>
            <div className="flex items-center gap-2 mt-3">
              <div className="w-3 h-3 bg-success rounded-full"></div>
              <p className="font-semibold text-base text-blue-900">Active</p>
            </div>
          </div>
          <div>
            <p className="text-base font-semibold text-blue-700">Feedback Generation</p>
            <div className="flex items-center gap-2 mt-3">
              <div className="w-3 h-3 bg-success rounded-full"></div>
              <p className="font-semibold text-base text-blue-900">Active</p>
            </div>
          </div>
          <div>
            <p className="text-base font-semibold text-blue-700">Recommendations</p>
            <div className="flex items-center gap-2 mt-3">
              <div className="w-3 h-3 bg-success rounded-full"></div>
              <p className="font-semibold text-base text-blue-900">Active</p>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
