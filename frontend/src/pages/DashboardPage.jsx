import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Zap } from 'lucide-react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import LoadingSkeleton from '../components/ui/LoadingSkeleton';
import MissionCard from '../components/ui/MissionCard';
import api from '../api/mockApi';
import { learningTracks } from '../data/mockData';

export default function DashboardPage() {
  const navigate = useNavigate();
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
    return <LoadingSkeleton count={4} type="card" />;
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Featured Mission Banner */}
      <div className="relative rounded-3xl overflow-hidden h-72 bg-gradient-to-r from-primary-600 to-sky-600 shadow-lg border border-primary-500/20">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-0 right-0 w-96 h-96 bg-white rounded-full -mr-48 -mt-48"></div>
        </div>
        <div className="relative h-full flex items-center justify-between px-8">
          <div className="max-w-2xl">
            <Badge variant="primary" size="sm" className="mb-4 bg-white/20 text-white border-white/30">Featured Mission</Badge>
            <h2 className="text-4xl font-bold text-white mb-3">Cloud Architecture Mastery</h2>
            <p className="text-white/90 text-lg mb-8">Design and deploy scalable cloud infrastructure. Complete real-world scenarios and earn your architecture badge.</p>
            <Button variant="secondary" size="lg" onClick={() => navigate('/challenges')} className="gap-2">
              <Zap className="w-5 h-5" />
              Start Mission
            </Button>
          </div>
          <div className="hidden lg:block text-7xl">🏗️</div>
        </div>
      </div>

      {/* Welcome Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card>
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-2xl font-bold text-cloud-900 mb-2">Welcome back, Cloud Engineer</h2>
                <p className="text-cloud-600 text-lg">Continue your cloud learning journey. Your next mission awaits.</p>
              </div>
              <div className="text-5xl">👋</div>
            </div>
          </Card>
        </div>

        {/* Stats Card */}
        <Card className="bg-gradient-to-br from-accent-50 to-green-50 border-2 border-accent-200">
          <div className="flex items-start justify-between mb-4">
            <h3 className="text-sm font-bold text-accent-900 uppercase tracking-wide">Your Progress</h3>
            <div className="text-2xl">🎖️</div>
          </div>
          <div className="space-y-3">
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium text-cloud-700">Missions Completed</span>
                <span className="text-lg font-bold text-accent-600">{stats?.totalChallengesCompleted}</span>
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium text-cloud-700">Success Rate</span>
                <span className="text-lg font-bold text-accent-600">{stats?.successRate.toFixed(0)}%</span>
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium text-cloud-700">Current Level</span>
                <span className="text-lg font-bold text-accent-600">{stats?.currentSkillLevel}</span>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card hoverable className="group">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold text-cloud-500 uppercase tracking-wide mb-2">Missions Completed</p>
              <p className="text-3xl font-bold text-cloud-900">{stats?.totalChallengesCompleted}</p>
              <p className="text-xs text-accent-600 font-medium mt-2">+2 this week</p>
            </div>
            <div className="text-3xl group-hover:scale-110 transition-transform">🎖️</div>
          </div>
        </Card>

        <Card hoverable className="group">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold text-cloud-500 uppercase tracking-wide mb-2">Success Rate</p>
              <p className="text-3xl font-bold text-cloud-900">{stats?.successRate.toFixed(0)}%</p>
              <p className="text-xs text-accent-600 font-medium mt-2">↑ 5% this month</p>
            </div>
            <div className="text-3xl group-hover:scale-110 transition-transform">📈</div>
          </div>
        </Card>

        <Card hoverable className="group">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold text-cloud-500 uppercase tracking-wide mb-2">Skill Level</p>
              <p className="text-3xl font-bold text-cloud-900">{stats?.currentSkillLevel}</p>
              <p className="text-xs text-amber-600 font-medium mt-2">Intermediate Pilot</p>
            </div>
            <div className="text-3xl group-hover:scale-110 transition-transform">⭐</div>
          </div>
        </Card>

        <Card hoverable className="group">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold text-cloud-500 uppercase tracking-wide mb-2">Learning Streak</p>
              <p className="text-3xl font-bold text-cloud-900">12</p>
              <p className="text-xs text-orange-600 font-medium mt-2">days active</p>
            </div>
            <div className="text-3xl group-hover:scale-110 transition-transform">🔥</div>
          </div>
        </Card>
      </div>

      {/* Available Missions */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-cloud-900">Trending Missions</h2>
            <p className="text-cloud-600 mt-1">Popular missions to advance your cloud skills</p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/challenges')}
            className="flex items-center gap-2"
          >
            View All
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {learningTracks.slice(0, 3).map((track) => (
            <MissionCard
              key={track.id}
              icon={track.icon}
              title={track.name}
              description={track.description}
              difficulty="Intermediate"
              estimatedTime="60-90 min"
              status="available"
              onClick={() => navigate('/challenges')}
              skills={['Cloud', 'DevOps']}
            />
          ))}
        </div>
      </div>

      {/* Recent Activity */}
      <div>
        <h2 className="text-2xl font-bold text-cloud-900 mb-6">Recent Activity</h2>
        <Card>
          <div className="space-y-4">
            {activities?.map((activity) => (
              <div
                key={activity.id}
                className="group flex items-start gap-4 p-4 rounded-xl hover:bg-cloud-50 transition-colors border border-transparent hover:border-cloud-200"
              >
                <div className="text-2xl flex-shrink-0">{activity.icon}</div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-cloud-900 group-hover:text-primary-600 transition-colors">
                    {activity.title}
                  </p>
                  <p className="text-sm text-cloud-600 mt-1">{activity.description}</p>
                  <p className="text-xs text-cloud-500 mt-2">{activity.timestamp}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
