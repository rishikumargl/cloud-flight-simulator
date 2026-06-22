import { useEffect, useState } from 'react';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import LoadingSkeleton from '../components/ui/LoadingSkeleton';

export default function AdminAITracingPage() {
  const [traces, setTraces] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      await new Promise((r) => setTimeout(r, 500));
      setTraces([
        {
          id: 'trace_001',
          timestamp: '2026-06-20 14:35:22',
          type: 'Scenario Generation',
          learnerId: 'USR001',
          track: 'Compute',
          difficulty: 'Intermediate',
          status: 'success',
          duration: '2.3s',
          tokens: { input: 1250, output: 425 },
        },
        {
          id: 'trace_002',
          timestamp: '2026-06-20 14:34:15',
          type: 'Evaluation',
          learnerId: 'USR002',
          track: 'Storage',
          difficulty: 'Beginner',
          status: 'success',
          duration: '1.8s',
          tokens: { input: 980, output: 320 },
        },
        {
          id: 'trace_003',
          timestamp: '2026-06-20 14:33:48',
          type: 'Feedback Generation',
          learnerId: 'USR003',
          track: 'Networking',
          difficulty: 'Advanced',
          status: 'success',
          duration: '3.2s',
          tokens: { input: 1580, output: 650 },
        },
        {
          id: 'trace_004',
          timestamp: '2026-06-20 14:32:30',
          type: 'Recommendation',
          learnerId: 'USR001',
          track: 'Security',
          difficulty: 'Intermediate',
          status: 'success',
          duration: '1.5s',
          tokens: { input: 890, output: 280 },
        },
        {
          id: 'trace_005',
          timestamp: '2026-06-20 14:31:12',
          type: 'Scenario Generation',
          learnerId: 'USR004',
          track: 'DevOps',
          difficulty: 'Advanced',
          status: 'failed',
          duration: '4.1s',
          tokens: { input: 1420, output: 0 },
        },
      ]);
      setLoading(false);
    };
    loadData();
  }, []);

  if (loading) return <LoadingSkeleton count={5} type="row" />;

  const getTraceColor = (type) => {
    switch (type) {
      case 'Scenario Generation':
        return 'primary';
      case 'Evaluation':
        return 'info';
      case 'Feedback Generation':
        return 'success';
      case 'Recommendation':
        return 'warning';
      default:
        return 'cloud';
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold text-cloud-900">LangSmith AI Tracing</h1>
        <p className="text-lg text-cloud-600 mt-2">Monitor and analyze all AI-powered decision traces</p>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <p className="text-base text-cloud-600 font-medium">Total Traces</p>
          <p className="text-4xl font-bold text-primary-600 mt-2">2,456</p>
        </Card>
        <Card>
          <p className="text-base text-cloud-600 font-medium">Success Rate</p>
          <p className="text-4xl font-bold text-success mt-2">94.2%</p>
        </Card>
        <Card>
          <p className="text-base text-cloud-600 font-medium">Avg Duration</p>
          <p className="text-4xl font-bold text-info mt-2">2.1s</p>
        </Card>
        <Card>
          <p className="text-base text-cloud-600 font-medium">Tokens Used</p>
          <p className="text-4xl font-bold text-warning mt-2">1.2M</p>
        </Card>
        <Card>
          <p className="text-base text-cloud-600 font-medium">Avg Cost</p>
          <p className="text-4xl font-bold text-cloud-900 mt-2">$3.45</p>
        </Card>
      </div>

      {/* Trace Type Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <h2 className="text-2xl font-bold text-cloud-900 mb-4">Traces by Type</h2>
          <div className="space-y-3">
            {[
              { type: 'Scenario Generation', count: 342, success: 328 },
              { type: 'Evaluation', count: 856, success: 798 },
              { type: 'Feedback Generation', count: 423, success: 412 },
              { type: 'Recommendation', count: 835, success: 824 },
            ].map((item) => (
              <div key={item.type} className="p-3 border border-cloud-200 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-base font-medium text-cloud-900">{item.type}</span>
                  <Badge variant={getTraceColor(item.type)}>{item.count}</Badge>
                </div>
                <div className="flex items-center justify-between text-sm text-cloud-600">
                  <span>Success: {item.success}/{item.count}</span>
                  <span>{Math.round((item.success / item.count) * 100)}%</span>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <h2 className="text-2xl font-bold text-cloud-900 mb-4">Token Usage</h2>
          <div className="space-y-4">
            {[
              { type: 'Scenario Generation', input: 428750, output: 145500 },
              { type: 'Evaluation', input: 838480, output: 273280 },
              { type: 'Feedback Generation', size: 415340 },
              { type: 'Recommendation', size: 233800 },
            ].map((item) => (
              <div key={item.type} className="p-3 bg-cloud-50 rounded-lg">
                <p className="text-base font-medium text-cloud-900 mb-2">{item.type}</p>
                <div className="flex items-center justify-between text-sm text-cloud-600">
                  {item.input ? (
                    <>
                      <span>Input: {(item.input / 1000).toFixed(1)}K</span>
                      <span>Output: {(item.output / 1000).toFixed(1)}K</span>
                    </>
                  ) : (
                    <span>Total: {(item.size / 1000).toFixed(1)}K</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Recent Traces */}
      <Card>
        <h2 className="text-2xl font-bold text-cloud-900 mb-6">Recent AI Traces</h2>
        <div className="space-y-3">
          {traces.map((trace) => (
            <div key={trace.id} className="p-4 border border-cloud-200 rounded-lg hover:bg-cloud-50 transition">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <Badge variant={getTraceColor(trace.type)}>{trace.type}</Badge>
                    <Badge variant={trace.status === 'success' ? 'success' : 'error'}>
                      {trace.status.charAt(0).toUpperCase() + trace.status.slice(1)}
                    </Badge>
                    <span className="text-sm font-mono text-cloud-600">{trace.timestamp}</span>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-cloud-600">
                    <span>Learner: <strong>{trace.learnerId}</strong></span>
                    <span>Track: <strong>{trace.track}</strong></span>
                    <span>Difficulty: <strong>{trace.difficulty}</strong></span>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-base font-bold text-cloud-900">{trace.duration}</p>
                  <p className="text-sm text-cloud-600">
                    {trace.tokens.input.toLocaleString()} → {trace.tokens.output.toLocaleString()} tokens
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Performance Analysis */}
      <Card>
        <h2 className="text-2xl font-bold text-cloud-900 mb-4">Performance Analysis</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
            <p className="text-base text-blue-700 font-medium">Fastest Operation</p>
            <p className="text-2xl font-bold text-blue-900 mt-2">1.2s</p>
            <p className="text-sm text-blue-600 mt-1">Recommendation - Avg</p>
          </div>
          <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
            <p className="text-base text-yellow-700 font-medium">Slowest Operation</p>
            <p className="text-2xl font-bold text-yellow-900 mt-2">4.1s</p>
            <p className="text-sm text-yellow-600 mt-1">Scenario Generation - Failed</p>
          </div>
          <div className="p-4 bg-green-50 rounded-lg border border-green-200">
            <p className="text-base text-green-700 font-medium">Most Efficient</p>
            <p className="text-2xl font-bold text-green-900 mt-2">0.89</p>
            <p className="text-sm text-green-600 mt-1">Tokens per Second</p>
          </div>
        </div>
      </Card>
    </div>
  );
}
