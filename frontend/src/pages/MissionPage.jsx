import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Clock, Cpu, Database, Wifi, Lock, Rocket, Layout } from 'lucide-react';
import Button from '../components/ui/Button';
import api from '../api/mockApi';

const trackIcons = {
  compute: <Cpu className="w-5 h-5 text-orange-500 flex-shrink-0" />,
  storage: <Database className="w-5 h-5 text-orange-500 flex-shrink-0" />,
  networking: <Wifi className="w-5 h-5 text-orange-500 flex-shrink-0" />,
  security: <Lock className="w-5 h-5 text-orange-500 flex-shrink-0" />,
  devops: <Rocket className="w-5 h-5 text-orange-500 flex-shrink-0" />,
  architecture: <Layout className="w-5 h-5 text-orange-500 flex-shrink-0" />,
};

const difficultyIcons = {
  beginner: '🌱',
  intermediate: '📚',
  advanced: '🚀',
};

export default function MissionPage() {
  const navigate = useNavigate();
  const [mission, setMission] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadMission = async () => {
      try {
        const data = await api.getMissionDetails('3');
        setMission(data);
      } finally {
        setLoading(false);
      }
    };

    loadMission();
  }, []);

  if (loading) return <div>Loading mission...</div>;

  return (
    <div className="space-y-8">
      {/* Mission Brief Card */}
      <div className="rounded-2xl border-2 border-cloud-200 bg-gradient-to-br from-white to-cloud-50 p-6 md:p-8 shadow-md hover:shadow-lg transition-shadow">
        {/* Header with metadata */}
        <div className="flex items-start justify-between mb-4 pb-4 border-b border-cloud-100">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <span className="text-orange-600 text-2xl">📋</span>
              <h2 className="text-xl font-bold text-cloud-900">Mission Brief</h2>
            </div>
            <div className="flex items-center gap-4 mt-3">
              <div className="flex items-center gap-2 px-3 py-1 rounded-lg bg-primary-100">
                {trackIcons[mission?.track] || <span className="text-sm text-primary-700">Track</span>}
                <span className="text-xs font-semibold text-primary-700">
                  {mission?.track ? mission.track.charAt(0).toUpperCase() + mission.track.slice(1) : 'Learning Track'}
                </span>
              </div>
              <div className="flex items-center gap-2 px-3 py-1 rounded-lg bg-amber-100">
                <span className="text-lg">{difficultyIcons[mission?.difficulty] || '📚'}</span>
                <span className="text-xs font-semibold text-amber-700">
                  {mission?.difficulty ? mission.difficulty.charAt(0).toUpperCase() + mission.difficulty.slice(1) : 'Intermediate'}
                </span>
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className="flex items-center gap-2 text-cloud-600 mb-1">
              <Clock className="w-5 h-5 text-orange-500 flex-shrink-0" />
              <span className="text-sm font-semibold">Time Limit</span>
            </div>
            <p className="text-2xl font-bold text-cloud-900">{mission?.timeLimit || '90 min'}</p>
          </div>
        </div>

        {/* Brief content */}
        <p className="text-base text-cloud-700 leading-relaxed">{mission?.businessScenario}</p>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">

          {/* Mission Objectives */}
          <div className="rounded-lg border border-cloud-200 p-6 md:p-8">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-orange-600">✨</span>
              <h2 className="text-lg font-bold text-cloud-900">Mission Objectives</h2>
            </div>
            <ul className="space-y-3">
              {mission?.objectives.map((obj, idx) => (
                <li key={idx} className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-6 h-6 bg-primary-100 rounded-full flex items-center justify-center text-sm font-semibold text-primary-600">
                    {idx + 1}
                  </span>
                  <span className="text-cloud-600 pt-0.5">{obj}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Right Sidebar - Action Buttons */}
        <div className="flex flex-col items-center justify-center space-y-3 min-h-48">
          <Button
            variant="primary"
            size="lg"
            onClick={() => navigate('/workspace/3')}
            className="w-full max-w-xs"
          >
            Start Challenge
          </Button>
          <Button
            variant="secondary"
            size="lg"
            onClick={() => navigate('/challenges')}
            className="w-full max-w-xs"
          >
            Back to Challenges
          </Button>
        </div>
      </div>
    </div>
  );
}
