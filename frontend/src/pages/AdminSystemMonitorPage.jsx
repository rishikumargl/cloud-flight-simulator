import { useEffect, useState } from 'react';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import ProgressBar from '../components/ui/ProgressBar';

export default function AdminSystemMonitorPage() {
  const [systemStatus, setSystemStatus] = useState(null);

  useEffect(() => {
    const loadData = async () => {
      await new Promise((r) => setTimeout(r, 300));
      setSystemStatus({
        uptime: '99.8%',
        apiLatency: '125ms',
        gcpHealth: 'Healthy',
        databaseStatus: 'Connected',
        langsmithStatus: 'Active',
        scenarios: { generated: 342, successful: 328, failed: 14 },
        evaluations: { total: 856, successful: 798, failed: 58 },
        environments: { active: 12, total: 145, cleanup: 95 },
        costs: { today: '$45.32', month: '$1,240.80' },
        resources: {
          cpu: 65,
          memory: 78,
          storage: 42,
          network: 38,
        },
      });
    };
    loadData();
  }, []);

  if (!systemStatus) return null;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold text-cloud-900">System Monitor</h1>
        <p className="text-lg text-cloud-600 mt-2">Real-time system health and performance metrics</p>
      </div>

      {/* System Health Status */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <p className="text-base text-cloud-600 font-medium">Uptime</p>
          <p className="text-3xl font-bold text-success mt-2">{systemStatus.uptime}</p>
          <Badge variant="success" className="mt-2">Healthy</Badge>
        </Card>
        <Card>
          <p className="text-base text-cloud-600 font-medium">API Latency</p>
          <p className="text-3xl font-bold text-info mt-2">{systemStatus.apiLatency}</p>
          <Badge variant="success" className="mt-2">Optimal</Badge>
        </Card>
        <Card>
          <p className="text-base text-cloud-600 font-medium">GCP Connection</p>
          <p className="text-2xl font-bold text-cloud-900 mt-2">{systemStatus.gcpHealth}</p>
          <Badge variant="success" className="mt-2">Connected</Badge>
        </Card>
        <Card>
          <p className="text-base text-cloud-600 font-medium">Database</p>
          <p className="text-2xl font-bold text-cloud-900 mt-2">{systemStatus.databaseStatus}</p>
          <Badge variant="success" className="mt-2">Ready</Badge>
        </Card>
        <Card>
          <p className="text-base text-cloud-600 font-medium">LangSmith</p>
          <p className="text-2xl font-bold text-cloud-900 mt-2">{systemStatus.langsmithStatus}</p>
          <Badge variant="success" className="mt-2">Tracing</Badge>
        </Card>
      </div>

      {/* Resource Utilization */}
      <Card>
        <h2 className="text-2xl font-bold text-cloud-900 mb-6">Resource Utilization</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-base font-medium text-cloud-700">CPU Usage</span>
              <span className="text-lg font-bold text-cloud-900">{systemStatus.resources.cpu}%</span>
            </div>
            <ProgressBar progress={systemStatus.resources.cpu} size="md" />
          </div>
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-base font-medium text-cloud-700">Memory Usage</span>
              <span className="text-lg font-bold text-cloud-900">{systemStatus.resources.memory}%</span>
            </div>
            <ProgressBar progress={systemStatus.resources.memory} size="md" />
          </div>
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-base font-medium text-cloud-700">Storage Usage</span>
              <span className="text-lg font-bold text-cloud-900">{systemStatus.resources.storage}%</span>
            </div>
            <ProgressBar progress={systemStatus.resources.storage} size="md" />
          </div>
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-base font-medium text-cloud-700">Network Usage</span>
              <span className="text-lg font-bold text-cloud-900">{systemStatus.resources.network}%</span>
            </div>
            <ProgressBar progress={systemStatus.resources.network} size="md" />
          </div>
        </div>
      </Card>

      {/* AI Components Status */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <h2 className="text-2xl font-bold text-cloud-900 mb-4">Scenario Generation</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-success/5 rounded-lg">
              <span className="text-base text-cloud-700">Generated Scenarios</span>
              <span className="text-2xl font-bold text-success">{systemStatus.scenarios.generated}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
              <span className="text-base text-cloud-700">Successful</span>
              <span className="text-2xl font-bold text-success">{systemStatus.scenarios.successful}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
              <span className="text-base text-cloud-700">Failed</span>
              <span className="text-2xl font-bold text-error">{systemStatus.scenarios.failed}</span>
            </div>
            <div>
              <span className="text-sm text-cloud-600">Success Rate</span>
              <ProgressBar progress={Math.round((systemStatus.scenarios.successful / systemStatus.scenarios.generated) * 100)} size="md" />
            </div>
          </div>
        </Card>

        <Card>
          <h2 className="text-2xl font-bold text-cloud-900 mb-4">Evaluation Engine</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-info/5 rounded-lg">
              <span className="text-base text-cloud-700">Total Evaluations</span>
              <span className="text-2xl font-bold text-info">{systemStatus.evaluations.total}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
              <span className="text-base text-cloud-700">Successful</span>
              <span className="text-2xl font-bold text-success">{systemStatus.evaluations.successful}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
              <span className="text-base text-cloud-700">Failed</span>
              <span className="text-2xl font-bold text-error">{systemStatus.evaluations.failed}</span>
            </div>
            <div>
              <span className="text-sm text-cloud-600">Accuracy</span>
              <ProgressBar progress={Math.round((systemStatus.evaluations.successful / systemStatus.evaluations.total) * 100)} size="md" />
            </div>
          </div>
        </Card>
      </div>

      {/* Cloud Environment Management */}
      <Card>
        <h2 className="text-2xl font-bold text-cloud-900 mb-4">Cloud Environment Status</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-primary-50 rounded-lg">
            <p className="text-base text-cloud-600 font-medium">Active Environments</p>
            <p className="text-4xl font-bold text-primary-600 mt-2">{systemStatus.environments.active}</p>
            <p className="text-sm text-cloud-500 mt-2">Currently provisioned</p>
          </div>
          <div className="p-4 bg-info/5 rounded-lg">
            <p className="text-base text-cloud-600 font-medium">Total Provisioned</p>
            <p className="text-4xl font-bold text-info mt-2">{systemStatus.environments.total}</p>
            <p className="text-sm text-cloud-500 mt-2">All time</p>
          </div>
          <div className="p-4 bg-success/5 rounded-lg">
            <p className="text-base text-cloud-600 font-medium">Cleaned Up</p>
            <p className="text-4xl font-bold text-success mt-2">{systemStatus.environments.cleanup}</p>
            <p className="text-sm text-cloud-500 mt-2">Successful cleanups</p>
          </div>
        </div>
      </Card>

      {/* Cost Monitoring */}
      <Card>
        <h2 className="text-2xl font-bold text-cloud-900 mb-4">GCP Cost Tracking</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 border-2 border-primary-200 rounded-lg">
            <p className="text-base text-cloud-600 font-medium">Today's Cost</p>
            <p className="text-4xl font-bold text-primary-600 mt-2">{systemStatus.costs.today}</p>
          </div>
          <div className="p-4 border-2 border-warning-200 rounded-lg">
            <p className="text-base text-cloud-600 font-medium">Monthly Cost (YTD)</p>
            <p className="text-4xl font-bold text-warning mt-2">{systemStatus.costs.month}</p>
          </div>
        </div>
      </Card>
    </div>
  );
}
