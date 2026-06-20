import { useEffect, useState } from 'react';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import LoadingSkeleton from '../components/ui/LoadingSkeleton';

export default function AdminLogsPage() {
  const [logs, setLogs] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      await new Promise((r) => setTimeout(r, 500));
      setLogs([
        { id: 1, timestamp: '2026-06-20 14:32:15', userId: 'USR001', action: 'Login', resource: 'Authentication', severity: 'info' },
        { id: 2, timestamp: '2026-06-20 14:31:45', userId: 'USR002', action: 'Start Challenge', resource: 'compute-01', severity: 'info' },
        { id: 3, timestamp: '2026-06-20 14:30:22', userId: 'USR003', action: 'Submit Solution', resource: 'challenge-42', severity: 'info' },
        { id: 4, timestamp: '2026-06-20 14:29:50', userId: 'ADM001', action: 'Update Challenge', resource: 'challenge-35', severity: 'warning' },
        { id: 5, timestamp: '2026-06-20 14:28:30', userId: 'USR001', action: 'Failed Challenge', resource: 'challenge-50', severity: 'error' },
        { id: 6, timestamp: '2026-06-20 14:27:15', userId: 'USR004', action: 'Access Denied', resource: 'Admin Dashboard', severity: 'error' },
        { id: 7, timestamp: '2026-06-20 14:26:00', userId: 'ADM002', action: 'Generate Report', resource: 'Analytics', severity: 'info' },
        { id: 8, timestamp: '2026-06-20 14:25:30', userId: 'USR005', action: 'Logout', resource: 'Authentication', severity: 'info' },
      ]);
      setLoading(false);
    };

    loadData();
  }, []);

  if (loading) {
    return <LoadingSkeleton count={5} type="row" />;
  }

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'info':
        return 'info';
      case 'warning':
        return 'warning';
      case 'error':
        return 'error';
      default:
        return 'info';
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold text-cloud-900">Logs & Audit Trail</h1>
        <p className="text-lg text-cloud-600 mt-2">Monitor system events and user activities</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <p className="text-base text-cloud-600 font-medium">Total Events</p>
          <p className="text-4xl font-bold text-primary-600 mt-2">{logs.length}</p>
        </Card>
        <Card>
          <p className="text-base text-cloud-600 font-medium">Info Logs</p>
          <p className="text-4xl font-bold text-info mt-2">{logs.filter((l) => l.severity === 'info').length}</p>
        </Card>
        <Card>
          <p className="text-base text-cloud-600 font-medium">Warnings</p>
          <p className="text-4xl font-bold text-warning mt-2">{logs.filter((l) => l.severity === 'warning').length}</p>
        </Card>
        <Card>
          <p className="text-base text-cloud-600 font-medium">Errors</p>
          <p className="text-4xl font-bold text-error mt-2">{logs.filter((l) => l.severity === 'error').length}</p>
        </Card>
      </div>

      {/* System Events */}
      <Card>
        <h2 className="text-2xl font-bold text-cloud-900 mb-6">System Events</h2>
        <div className="space-y-3">
          {logs.map((log) => (
            <div key={log.id} className="p-4 border border-cloud-200 rounded-lg hover:bg-cloud-50 transition">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-sm font-mono text-cloud-600">{log.timestamp}</span>
                    <Badge variant={getSeverityColor(log.severity)}>
                      {log.severity.charAt(0).toUpperCase() + log.severity.slice(1)}
                    </Badge>
                  </div>
                  <p className="text-base font-medium text-cloud-900 mb-1">{log.action}</p>
                  <div className="flex items-center gap-2 text-base text-cloud-600">
                    <span>User: <strong>{log.userId}</strong></span>
                    <span>•</span>
                    <span>Resource: <strong>{log.resource}</strong></span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Audit Events Table */}
      <Card>
        <h2 className="text-2xl font-bold text-cloud-900 mb-6">Detailed Audit Trail</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-base">
            <thead>
              <tr className="border-b-2 border-cloud-200">
                <th className="text-left py-4 px-4 text-lg font-bold text-cloud-900">Timestamp</th>
                <th className="text-left py-4 px-4 text-lg font-bold text-cloud-900">User</th>
                <th className="text-left py-4 px-4 text-lg font-bold text-cloud-900">Action</th>
                <th className="text-left py-4 px-4 text-lg font-bold text-cloud-900">Resource</th>
                <th className="text-center py-4 px-4 text-lg font-bold text-cloud-900">Severity</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr key={log.id} className="border-b border-cloud-100 hover:bg-cloud-50">
                  <td className="py-4 px-4 text-sm font-mono text-cloud-700">{log.timestamp}</td>
                  <td className="py-4 px-4 text-base text-cloud-900">
                    <Badge variant="secondary">{log.userId}</Badge>
                  </td>
                  <td className="py-4 px-4 text-base font-medium text-cloud-900">{log.action}</td>
                  <td className="py-4 px-4 text-base text-cloud-600">{log.resource}</td>
                  <td className="py-4 px-4 text-center">
                    <Badge variant={getSeverityColor(log.severity)}>
                      {log.severity.charAt(0).toUpperCase() + log.severity.slice(1)}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
