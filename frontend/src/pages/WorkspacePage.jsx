import { Clock, CheckCircle, AlertCircle, RefreshCw } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import ProgressBar from '../components/ui/ProgressBar';
import api from '../api/mockApi';

export default function WorkspacePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [mission, setMission] = useState(null);
  const [progress, setProgress] = useState(null);
  const [timeLeft, setTimeLeft] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [missionData, progressData] = await Promise.all([
          api.getMissionDetails(id),
          api.getMissionProgress(id),
        ]);
        setMission(missionData);
        setProgress(progressData);
        setTimeLeft(progressData.timeRemaining * 60); // convert to seconds
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [id]);

  useEffect(() => {
    if (!timeLeft) return;

    const timer = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 0) {
          clearInterval(timer);
          return 0;
        }
        return t - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft]);

  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours}h ${mins}m ${secs}s`;
  };

  if (loading) return <div>Loading workspace...</div>;

  return (
    <div className="space-y-6">
      {/* Header with Timer */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white p-4 rounded-xl border border-cloud-100">
        <div>
          <h1 className="text-2xl font-bold text-cloud-900">{mission?.title}</h1>
          <p className="text-cloud-600 mt-1">Complete the tasks within the time limit</p>
        </div>
        <div className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold ${
          timeLeft < 600 ? 'bg-red-100 text-red-700' : 'bg-primary-100 text-primary-700'
        }`}>
          <Clock className="w-5 h-5" />
          <span className="font-mono text-lg">{formatTime(timeLeft)}</span>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left Sidebar - Tasks & Progress */}
        <div className="lg:col-span-1 space-y-4">
          <Card>
            <h3 className="font-bold text-cloud-900 mb-4">Progress</h3>
            <ProgressBar progress={progress?.taskCompletion || 0} size="lg" />
            <p className="text-sm text-cloud-600 mt-3">
              {mission?.tasks?.filter((t) => t.completed).length} of {mission?.tasks?.length} tasks completed
            </p>
          </Card>

          <Card>
            <h3 className="font-bold text-cloud-900 mb-4">Current Task</h3>
            <div className="bg-primary-50 p-3 rounded-lg">
              <p className="text-sm font-medium text-primary-700">{progress?.currentStep}</p>
            </div>
          </Card>

          <Card>
            <h3 className="font-bold text-cloud-900 mb-4">Tasks</h3>
            <div className="space-y-2">
              {mission?.tasks?.map((task) => (
                <div key={task.id} className="flex items-start gap-2 p-2">
                  <div
                    className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 mt-0.5 ${
                      task.completed
                        ? 'bg-success border-success text-white'
                        : 'border-cloud-300'
                    }`}
                  >
                    {task.completed && '✓'}
                  </div>
                  <div>
                    <p className="text-xs font-medium text-cloud-900">{task.title}</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Center - Main Workspace */}
        <div className="lg:col-span-2 space-y-6">
          {/* Mission Overview */}
          <Card>
            <h2 className="text-xl font-bold text-cloud-900 mb-4">Mission Overview</h2>
            <div className="prose prose-sm max-w-none">
              <p className="text-cloud-700">{mission?.businessScenario}</p>
              <h3 className="font-bold text-cloud-900 mt-4">Objectives:</h3>
              <ul className="list-disc pl-5 space-y-1 text-cloud-700">
                {mission?.objectives.map((obj, idx) => (
                  <li key={idx}>{obj}</li>
                ))}
              </ul>
            </div>
          </Card>

          {/* Console/Activity */}
          <Card>
            <h2 className="text-xl font-bold text-cloud-900 mb-4">Activity Log</h2>
            <div className="bg-cloud-900 text-cloud-50 p-4 rounded-lg font-mono text-sm max-h-96 overflow-y-auto space-y-2">
              {progress?.activityLog?.map((log, idx) => (
                <div key={idx} className="flex items-start gap-2">
                  <span className="text-primary-400 flex-shrink-0">{log.time}</span>
                  <span className={log.status === 'success' ? 'text-success' : 'text-warning'}>
                    {log.action}
                  </span>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Right Sidebar - Resources */}
        <div className="lg:col-span-1 space-y-4">
          <Card>
            <h3 className="font-bold text-cloud-900 mb-4">Environment Status</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-2 bg-green-50 rounded">
                <span className="text-sm text-green-700">Cloud Environment</span>
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              </div>
              <div className="flex items-center justify-between p-2 bg-green-50 rounded">
                <span className="text-sm text-green-700">Network Access</span>
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              </div>
              <div className="flex items-center justify-between p-2 bg-yellow-50 rounded">
                <span className="text-sm text-yellow-700">Resource Quota</span>
                <span className="text-xs font-bold text-yellow-700">75%</span>
              </div>
            </div>
          </Card>

          <Card>
            <h3 className="font-bold text-cloud-900 mb-4">Created Resources</h3>
            <div className="space-y-2">
              {progress?.resourcesCreated?.map((res, idx) => (
                <div key={idx} className="p-2 bg-cloud-50 rounded border border-cloud-200">
                  <p className="text-xs font-bold text-cloud-900">{res.type}</p>
                  <p className="text-xs text-cloud-600">{res.name}</p>
                  <Badge variant="success" className="text-xs mt-2">
                    {res.status}
                  </Badge>
                </div>
              ))}
            </div>
          </Card>

          <Card>
            <h3 className="font-bold text-cloud-900 mb-4">Quick Actions</h3>
            <div className="space-y-2">
              <Button variant="secondary" size="sm" className="w-full">
                <RefreshCw className="w-4 h-4" />
                Refresh Status
              </Button>
              <Button
                variant="danger"
                size="sm"
                onClick={() => navigate('/results/3')}
                className="w-full"
              >
                Submit & Evaluate
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
