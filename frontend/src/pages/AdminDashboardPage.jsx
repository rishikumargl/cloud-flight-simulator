import { useEffect, useState } from 'react';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import LoadingSkeleton from '../components/ui/LoadingSkeleton';
import api from '../api/mockApi';
import { Users, Zap, Activity, Server, TrendingUp, Gauge } from 'lucide-react';

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
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="space-y-3">
        <h1 className="text-3xl md:text-4xl font-bold text-cloud-900">Admin Dashboard</h1>
        <p className="text-orange-600 font-semibold text-base">Monitor system health and user activity</p>
      </div>

      {/* System Stats */}
      <div className="space-y-6">
        <div>
          <h3 className="text-xl font-semibold text-cloud-900">System Overview</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Active Learners */}
          <div className="p-4 rounded-lg bg-white border border-cloud-100 hover:border-primary-300/50 hover:shadow-sm transition-all duration-300">
            <div className="flex items-start justify-between mb-3">
              <Users className="w-5 h-5 text-orange-500 flex-shrink-0" />
              <span className="text-xs font-semibold text-orange-600">+5</span>
            </div>
            <p className="text-xs font-semibold text-cloud-500 uppercase tracking-wide mb-1">Active Learners</p>
            <p className="text-2xl font-semibold text-cloud-900">{adminData?.activeLearners}</p>
          </div>

          {/* Active Challenges */}
          <div className="p-4 rounded-lg bg-white border border-cloud-100 hover:border-primary-300/50 hover:shadow-sm transition-all duration-300">
            <div className="flex items-start justify-between mb-3">
              <Zap className="w-5 h-5 text-orange-500 flex-shrink-0" />
              <span className="text-xs font-semibold text-orange-600">Live</span>
            </div>
            <p className="text-xs font-semibold text-cloud-500 uppercase tracking-wide mb-1">Active Challenges</p>
            <p className="text-2xl font-semibold text-cloud-900">{adminData?.activeChallenges}</p>
          </div>

          {/* Avg Completion Time */}
          <div className="p-4 rounded-lg bg-white border border-cloud-100 hover:border-primary-300/50 hover:shadow-sm transition-all duration-300">
            <div className="flex items-start justify-between mb-3">
              <Activity className="w-5 h-5 text-orange-500 flex-shrink-0" />
              <span className="text-xs font-semibold text-orange-600">Avg</span>
            </div>
            <p className="text-xs font-semibold text-cloud-500 uppercase tracking-wide mb-1">Completion Time</p>
            <p className="text-2xl font-semibold text-cloud-900">{adminData?.avgCompletionTime}</p>
          </div>

          {/* System Health */}
          <div className="p-4 rounded-lg bg-white border border-cloud-100 hover:border-primary-300/50 hover:shadow-sm transition-all duration-300">
            <div className="flex items-start justify-between mb-3">
              <Server className="w-5 h-5 text-orange-500 flex-shrink-0" />
              <span className="text-xs font-semibold text-orange-600">✓</span>
            </div>
            <p className="text-xs font-semibold text-cloud-500 uppercase tracking-wide mb-1">System Health</p>
            <p className="text-2xl font-semibold text-cloud-900">{adminData?.systemHealth}</p>
          </div>
        </div>
      </div>

      {/* Monitoring Tables */}
      <div className="space-y-6">
        <div>
          <h3 className="text-xl font-semibold text-cloud-900">Monitoring & Logs</h3>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Scenario Generation Logs */}
          <Card>
            <h2 className="text-base font-semibold text-cloud-900 mb-4">Scenario Generation</h2>
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
            <h2 className="text-base font-semibold text-cloud-900 mb-4">Recent Evaluations</h2>
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
      </div>

      {/* LangSmith Integration Status */}
      <div className="space-y-6">
        <div>
          <h3 className="text-xl font-semibold text-cloud-900">AI Tracing & Integration</h3>
        </div>

        <Card className="bg-cloud-50 border border-cloud-200">
          <h2 className="text-base font-semibold text-cloud-900 mb-6">Tracing Status</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div>
              <p className="text-xs font-semibold text-cloud-500 uppercase tracking-wide">Scenario Generation</p>
              <div className="flex items-center gap-2 mt-3">
                <div className="w-3 h-3 bg-success rounded-full"></div>
                <p className="font-semibold text-base text-cloud-900">Active</p>
              </div>
            </div>
            <div>
              <p className="text-xs font-semibold text-cloud-500 uppercase tracking-wide">Evaluation Engine</p>
              <div className="flex items-center gap-2 mt-3">
                <div className="w-3 h-3 bg-success rounded-full"></div>
                <p className="font-semibold text-base text-cloud-900">Active</p>
              </div>
            </div>
            <div>
              <p className="text-xs font-semibold text-cloud-500 uppercase tracking-wide">Feedback Generation</p>
              <div className="flex items-center gap-2 mt-3">
                <div className="w-3 h-3 bg-success rounded-full"></div>
                <p className="font-semibold text-base text-cloud-900">Active</p>
              </div>
            </div>
            <div>
              <p className="text-xs font-semibold text-cloud-500 uppercase tracking-wide">Recommendations</p>
              <div className="flex items-center gap-2 mt-3">
                <div className="w-3 h-3 bg-success rounded-full"></div>
                <p className="font-semibold text-base text-cloud-900">Active</p>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
