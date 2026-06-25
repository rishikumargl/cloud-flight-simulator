import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Zap, TrendingUp, Award, Flame, Target, ChevronRight, CheckCircle2, Rocket, Trophy } from 'lucide-react';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import LoadingSkeleton from '../components/ui/LoadingSkeleton';
import MissionCard from '../components/ui/MissionCard';
import api from '../api/mockApi';

const getActivityIcon = (emojiIcon) => {
  switch (emojiIcon) {
    case '✅':
      return <CheckCircle2 className="w-6 h-6 text-green-500 flex-shrink-0" />;
    case '🚀':
      return <Rocket className="w-6 h-6 text-orange-500 flex-shrink-0" />;
    case '🏆':
      return <Trophy className="w-6 h-6 text-yellow-500 flex-shrink-0" />;
    default:
      return <span className="text-2xl">{emojiIcon}</span>;
  }
};

export default function DashboardPage() {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [activities, setActivities] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showGeneratingModal, setShowGeneratingModal] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

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

  const handleTrendingMissionClick = async (missionRoute) => {
    setShowGeneratingModal(true);
    setIsGenerating(true);
    try {
      await api.startChallenge(1);
      await new Promise((r) => setTimeout(r, 2000));
      navigate(missionRoute);
    } finally {
      setIsGenerating(false);
      setShowGeneratingModal(false);
    }
  };

  if (loading) {
    return <LoadingSkeleton count={4} type="card" />;
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Welcome Section - Centered */}
      <div className="space-y-4 text-center">
        <h1 className="text-3xl md:text-4xl font-bold text-cloud-900">Welcome back, Cloud Engineer 👋</h1>
        <p className="text-orange-600 font-semibold text-base mb-2">Continue your learning journey</p>
        <p className="text-base text-cloud-700 leading-relaxed">Master cloud engineering through AI-powered challenges and personalized scenarios.</p>
        <div className="flex justify-center">
          <Button
            onClick={() => navigate('/challenges')}
            variant="primary"
            size="lg"
            className="gap-2 px-8"
          >
            <Zap className="w-5 h-5" />
            Start Mission
          </Button>
        </div>
      </div>

      {/* Performance Stats - Interactive Stat Boxes */}
      <div className="space-y-6">
        <div>
          <h3 className="text-xl font-semibold text-cloud-900">Your Performance</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Completed Challenges */}
          <div className="p-4 rounded-lg bg-white border border-cloud-100 hover:border-primary-300/50 hover:shadow-sm transition-all duration-300">
            <div className="flex items-start justify-between mb-3">
              <Award className="w-5 h-5 text-orange-500 flex-shrink-0" />
              <span className="text-xs font-semibold text-orange-600">+2</span>
            </div>
            <p className="text-xs font-semibold text-cloud-500 uppercase tracking-wide mb-1">Challenges</p>
            <p className="text-2xl font-semibold text-cloud-900">{stats?.totalChallengesCompleted}</p>
          </div>

          {/* Success Rate */}
          <div className="p-4 rounded-lg bg-white border border-cloud-100 hover:border-primary-300/50 hover:shadow-sm transition-all duration-300">
            <div className="flex items-start justify-between mb-3">
              <TrendingUp className="w-5 h-5 text-orange-500 flex-shrink-0" />
              <span className="text-xs font-semibold text-primary-600">↑5%</span>
            </div>
            <p className="text-xs font-semibold text-cloud-500 uppercase tracking-wide mb-1">Success Rate</p>
            <p className="text-2xl font-semibold text-cloud-900">{stats?.successRate.toFixed(0)}%</p>
            {/* Progress Bar */}
            <div className="mt-2 w-full bg-primary-200/30 rounded-full h-1.5">
              <div
                className="bg-primary-500 h-1.5 rounded-full transition-all duration-500"
                style={{ width: `${stats?.successRate}%` }}
              ></div>
            </div>
          </div>

          {/* Skill Level */}
          <div className="p-4 rounded-lg bg-white border border-cloud-100 hover:border-primary-300/50 hover:shadow-sm transition-all duration-300">
            <div className="flex items-start justify-between mb-3">
              <Target className="w-5 h-5 text-orange-500 flex-shrink-0" />
              <span className="text-xs font-semibold text-orange-600">Next</span>
            </div>
            <p className="text-xs font-semibold text-cloud-500 uppercase tracking-wide mb-1">Skill Level</p>
            <p className="text-2xl font-semibold text-cloud-900">{stats?.currentSkillLevel}</p>
          </div>

          {/* Learning Streak */}
          <div className="p-4 rounded-lg bg-white border border-cloud-100 hover:border-primary-300/50 hover:shadow-sm transition-all duration-300">
            <div className="flex items-start justify-between mb-3">
              <Flame className="w-5 h-5 text-orange-500 flex-shrink-0" />
              <span className="text-xs font-semibold text-orange-600">🔥</span>
            </div>
            <p className="text-xs font-semibold text-cloud-500 uppercase tracking-wide mb-1">Streak</p>
            <p className="text-2xl font-bold text-cloud-900">12</p>
          </div>
        </div>
      </div>

      {/* Trending Missions */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold text-cloud-900">Trending Missions</h3>
        <p className="text-sm text-orange-600 font-semibold">Explore popular challenges</p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <MissionCard
            icon="⚙️"
            title="Compute Basics"
            description="Get started with Cloud Compute Engine"
            difficulty="beginner"
            estimatedTime="45 min"
            status="available"
            onClick={() => handleTrendingMissionClick('/mission/new?track=compute&difficulty=beginner')}
          />

          <MissionCard
            icon="💾"
            title="Storage Solutions"
            description="Master cloud storage configurations"
            difficulty="intermediate"
            estimatedTime="60 min"
            status="available"
            onClick={() => handleTrendingMissionClick('/mission/new?track=storage&difficulty=intermediate')}
          />

          <MissionCard
            icon="🌐"
            title="Network Design"
            description="Build scalable network architecture"
            difficulty="advanced"
            estimatedTime="90 min"
            status="available"
            onClick={() => handleTrendingMissionClick('/mission/new?track=networking&difficulty=advanced')}
          />

          <MissionCard
            icon="🔒"
            title="Security Best Practices"
            description="Learn cloud security implementation"
            difficulty="intermediate"
            estimatedTime="60 min"
            status="available"
            onClick={() => handleTrendingMissionClick('/mission/new?track=security&difficulty=intermediate')}
          />
        </div>
      </div>

      {/* Recent Activity */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold text-cloud-900">Recent Activity</h3>
        <p className="text-sm text-orange-600 font-semibold">Your mission history</p>
        <div className="space-y-3">
          {activities && activities.length > 0 ? (
            activities.map((activity) => (
              <div
                key={activity.id}
                className="p-4 rounded-lg bg-white border border-cloud-100 hover:border-primary-300/50 hover:shadow-sm transition-all duration-300"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3 flex-1">
                    <div className="mt-1">
                      {getActivityIcon(activity.icon)}
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-cloud-900">{activity.title}</p>
                      <div className="flex items-center gap-4 mt-1">
                        <p className="text-sm text-cloud-600">{activity.description}</p>
                        <p className="text-xs text-cloud-500">{activity.timestamp}</p>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => navigate('/history')}
                    className="flex items-center gap-1 px-3 py-2 rounded-lg text-primary-600 hover:bg-primary-50 transition-colors group"
                  >
                    <span className="text-sm font-semibold">Details</span>
                    <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="p-4 rounded-lg bg-white border border-cloud-100 text-center">
              <p className="text-cloud-600">No recent activities yet. Start a mission to get started!</p>
            </div>
          )}
        </div>
      </div>

      {/* Generating Modal */}
      <Modal
        isOpen={showGeneratingModal}
        onClose={() => !isGenerating && setShowGeneratingModal(false)}
        title="Generating Your Mission..."
        size="md"
      >
        <div className="text-center py-8 space-y-4">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-100 rounded-full animate-pulse">
            <span className="text-3xl">⚡</span>
          </div>
          <p className="text-cloud-700 font-medium">AI is crafting your unique mission...</p>
          <div className="space-y-2 text-sm text-cloud-600">
            <p>✓ Analyzing your skill level</p>
            <p>✓ Generating realistic scenario</p>
            <p>✓ Provisioning cloud environment</p>
          </div>
        </div>
      </Modal>
    </div>
  );
}
