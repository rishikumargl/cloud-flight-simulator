import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import api from '../api/mockApi';

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
    <div className="space-y-6">
      {/* Mission Header */}
      <Card className="bg-gradient-to-r from-primary-500 to-sky-500 text-white border-0">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="primary" className="bg-white/20 text-white">
                {mission?.track.toUpperCase()}
              </Badge>
              <Badge variant="primary" className={`bg-white/20 text-white`}>
                {mission?.difficulty.toUpperCase()}
              </Badge>
            </div>
            <h1 className="text-3xl font-bold">{mission?.title}</h1>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-white/75 text-sm">Time Limit</p>
              <p className="text-2xl font-bold">{mission?.timeLimit} min</p>
            </div>
          </div>
        </div>
      </Card>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Problem Statement */}
          <Card>
            <h2 className="text-xl font-bold text-cloud-900 mb-4">Problem Statement</h2>
            <p className="text-cloud-700 leading-relaxed">{mission?.businessScenario}</p>
          </Card>

          {/* Mission Objectives */}
          <Card>
            <h2 className="text-xl font-bold text-cloud-900 mb-4">Mission Objectives</h2>
            <ul className="space-y-3">
              {mission?.objectives.map((obj, idx) => (
                <li key={idx} className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-6 h-6 bg-primary-100 rounded-full flex items-center justify-center text-sm font-bold text-primary-600">
                    {idx + 1}
                  </span>
                  <span className="text-cloud-700 pt-0.5">{obj}</span>
                </li>
              ))}
            </ul>
          </Card>
        </div>

        {/* Right Sidebar */}
        <div className="space-y-6">
          {/* Challenge Info Card */}
          <Card>
            <h3 className="font-bold text-cloud-900 mb-4">Challenge Info</h3>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-cloud-600 mb-2">Domain</p>
                <Badge variant="primary">
                  {mission?.track}
                </Badge>
              </div>
              <div>
                <p className="text-sm text-cloud-600 mb-2">Difficulty</p>
                <Badge variant={mission?.difficulty}>
                  {mission?.difficulty.charAt(0).toUpperCase() + mission?.difficulty.slice(1)}
                </Badge>
              </div>
              <div>
                <p className="text-sm text-cloud-600 mb-2">Time Limit</p>
                <p className="font-bold text-cloud-900">{mission?.timeLimit} minutes</p>
              </div>
            </div>
          </Card>

          {/* Action Buttons */}
          <div className="space-y-3">
            <Button
              variant="primary"
              size="lg"
              onClick={() => navigate('/workspace/3')}
              className="w-full"
            >
              Start Mission
            </Button>
            <Button
              variant="secondary"
              size="lg"
              onClick={() => navigate('/challenges')}
              className="w-full"
            >
              Back to Challenges
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
