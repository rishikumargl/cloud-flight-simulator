import { Clock, CheckCircle, RefreshCw, Radio, Target, Cloud } from 'lucide-react';
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
        setTimeLeft(progressData.timeRemaining * 60);
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

  if (loading) return <div>Loading mission control center...</div>;

  const completedTasks = mission?.tasks?.filter((t) => t.completed).length || 0;
  const totalTasks = mission?.tasks?.length || 0;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Mission Control Header */}
      <div className="bg-gradient-to-r from-primary-600 to-sky-500 rounded-2xl shadow-lg p-8 text-white">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          {/* Mission Title */}
          <div className="md:col-span-2">
            <div className="flex items-center gap-3 mb-2">
              <Radio className="w-5 h-5 animate-pulse" />
              <p className="text-sm font-semibold text-primary-100 uppercase tracking-wide">Mission Active</p>
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">{mission?.title}</h1>
            <p className="text-primary-100">Complete all objectives to succeed in this mission</p>
          </div>

          {/* Mission Timer */}
          <div className="flex items-center gap-4 bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
            <div>
              <p className="text-xs font-semibold text-primary-100 uppercase tracking-wide mb-2">Time Remaining</p>
              <div className={`flex items-center gap-2 font-bold text-2xl font-mono ${
                timeLeft < 600 ? 'text-red-300 animate-pulse' : 'text-white'
              }`}>
                <Clock className="w-6 h-6" />
                {formatTime(timeLeft)}
              </div>
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-semibold text-primary-100">Mission Progress</p>
            <p className="text-sm font-bold text-white">{completedTasks}/{totalTasks} tasks</p>
          </div>
          <ProgressBar progress={(completedTasks / totalTasks) * 100} variant="primary" size="md" />
        </div>
      </div>

      {/* Mission Control Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left Panel - Task Checklist */}
        <div className="lg:col-span-1 space-y-4">
          <Card>
            <div className="flex items-center gap-2 mb-4">
              <Target className="w-5 h-5 text-primary-600" />
              <h3 className="font-bold text-cloud-900">Mission Tasks</h3>
            </div>
            <div className="space-y-3">
              {mission?.tasks?.map((task) => (
                <div
                  key={task.id}
                  className={`group p-3 rounded-lg border-2 transition-all ${
                    task.completed
                      ? 'border-accent-200 bg-accent-50'
                      : 'border-cloud-200 hover:border-primary-300 bg-white hover:bg-primary-50'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`flex-shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center text-xs font-bold mt-0.5 transition-all ${
                        task.completed
                          ? 'bg-accent-500 border-accent-500 text-white'
                          : 'border-cloud-300 group-hover:border-primary-500'
                      }`}
                    >
                      {task.completed && '✓'}
                    </div>
                    <p className={`text-xs font-medium ${task.completed ? 'text-accent-700 line-through' : 'text-cloud-900'}`}>
                      {task.title}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Current Step */}
          <Card className="bg-gradient-to-br from-primary-50 to-sky-50 border-primary-200">
            <p className="text-xs font-semibold text-primary-600 uppercase tracking-wide mb-2">Current Step</p>
            <p className="text-sm font-bold text-cloud-900 mb-3">{progress?.currentStep}</p>
            <Badge variant="primary" size="sm" className="w-full justify-center">
              In Progress
            </Badge>
          </Card>
        </div>

        {/* Center Panel - Mission Overview & Activity */}
        <div className="lg:col-span-2 space-y-6">
          {/* Mission Briefing */}
          <Card>
            <div className="flex items-center gap-2 mb-4">
              <Radio className="w-5 h-5 text-primary-600 animate-pulse" />
              <h2 className="text-lg font-bold text-cloud-900">Mission Briefing</h2>
            </div>
            <div className="space-y-4">
              <div>
                <p className="text-xs font-semibold text-cloud-500 uppercase tracking-wide mb-2">Business Context</p>
                <p className="text-sm text-cloud-700 leading-relaxed">{mission?.businessScenario}</p>
              </div>
              <div className="border-t border-cloud-200 pt-4">
                <p className="text-xs font-semibold text-cloud-500 uppercase tracking-wide mb-3">Key Objectives</p>
                <ul className="space-y-2">
                  {mission?.objectives?.map((obj, idx) => (
                    <li key={idx} className="flex gap-3">
                      <span className="text-primary-600 font-bold flex-shrink-0">{idx + 1}.</span>
                      <span className="text-sm text-cloud-700">{obj}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </Card>

          {/* Activity Feed */}
          <Card>
            <div className="flex items-center gap-2 mb-4">
              <RefreshCw className="w-5 h-5 text-primary-600" />
              <h2 className="text-lg font-bold text-cloud-900">Activity Feed</h2>
            </div>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {progress?.activityLog?.map((log, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-lg border border-cloud-200 bg-cloud-50 hover:bg-cloud-100 transition-colors"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-mono text-cloud-500">{log.time}</p>
                      <p
                        className={`text-sm font-medium mt-1 ${
                          log.status === 'success' ? 'text-accent-700' : 'text-amber-700'
                        }`}
                      >
                        {log.action}
                      </p>
                    </div>
                    <div
                      className={`flex-shrink-0 w-2 h-2 rounded-full mt-1 ${
                        log.status === 'success' ? 'bg-accent-500' : 'bg-amber-500'
                      }`}
                    />
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Right Panel - Environment & Resources */}
        <div className="lg:col-span-1 space-y-4">
          {/* Environment Status */}
          <Card>
            <div className="flex items-center gap-2 mb-4">
              <Cloud className="w-5 h-5 text-primary-600" />
              <h3 className="font-bold text-cloud-900">Cloud Environment</h3>
            </div>
            <div className="space-y-3">
              <div className="p-3 rounded-lg bg-accent-50 border border-accent-200">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-xs font-medium text-accent-700">Cloud Environment</p>
                  <div className="w-2 h-2 bg-accent-500 rounded-full animate-pulse"></div>
                </div>
                <p className="text-xs text-accent-600">Active & Ready</p>
              </div>
              <div className="p-3 rounded-lg bg-accent-50 border border-accent-200">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-xs font-medium text-accent-700">Network Access</p>
                  <div className="w-2 h-2 bg-accent-500 rounded-full animate-pulse"></div>
                </div>
                <p className="text-xs text-accent-600">Connected</p>
              </div>
              <div className="p-3 rounded-lg bg-amber-50 border border-amber-200">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-xs font-medium text-amber-700">Resource Usage</p>
                  <p className="text-xs font-bold text-amber-700">75%</p>
                </div>
                <ProgressBar progress={75} variant="warning" size="sm" />
              </div>
            </div>
          </Card>

          {/* Created Resources */}
          {progress?.resourcesCreated && progress.resourcesCreated.length > 0 && (
            <Card>
              <h3 className="font-bold text-cloud-900 mb-4 text-sm">Created Resources</h3>
              <div className="space-y-2">
                {progress.resourcesCreated.map((res, idx) => (
                  <div key={idx} className="p-3 rounded-lg border border-primary-200 bg-primary-50">
                    <p className="text-xs font-bold text-cloud-900">{res.type}</p>
                    <p className="text-xs text-cloud-600 mt-1">{res.name}</p>
                    <Badge variant="success" size="sm" className="mt-2">
                      {res.status}
                    </Badge>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Submit Button */}
          <Button
            variant="primary"
            size="lg"
            onClick={() => navigate('/results/3')}
            className="w-full"
          >
            <CheckCircle className="w-5 h-5" />
            Submit & Evaluate
          </Button>
        </div>
      </div>
    </div>
  );
}
