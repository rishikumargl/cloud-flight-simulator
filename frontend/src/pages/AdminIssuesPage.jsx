import { useEffect, useState } from 'react';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import LoadingSkeleton from '../components/ui/LoadingSkeleton';

export default function AdminIssuesPage() {
  const [issues, setIssues] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      await new Promise((r) => setTimeout(r, 500));
      setIssues([
        {
          id: 'ISS001',
          title: 'Scenario Generation Failed for Advanced DevOps',
          type: 'Scenario Generation',
          severity: 'high',
          status: 'open',
          learnerId: 'USR004',
          timestamp: '2026-06-20 14:31:12',
          description: 'AI failed to generate scenario after 4.1s timeout',
        },
        {
          id: 'ISS002',
          title: 'Evaluation Timeout on Storage Challenge',
          type: 'Evaluation',
          severity: 'high',
          status: 'open',
          learnerId: 'USR012',
          timestamp: '2026-06-20 14:25:45',
          description: 'Resource inspection took longer than expected',
        },
        {
          id: 'ISS003',
          title: 'GCP Environment Cleanup Failed',
          type: 'GCP Provisioning',
          severity: 'critical',
          status: 'open',
          learnerId: 'USR008',
          timestamp: '2026-06-20 14:20:30',
          description: 'Project cleanup queue failed, resources still active',
        },
        {
          id: 'ISS004',
          title: 'Recommendation Engine Out of Memory',
          type: 'Recommendation',
          severity: 'high',
          status: 'investigating',
          learnerId: 'USR015',
          timestamp: '2026-06-20 14:15:20',
          description: 'Memory spike during recommendation generation',
        },
        {
          id: 'ISS005',
          title: 'LangSmith API Rate Limit Exceeded',
          type: 'LangSmith Integration',
          severity: 'medium',
          status: 'investigating',
          learnerId: null,
          timestamp: '2026-06-20 14:10:00',
          description: 'Hit rate limit for trace submissions',
        },
      ]);
      setLoading(false);
    };
    loadData();
  }, []);

  if (loading) return <LoadingSkeleton count={5} type="row" />;

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'critical':
        return 'error';
      case 'high':
        return 'warning';
      case 'medium':
        return 'warning';
      case 'low':
        return 'info';
      default:
        return 'info';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'open':
        return 'error';
      case 'investigating':
        return 'warning';
      case 'resolved':
        return 'success';
      default:
        return 'info';
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold text-cloud-900">Issues & Troubleshooting</h1>
        <p className="text-lg text-cloud-600 mt-2">Monitor and resolve system issues and failures</p>
      </div>

      {/* Issue Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <p className="text-base text-cloud-600 font-medium">Critical Issues</p>
          <p className="text-4xl font-bold text-error mt-2">{issues.filter((i) => i.severity === 'critical').length}</p>
        </Card>
        <Card>
          <p className="text-base text-cloud-600 font-medium">High Priority</p>
          <p className="text-4xl font-bold text-warning mt-2">{issues.filter((i) => i.severity === 'high').length}</p>
        </Card>
        <Card>
          <p className="text-base text-cloud-600 font-medium">Open Issues</p>
          <p className="text-4xl font-bold text-primary-600 mt-2">{issues.filter((i) => i.status === 'open').length}</p>
        </Card>
        <Card>
          <p className="text-base text-cloud-600 font-medium">Investigating</p>
          <p className="text-4xl font-bold text-info mt-2">{issues.filter((i) => i.status === 'investigating').length}</p>
        </Card>
      </div>

      {/* Issues by Type */}
      <Card>
        <h2 className="text-2xl font-bold text-cloud-900 mb-4">Issues by Type</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            { type: 'Scenario Generation', count: 3 },
            { type: 'Evaluation', count: 2 },
            { type: 'GCP Provisioning', count: 1 },
            { type: 'LangSmith Integration', count: 1 },
          ].map((item) => (
            <div key={item.type} className="p-4 border border-cloud-200 rounded-lg">
              <div className="flex items-center justify-between">
                <span className="text-base font-medium text-cloud-900">{item.type}</span>
                <Badge variant="primary">{item.count}</Badge>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* All Issues */}
      <Card>
        <h2 className="text-2xl font-bold text-cloud-900 mb-6">All Issues</h2>
        <div className="space-y-4">
          {issues.map((issue) => (
            <div key={issue.id} className="p-4 border-2 border-cloud-200 rounded-lg hover:shadow-md transition">
              <div className="flex items-start justify-between gap-4 mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-sm font-mono text-cloud-600">{issue.id}</span>
                    <Badge variant={getSeverityColor(issue.severity)}>
                      {issue.severity.toUpperCase()}
                    </Badge>
                    <Badge variant={getStatusColor(issue.status)}>
                      {issue.status.charAt(0).toUpperCase() + issue.status.slice(1)}
                    </Badge>
                  </div>
                  <h3 className="text-lg font-bold text-cloud-900 mb-1">{issue.title}</h3>
                  <p className="text-base text-cloud-600">{issue.description}</p>
                </div>
              </div>
              <div className="flex items-center gap-4 text-sm text-cloud-600 pt-3 border-t border-cloud-100">
                <span>Type: <strong>{issue.type}</strong></span>
                {issue.learnerId && <span>Learner: <strong>{issue.learnerId}</strong></span>}
                <span>Reported: <strong>{issue.timestamp}</strong></span>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Quick Actions */}
      <Card>
        <h2 className="text-2xl font-bold text-cloud-900 mb-4">Troubleshooting Guide</h2>
        <div className="space-y-4">
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-base font-bold text-blue-900 mb-2">Scenario Generation Failures</p>
            <ul className="space-y-1 text-sm text-blue-800">
              <li>• Check LangSmith token limits and API rate</li>
              <li>• Verify learner profile data completeness</li>
              <li>• Review previous scenario success patterns</li>
            </ul>
          </div>
          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-base font-bold text-yellow-900 mb-2">Evaluation Timeouts</p>
            <ul className="space-y-1 text-sm text-yellow-800">
              <li>• Check GCP API response times</li>
              <li>• Verify resource counts in environment</li>
              <li>• Review network connectivity to GCP</li>
            </ul>
          </div>
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-base font-bold text-red-900 mb-2">GCP Cleanup Failures</p>
            <ul className="space-y-1 text-sm text-red-800">
              <li>• Verify GCP project permissions</li>
              <li>• Check for locked resources</li>
              <li>• Review cleanup job logs</li>
            </ul>
          </div>
        </div>
      </Card>
    </div>
  );
}
