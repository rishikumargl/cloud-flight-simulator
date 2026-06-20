import { useEffect, useState } from 'react';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import ProgressBar from '../components/ui/ProgressBar';
import LoadingSkeleton from '../components/ui/LoadingSkeleton';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export default function AdminLearnerInsightsPage() {
  const [insights, setInsights] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      await new Promise((r) => setTimeout(r, 500));
      setInsights({
        performanceData: [
          { track: 'Compute', avg: 85, completion: 88, engagement: 92 },
          { track: 'Storage', avg: 78, completion: 82, engagement: 75 },
          { track: 'Networking', avg: 92, completion: 95, engagement: 98 },
          { track: 'Security', avg: 68, completion: 70, engagement: 65 },
          { track: 'DevOps', avg: 72, completion: 75, engagement: 80 },
          { track: 'Architecture', avg: 81, completion: 85, engagement: 88 },
        ],
        progressTrend: [
          { week: 'Week 1', learners: 45, completed: 8 },
          { week: 'Week 2', learners: 58, completed: 24 },
          { week: 'Week 3', learners: 72, completed: 42 },
          { week: 'Week 4', learners: 95, completed: 68 },
          { week: 'Week 5', learners: 128, completed: 115 },
          { week: 'Week 6', learners: 165, completed: 156 },
        ],
        topPerformers: [
          { id: 'USR002', name: 'Sarah Smith', avgScore: 94, challenges: 15, track: 'Advanced' },
          { id: 'USR006', name: 'Lisa Anderson', avgScore: 91, challenges: 20, track: 'Advanced' },
          { id: 'USR001', name: 'Alex Johnson', avgScore: 88, challenges: 8, track: 'Intermediate' },
        ],
        strugglingLearners: [
          { id: 'USR009', name: 'Robert Brown', avgScore: 52, challenges: 4, lastAttempt: '3 days ago' },
          { id: 'USR011', name: 'Michael Davis', avgScore: 58, challenges: 3, lastAttempt: '5 days ago' },
          { id: 'USR010', name: 'Jennifer Lee', avgScore: 64, challenges: 6, lastAttempt: '2 days ago' },
        ],
        engagementMetrics: {
          avgChallengesPerLearner: 7.2,
          completionRate: 81.5,
          retentionRate: 78.3,
          avgTimePerChallenge: '58 min',
          helpRequestRate: 24.2,
        },
      });
      setLoading(false);
    };
    loadData();
  }, []);

  if (loading) return <LoadingSkeleton count={4} type="card" />;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold text-cloud-900">Learner Insights & Analytics</h1>
        <p className="text-lg text-cloud-600 mt-2">Comprehensive learner performance and engagement analysis</p>
      </div>

      {/* Engagement Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <p className="text-base text-cloud-600 font-medium">Avg Challenges/Learner</p>
          <p className="text-3xl font-bold text-primary-600 mt-2">{insights.engagementMetrics.avgChallengesPerLearner}</p>
        </Card>
        <Card>
          <p className="text-base text-cloud-600 font-medium">Completion Rate</p>
          <p className="text-3xl font-bold text-success mt-2">{insights.engagementMetrics.completionRate}%</p>
        </Card>
        <Card>
          <p className="text-base text-cloud-600 font-medium">Retention Rate</p>
          <p className="text-3xl font-bold text-info mt-2">{insights.engagementMetrics.retentionRate}%</p>
        </Card>
        <Card>
          <p className="text-base text-cloud-600 font-medium">Avg Challenge Time</p>
          <p className="text-3xl font-bold text-warning mt-2">{insights.engagementMetrics.avgTimePerChallenge}</p>
        </Card>
        <Card>
          <p className="text-base text-cloud-600 font-medium">Help Requests</p>
          <p className="text-3xl font-bold text-cloud-900 mt-2">{insights.engagementMetrics.helpRequestRate}%</p>
        </Card>
      </div>

      {/* Performance by Track */}
      <Card>
        <h2 className="text-2xl font-bold text-cloud-900 mb-4">Performance by Track</h2>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={insights.performanceData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey="track" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="avg" fill="#3b82f6" name="Avg Score" />
            <Bar dataKey="completion" fill="#10b981" name="Completion %" />
            <Bar dataKey="engagement" fill="#f59e0b" name="Engagement %" />
          </BarChart>
        </ResponsiveContainer>
      </Card>

      {/* Learner Growth Trend */}
      <Card>
        <h2 className="text-2xl font-bold text-cloud-900 mb-4">Learner Growth & Completion Trend</h2>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={insights.progressTrend}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey="week" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="learners" stroke="#3b82f6" strokeWidth={2} name="Total Learners" />
            <Line type="monotone" dataKey="completed" stroke="#10b981" strokeWidth={2} name="Challenges Completed" />
          </LineChart>
        </ResponsiveContainer>
      </Card>

      {/* Top Performers */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <h2 className="text-2xl font-bold text-cloud-900 mb-4">Top Performers</h2>
          <div className="space-y-3">
            {insights.topPerformers.map((learner, idx) => (
              <div key={learner.id} className="p-4 border border-cloud-200 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <span className="text-2xl font-bold text-primary-600 mr-3">#{idx + 1}</span>
                    <span className="text-base font-bold text-cloud-900">{learner.name}</span>
                  </div>
                  <Badge variant="success">{learner.avgScore}%</Badge>
                </div>
                <div className="flex items-center justify-between text-sm text-cloud-600">
                  <span>Challenges: <strong>{learner.challenges}</strong></span>
                  <span>Level: <strong>{learner.track}</strong></span>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <h2 className="text-2xl font-bold text-cloud-900 mb-4">Struggling Learners (Need Support)</h2>
          <div className="space-y-3">
            {insights.strugglingLearners.map((learner) => (
              <div key={learner.id} className="p-4 border-2 border-warning-200 rounded-lg bg-warning/5">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-base font-bold text-cloud-900">{learner.name}</span>
                  <Badge variant="warning">{learner.avgScore}%</Badge>
                </div>
                <div className="flex items-center justify-between text-sm text-cloud-600">
                  <span>Completed: <strong>{learner.challenges}</strong> challenges</span>
                  <span>Last Activity: <strong>{learner.lastAttempt}</strong></span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Track Effectiveness */}
      <Card>
        <h2 className="text-2xl font-bold text-cloud-900 mb-6">Track Effectiveness Analysis</h2>
        <div className="space-y-4">
          {insights.performanceData.map((track) => (
            <div key={track.track}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-base font-medium text-cloud-700">{track.track}</span>
                <span className="text-lg font-bold text-primary-600">{track.avg}%</span>
              </div>
              <ProgressBar progress={track.avg} size="md" />
              <div className="flex items-center justify-between text-sm text-cloud-600 mt-1">
                <span>Completion: {track.completion}%</span>
                <span>Engagement: {track.engagement}%</span>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Recommendations */}
      <Card className="bg-blue-50 border border-blue-200">
        <h2 className="text-2xl font-bold text-blue-900 mb-4">Insights & Recommendations</h2>
        <div className="space-y-3">
          <div className="p-3 bg-white rounded-lg border border-blue-100">
            <p className="text-base text-blue-900 font-medium mb-1">🎯 High Engagement Opportunity</p>
            <p className="text-sm text-blue-800">Networking track shows 98% engagement - consider using this as template for other tracks</p>
          </div>
          <div className="p-3 bg-white rounded-lg border border-blue-100">
            <p className="text-base text-blue-900 font-medium mb-1">⚠️ Security Track Needs Attention</p>
            <p className="text-sm text-blue-800">Lowest completion rate (70%) - review challenge difficulty and provide additional support</p>
          </div>
          <div className="p-3 bg-white rounded-lg border border-blue-100">
            <p className="text-base text-blue-900 font-medium mb-1">📈 Learner Retention Strong</p>
            <p className="text-sm text-blue-800">78% retention rate is excellent - continue current engagement strategies</p>
          </div>
          <div className="p-3 bg-white rounded-lg border border-blue-100">
            <p className="text-base text-blue-900 font-medium mb-1">🆘 Support for Struggling Learners</p>
            <p className="text-sm text-blue-800">3 learners scoring below 65% - recommend personalized coaching sessions</p>
          </div>
        </div>
      </Card>
    </div>
  );
}
