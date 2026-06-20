import { Clock, CheckCircle, AlertCircle } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import ProgressBar from '../components/ui/ProgressBar';
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

  const difficultyColors = {
    beginner: 'bg-green-100 text-green-700',
    intermediate: 'bg-yellow-100 text-yellow-700',
    advanced: 'bg-red-100 text-red-700',
  };

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
            <p className="text-white/90 mt-2">{mission?.businessScenario}</p>
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
          {/* Objectives */}
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

          {/* Success Criteria */}
          <Card>
            <h2 className="text-xl font-bold text-cloud-900 mb-4">Success Criteria</h2>
            <ul className="space-y-2">
              {mission?.successCriteria.map((criteria, idx) => (
                <li key={idx} className="flex items-start gap-3 text-cloud-700">
                  <CheckCircle className="w-5 h-5 text-success flex-shrink-0 mt-0.5" />
                  <span>{criteria}</span>
                </li>
              ))}
            </ul>
          </Card>

          {/* Requirements */}
          <Card>
            <h2 className="text-xl font-bold text-cloud-900 mb-4">Mission Information</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-cloud-600">Track</p>
                <p className="font-bold text-cloud-900">{mission?.track}</p>
              </div>
              <div>
                <p className="text-sm text-cloud-600">Difficulty</p>
                <p className="font-bold text-cloud-900 capitalize">{mission?.difficulty}</p>
              </div>
              <div>
                <p className="text-sm text-cloud-600">Estimated Time</p>
                <p className="font-bold text-cloud-900">{mission?.estimatedTime}</p>
              </div>
              <div>
                <p className="text-sm text-cloud-600">Created</p>
                <p className="font-bold text-cloud-900">{mission?.createdAt}</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Sidebar - Challenge Stats */}
        <div className="space-y-6">
          {/* Quick Stats */}
          <Card>
            <h3 className="font-bold text-cloud-900 mb-4">Challenge Details</h3>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-cloud-600 mb-2">Difficulty Level</p>
                <Badge variant={mission?.difficulty}>
                  {mission?.difficulty.charAt(0).toUpperCase() + mission?.difficulty.slice(1)}
                </Badge>
              </div>
              <div>
                <p className="text-sm text-cloud-600 mb-2">Time Limit</p>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-primary-600" />
                  <span className="font-bold text-cloud-900">{mission?.timeLimit} minutes</span>
                </div>
              </div>
              <div>
                <p className="text-sm text-cloud-600 mb-2">Total Tasks</p>
                <p className="font-bold text-cloud-900 text-lg">{mission?.tasks?.length}</p>
              </div>
            </div>
          </Card>

          {/* Task Checklist */}
          <Card>
            <h3 className="font-bold text-cloud-900 mb-4">Task Checklist</h3>
            <div className="space-y-2">
              {mission?.tasks?.map((task) => (
                <div key={task.id} className="flex items-start gap-3 p-2">
                  <div
                    className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 mt-0.5 ${
                      task.completed
                        ? 'bg-success border-success text-white'
                        : 'border-cloud-300'
                    }`}
                  >
                    {task.completed && '✓'}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-cloud-900">{task.title}</p>
                    <p className="text-xs text-cloud-600 mt-1">{task.description}</p>
                  </div>
                </div>
              ))}
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
            <Button variant="secondary" size="md" onClick={() => navigate('/challenges')} className="w-full">
              Back to Challenges
            </Button>
          </div>

          {/* Info Box */}
          <Card className="bg-blue-50 border border-blue-200">
            <p className="text-sm text-blue-800">
              <strong>Tip:</strong> Take your time to understand the business scenario and
              objectives. A temporary Google Cloud environment will be provisioned for you.
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
}
