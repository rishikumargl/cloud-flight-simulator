import { TrendingUp, Clock, Zap, Target } from 'lucide-react';
import { useEffect, useState } from 'react';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import ProgressBar from '../components/ui/ProgressBar';
import LoadingSkeleton from '../components/ui/LoadingSkeleton';
import api from '../api/mockApi';
import { learningTracks } from '../data/mockData';

export default function DashboardPage() {
  const [stats, setStats] = useState(null);
  const [activities, setActivities] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [statsData, activitiesData] = await Promise.all([
          api.getDashboardStats(),
          api.getRecentActivities(),
        ]);
        setStats(statsData);
        setActivities(activitiesData);
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

  const getTrackIcon = (trackId) => {
    const track = learningTracks.find((t) => t.id === trackId);
    return track?.icon || '📚';
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-cloud-900">Welcome back, Alex!</h1>
          <p className="text-cloud-600 mt-1">
            You're making excellent progress on your cloud learning journey
          </p>
        </div>
        <Button href="/challenges" variant="primary" size="lg">
          Start New Challenge
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="hover:shadow-lg transition">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-cloud-600 font-medium">Challenges Completed</p>
              <p className="text-3xl font-bold text-cloud-900 mt-2">
                {stats?.totalChallengesCompleted}
              </p>
            </div>
            <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center text-xl">
              ✅
            </div>
          </div>
        </Card>

        <Card className="hover:shadow-lg transition">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-cloud-600 font-medium">Success Rate</p>
              <p className="text-3xl font-bold text-cloud-900 mt-2">
                {stats?.successRate.toFixed(1)}%
              </p>
            </div>
            <div className="w-12 h-12 bg-success/10 rounded-lg flex items-center justify-center text-xl">
              📈
            </div>
          </div>
        </Card>

        <Card className="hover:shadow-lg transition">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-cloud-600 font-medium">Current Level</p>
              <p className="text-3xl font-bold text-cloud-900 mt-2">
                {stats?.currentSkillLevel}
              </p>
            </div>
            <div className="w-12 h-12 bg-warning/10 rounded-lg flex items-center justify-center text-xl">
              ⭐
            </div>
          </div>
        </Card>

        <Card className="hover:shadow-lg transition">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-cloud-600 font-medium">Hours Learned</p>
              <p className="text-3xl font-bold text-cloud-900 mt-2">{stats?.hoursLearned}</p>
            </div>
            <div className="w-12 h-12 bg-info/10 rounded-lg flex items-center justify-center text-xl">
              ⏱️
            </div>
          </div>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Performance Summary */}
        <div className="lg:col-span-2">
          <Card>
            <h2 className="text-xl font-bold text-cloud-900 mb-6">Performance Summary</h2>
            <div className="space-y-6">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium text-cloud-700">Compute</span>
                  <span className="text-sm text-cloud-600">85%</span>
                </div>
                <ProgressBar progress={85} size="md" />
              </div>
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium text-cloud-700">Storage</span>
                  <span className="text-sm text-cloud-600">72%</span>
                </div>
                <ProgressBar progress={72} size="md" />
              </div>
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium text-cloud-700">Networking</span>
                  <span className="text-sm text-cloud-600">92%</span>
                </div>
                <ProgressBar progress={92} size="md" />
              </div>
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium text-cloud-700">Security</span>
                  <span className="text-sm text-cloud-600">68%</span>
                </div>
                <ProgressBar progress={68} size="md" />
              </div>
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium text-cloud-700">DevOps</span>
                  <span className="text-sm text-cloud-600">58%</span>
                </div>
                <ProgressBar progress={58} size="md" />
              </div>
            </div>
          </Card>
        </div>

        {/* Recommended Challenge */}
        <Card className="bg-gradient-to-br from-primary-50 to-sky-50">
          <h2 className="text-xl font-bold text-cloud-900 mb-4">Recommended Next</h2>
          <div className="space-y-4">
            <div>
              <p className="text-3xl mb-2">{getTrackIcon('devops')}</p>
              <h3 className="font-bold text-cloud-900">
                {stats?.nextRecommendedChallenge}
              </h3>
              <p className="text-sm text-cloud-600 mt-1">Intermediate • DevOps</p>
            </div>
            <p className="text-sm text-cloud-700">
              Based on your networking success, you're ready for DevOps challenges.
            </p>
            <Button variant="primary" size="md" className="w-full">
              Start Challenge →
            </Button>
          </div>
        </Card>
      </div>

      {/* Recent Activities */}
      <Card>
        <h2 className="text-xl font-bold text-cloud-900 mb-6">Recent Activities</h2>
        <div className="space-y-4">
          {activities?.map((activity) => (
            <div
              key={activity.id}
              className="flex items-start gap-4 pb-4 border-b border-cloud-100 last:border-0"
            >
              <div className="text-2xl mt-1">{activity.icon}</div>
              <div className="flex-1">
                <h3 className="font-medium text-cloud-900">{activity.title}</h3>
                <p className="text-sm text-cloud-600 mt-1">{activity.description}</p>
                <p className="text-xs text-cloud-500 mt-2">{activity.timestamp}</p>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
