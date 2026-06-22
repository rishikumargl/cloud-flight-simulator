import { useEffect, useState } from 'react';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import LoadingSkeleton from '../components/ui/LoadingSkeleton';

export default function AdminGCPEnvironmentsPage() {
  const [environments, setEnvironments] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      await new Promise((r) => setTimeout(r, 500));
      setEnvironments([
        {
          id: 'env_001',
          learnerId: 'USR001',
          projectId: 'learner-001-compute-challenge',
          track: 'Compute',
          status: 'active',
          createdAt: '2026-06-20 14:35:00',
          expiresAt: '2026-06-20 15:35:00',
          resourcesCreated: 8,
          cost: '$2.15',
        },
        {
          id: 'env_002',
          learnerId: 'USR002',
          projectId: 'learner-002-storage-challenge',
          track: 'Storage',
          status: 'active',
          createdAt: '2026-06-20 14:20:00',
          expiresAt: '2026-06-20 15:20:00',
          resourcesCreated: 5,
          cost: '$1.45',
        },
        {
          id: 'env_003',
          learnerId: 'USR003',
          projectId: 'learner-003-network-challenge',
          track: 'Networking',
          status: 'active',
          createdAt: '2026-06-20 14:05:00',
          expiresAt: '2026-06-20 16:05:00',
          resourcesCreated: 12,
          cost: '$3.80',
        },
        {
          id: 'env_004',
          learnerId: 'USR004',
          projectId: 'learner-004-devops-challenge',
          track: 'DevOps',
          status: 'cleanup_pending',
          createdAt: '2026-06-20 12:30:00',
          expiresAt: '2026-06-20 13:30:00',
          resourcesCreated: 15,
          cost: '$4.25',
        },
        {
          id: 'env_005',
          learnerId: 'USR005',
          projectId: 'learner-005-security-challenge',
          track: 'Security',
          status: 'cleaned_up',
          createdAt: '2026-06-20 11:00:00',
          expiresAt: '2026-06-20 12:00:00',
          resourcesCreated: 6,
          cost: '$1.90',
        },
      ]);
      setLoading(false);
    };
    loadData();
  }, []);

  if (loading) return <LoadingSkeleton count={5} type="row" />;

  const getStatusColor = (status) => {
    switch (status) {
      case 'active':
        return 'success';
      case 'cleanup_pending':
        return 'warning';
      case 'cleaned_up':
        return 'info';
      case 'failed':
        return 'error';
      default:
        return 'cloud';
    }
  };

  const activeCount = environments.filter((e) => e.status === 'active').length;
  const totalCost = environments.reduce((sum, e) => sum + parseFloat(e.cost.slice(1)), 0);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold text-cloud-900">GCP Environment Management</h1>
        <p className="text-lg text-cloud-600 mt-2">Provision, monitor, and manage temporary cloud environments</p>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <p className="text-base text-cloud-600 font-medium">Active Environments</p>
          <p className="text-4xl font-bold text-success mt-2">{activeCount}</p>
        </Card>
        <Card>
          <p className="text-base text-cloud-600 font-medium">Cleanup Pending</p>
          <p className="text-4xl font-bold text-warning mt-2">
            {environments.filter((e) => e.status === 'cleanup_pending').length}
          </p>
        </Card>
        <Card>
          <p className="text-base text-cloud-600 font-medium">Total Cleaned Up</p>
          <p className="text-4xl font-bold text-info mt-2">
            {environments.filter((e) => e.status === 'cleaned_up').length}
          </p>
        </Card>
        <Card>
          <p className="text-base text-cloud-600 font-medium">Current Session Cost</p>
          <p className="text-3xl font-bold text-cloud-900 mt-2">${totalCost.toFixed(2)}</p>
        </Card>
      </div>

      {/* Resource Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <h2 className="text-2xl font-bold text-cloud-900 mb-4">Active Environment Details</h2>
          <div className="space-y-3">
            {environments
              .filter((e) => e.status === 'active')
              .map((env) => (
                <div key={env.id} className="p-3 border border-cloud-200 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-base font-bold text-cloud-900">{env.track}</span>
                    <Badge variant="success">ACTIVE</Badge>
                  </div>
                  <div className="text-sm text-cloud-600 space-y-1">
                    <p>Learner: <strong>{env.learnerId}</strong></p>
                    <p>Resources: <strong>{env.resourcesCreated}</strong></p>
                    <p>Cost: <strong>{env.cost}</strong></p>
                  </div>
                </div>
              ))}
          </div>
        </Card>

        <Card>
          <h2 className="text-2xl font-bold text-cloud-900 mb-4">Resource Allocation by Track</h2>
          <div className="space-y-3">
            {[
              { track: 'Compute', total: 8, active: 1 },
              { track: 'Storage', total: 5, active: 1 },
              { track: 'Networking', total: 12, active: 1 },
              { track: 'DevOps', total: 15, active: 0 },
              { track: 'Security', total: 6, active: 0 },
            ].map((item) => (
              <div key={item.track} className="p-3 bg-cloud-50 rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="text-base font-medium text-cloud-900">{item.track}</span>
                  <span className="text-sm text-cloud-600">
                    Total: <strong>{item.total}</strong> | Active: <strong>{item.active}</strong>
                  </span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* All Environments */}
      <Card>
        <h2 className="text-2xl font-bold text-cloud-900 mb-6">All Environments</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-base">
            <thead>
              <tr className="border-b-2 border-cloud-200">
                <th className="text-left py-4 px-4 text-lg font-bold text-cloud-900">Learner</th>
                <th className="text-left py-4 px-4 text-lg font-bold text-cloud-900">Project ID</th>
                <th className="text-center py-4 px-4 text-lg font-bold text-cloud-900">Track</th>
                <th className="text-center py-4 px-4 text-lg font-bold text-cloud-900">Status</th>
                <th className="text-center py-4 px-4 text-lg font-bold text-cloud-900">Resources</th>
                <th className="text-center py-4 px-4 text-lg font-bold text-cloud-900">Cost</th>
                <th className="text-center py-4 px-4 text-lg font-bold text-cloud-900">Expires</th>
                <th className="text-center py-4 px-4 text-lg font-bold text-cloud-900">Actions</th>
              </tr>
            </thead>
            <tbody>
              {environments.map((env) => (
                <tr key={env.id} className="border-b border-cloud-100 hover:bg-cloud-50">
                  <td className="py-4 px-4 text-base font-medium text-cloud-900">{env.learnerId}</td>
                  <td className="py-4 px-4 text-sm font-mono text-cloud-600">{env.projectId}</td>
                  <td className="py-4 px-4 text-center">
                    <Badge variant="info">{env.track}</Badge>
                  </td>
                  <td className="py-4 px-4 text-center">
                    <Badge variant={getStatusColor(env.status)}>
                      {env.status.replace('_', ' ').toUpperCase()}
                    </Badge>
                  </td>
                  <td className="py-4 px-4 text-center text-base font-bold text-cloud-900">{env.resourcesCreated}</td>
                  <td className="py-4 px-4 text-center text-base font-bold text-primary-600">{env.cost}</td>
                  <td className="py-4 px-4 text-center text-sm text-cloud-600">{env.expiresAt.split(' ')[1]}</td>
                  <td className="py-4 px-4 text-center">
                    {env.status === 'active' && (
                      <Button variant="ghost" size="sm">
                        Force Cleanup
                      </Button>
                    )}
                    {env.status === 'cleanup_pending' && (
                      <Button variant="ghost" size="sm">
                        View Details
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* GCP Integration Settings */}
      <Card className="bg-blue-50 border border-blue-200">
        <h2 className="text-2xl font-bold text-blue-900 mb-4">GCP Configuration</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-3">
            <p className="text-base text-blue-700 font-medium">Default Environment TTL</p>
            <p className="text-2xl font-bold text-blue-900 mt-1">60 minutes</p>
          </div>
          <div className="p-3">
            <p className="text-base text-blue-700 font-medium">Max Concurrent Environments</p>
            <p className="text-2xl font-bold text-blue-900 mt-1">50</p>
          </div>
          <div className="p-3">
            <p className="text-base text-blue-700 font-medium">Auto Cleanup</p>
            <p className="text-2xl font-bold text-blue-900 mt-1">Enabled</p>
          </div>
          <div className="p-3">
            <p className="text-base text-blue-700 font-medium">Billing Alert Threshold</p>
            <p className="text-2xl font-bold text-blue-900 mt-1">$100/day</p>
          </div>
        </div>
      </Card>
    </div>
  );
}
