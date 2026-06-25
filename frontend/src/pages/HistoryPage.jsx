import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Cpu, Database, Wifi, Lock, Rocket, Layout } from 'lucide-react';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import LoadingSkeleton from '../components/ui/LoadingSkeleton';
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

export default function HistoryPage() {
  const navigate = useNavigate();
  const [history, setHistory] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadHistory = async () => {
      try {
        const data = await api.getMissionHistory();
        setHistory(data);
      } finally {
        setLoading(false);
      }
    };

    loadHistory();
  }, []);

  if (loading) {
    return <LoadingSkeleton count={5} type="row" />;
  }

  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case 'beginner':
        return 'bg-green-100 text-green-700';
      case 'intermediate':
        return 'bg-yellow-100 text-yellow-700';
      case 'advanced':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-cloud-100 text-cloud-700';
    }
  };

  const getScoreColor = (score) => {
    if (score >= 90) return 'text-success';
    if (score >= 80) return 'text-info';
    if (score >= 70) return 'text-warning';
    return 'text-error';
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="space-y-3">
        <h1 className="text-3xl md:text-4xl font-bold text-cloud-900">Mission History</h1>
        <p className="text-orange-600 font-semibold text-base">Review your completed challenges</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <p className="text-xs font-semibold text-cloud-500 uppercase tracking-wide">Total Challenges</p>
          <p className="text-3xl font-semibold text-cloud-900 mt-2">{history?.length || 0}</p>
        </Card>
        <Card>
          <p className="text-xs font-semibold text-cloud-500 uppercase tracking-wide">Average Score</p>
          <p className="text-3xl font-semibold text-cloud-900 mt-2">
            {history ? Math.round(history.reduce((sum, h) => sum + h.score, 0) / history.length) : 0}
          </p>
        </Card>
        <Card>
          <p className="text-xs font-semibold text-cloud-500 uppercase tracking-wide">Completion Rate</p>
          <p className="text-3xl font-semibold text-cloud-900 mt-2">100%</p>
        </Card>
        <Card>
          <p className="text-xs font-semibold text-cloud-500 uppercase tracking-wide">Total Hours</p>
          <p className="text-3xl font-semibold text-cloud-900 mt-2">
            {history ? (history.length * 1.5).toFixed(1) : 0}
          </p>
        </Card>
      </div>

      {/* Mission History Table */}
      <Card>
        <h2 className="text-2xl font-bold text-cloud-900 mb-6">All Missions</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b-2 border-cloud-200">
                <th className="text-left py-4 px-4 font-bold text-cloud-900">Mission</th>
                <th className="text-center py-4 px-4 font-bold text-cloud-900">Track</th>
                <th className="text-center py-4 px-4 font-bold text-cloud-900">Difficulty</th>
                <th className="text-center py-4 px-4 font-bold text-cloud-900">Score</th>
                <th className="text-center py-4 px-4 font-bold text-cloud-900">Date</th>
                <th className="text-center py-4 px-4 font-bold text-cloud-900">Action</th>
              </tr>
            </thead>
            <tbody>
              {history?.map((mission) => (
                <tr key={mission.id} className="border-b border-cloud-100 hover:bg-cloud-50 transition">
                  <td className="py-4 px-4">
                    <div>
                      <p className="font-medium text-cloud-900">{mission.title}</p>
                      <div className="flex items-center gap-1 text-sm text-cloud-600 mt-1">
                        <span>{difficultyIcons[mission.difficulty]}</span>
                        <span>{mission.difficulty.charAt(0).toUpperCase() + mission.difficulty.slice(1)}</span>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-4 text-center">
                    <div className="flex items-center justify-center gap-2">
                      {trackIcons[mission.track]}
                      <span className="text-sm font-medium text-cloud-900">
                        {mission.track.charAt(0).toUpperCase() + mission.track.slice(1)}
                      </span>
                    </div>
                  </td>
                  <td className="py-4 px-4 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <span className="text-lg">{difficultyIcons[mission.difficulty]}</span>
                      <span className="text-sm font-medium text-cloud-900">
                        {mission.difficulty.charAt(0).toUpperCase() + mission.difficulty.slice(1)}
                      </span>
                    </div>
                  </td>
                  <td className={`py-4 px-4 text-center font-bold text-lg ${getScoreColor(mission.score)}`}>
                    {mission.score}
                  </td>
                  <td className="py-4 px-4 text-center text-cloud-600">
                    {new Date(mission.completionDate).toLocaleDateString()}
                  </td>
                  <td className="py-4 px-4 text-center">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => navigate(`/results/${mission.id}`)}
                    >
                      View Details
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Performance by Track */}
      <Card>
        <h2 className="text-2xl font-bold text-cloud-900 mb-6">Performance by Track</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {['Compute', 'Storage', 'Networking', 'Security'].map((track) => {
            const trackMissions = history?.filter(
              (h) => h.track.toLowerCase() === track.toLowerCase()
            ) || [];
            const avgScore =
              trackMissions.length > 0
                ? Math.round(trackMissions.reduce((sum, h) => sum + h.score, 0) / trackMissions.length)
                : 0;

            return (
              <div key={track} className="p-4 border border-cloud-200 rounded-lg">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-cloud-900">{track}</h3>
                  <Badge variant="primary">{trackMissions.length} completed</Badge>
                </div>
                <p className="text-xs text-orange-600 font-semibold mb-3">Your performance</p>
                <div className="flex items-center justify-between">
                  <p className="text-sm text-cloud-700">Avg Score</p>
                  <p className="text-2xl font-semibold text-cloud-900">{avgScore}%</p>
                </div>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}
