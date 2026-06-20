import { CheckCircle, AlertCircle, TrendingUp } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import ProgressBar from '../components/ui/ProgressBar';
import api from '../api/mockApi';

export default function ResultsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadResults = async () => {
      try {
        const data = await api.getEvaluationResults(id);
        setResults(data);
      } finally {
        setLoading(false);
      }
    };

    loadResults();
  }, [id]);

  if (loading) return <div>Loading results...</div>;

  const isPass = results?.outcome === 'Pass';

  return (
    <div className="space-y-6">
      {/* Results Header */}
      <div
        className={`rounded-xl p-8 text-center text-white ${
          isPass ? 'bg-gradient-to-r from-success to-green-500' : 'bg-gradient-to-r from-warning to-orange-500'
        }`}
      >
        <div className="flex justify-center mb-4">
          {isPass ? (
            <div className="w-20 h-20 rounded-full bg-white/20 flex items-center justify-center">
              <CheckCircle className="w-12 h-12" />
            </div>
          ) : (
            <div className="w-20 h-20 rounded-full bg-white/20 flex items-center justify-center">
              <AlertCircle className="w-12 h-12" />
            </div>
          )}
        </div>
        <h1 className="text-4xl font-bold mb-2">
          {isPass ? 'Challenge Completed!' : 'Challenge Failed'}
        </h1>
        <p className="text-lg opacity-90">{results?.missionTitle}</p>
      </div>

      {/* Score & Summary Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="text-center">
          <p className="text-cloud-600 text-sm font-medium">Overall Score</p>
          <p className="text-4xl font-bold text-primary-600 mt-2">{results?.overallScore}</p>
          <p className="text-cloud-600 text-xs mt-1">out of 100</p>
        </Card>

        <Card className="text-center">
          <p className="text-cloud-600 text-sm font-medium">Completion Time</p>
          <p className="text-xl font-bold text-cloud-900 mt-2">{results?.completionTime}</p>
        </Card>

        <Card className="text-center">
          <p className="text-cloud-600 text-sm font-medium">Resources Created</p>
          <p className="text-3xl font-bold text-cloud-900 mt-2">{results?.resources?.created}</p>
        </Card>

        <Card className="text-center">
          <p className="text-cloud-600 text-sm font-medium">Tasks Completed</p>
          <p className="text-3xl font-bold text-cloud-900 mt-2">
            {results?.tasksCompleted}/{results?.tasksTotal}
          </p>
        </Card>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Detailed Evaluation */}
          <Card>
            <h2 className="text-xl font-bold text-cloud-900 mb-6">Evaluation Summary</h2>

            {/* Strengths */}
            <div className="mb-6">
              <h3 className="font-bold text-cloud-900 mb-3 flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-success" />
                Strengths
              </h3>
              <ul className="space-y-2">
                {results?.evaluation?.strengths.map((strength, idx) => (
                  <li key={idx} className="flex items-start gap-3 text-cloud-700">
                    <span className="text-success mt-1">✓</span>
                    <span>{strength}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Mistakes */}
            {results?.evaluation?.mistakes?.length > 0 && (
              <div className="mb-6">
                <h3 className="font-bold text-cloud-900 mb-3 flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-warning" />
                  Mistakes Identified
                </h3>
                <ul className="space-y-2">
                  {results?.evaluation?.mistakes.map((mistake, idx) => (
                    <li key={idx} className="flex items-start gap-3 text-cloud-700 bg-warning/5 p-3 rounded-lg">
                      <span className="text-warning mt-1">⚠</span>
                      <span>{mistake}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Improvements */}
            <div>
              <h3 className="font-bold text-cloud-900 mb-3 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-info" />
                Areas for Improvement
              </h3>
              <ul className="space-y-2">
                {results?.evaluation?.improvements.map((improvement, idx) => (
                  <li key={idx} className="flex items-start gap-3 text-cloud-700 bg-info/5 p-3 rounded-lg">
                    <span className="text-info mt-1">💡</span>
                    <span>{improvement}</span>
                  </li>
                ))}
              </ul>
            </div>
          </Card>

          {/* AI Feedback */}
          <Card className="bg-blue-50 border border-blue-200">
            <h3 className="font-bold text-blue-900 mb-2">AI Feedback</h3>
            <p className="text-blue-800">{results?.feedback}</p>
          </Card>
        </div>

        {/* Right Sidebar */}
        <div className="space-y-6">
          {/* Resource Breakdown */}
          <Card>
            <h3 className="font-bold text-cloud-900 mb-4">Resource Breakdown</h3>
            <div className="space-y-3">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-cloud-700">Created</span>
                  <span className="font-bold text-cloud-900">{results?.resources?.created}</span>
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-cloud-700">Configured</span>
                  <span className="font-bold text-cloud-900">{results?.resources?.configured}</span>
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-cloud-700">Issues Found</span>
                  <span className="font-bold text-red-600">{results?.resources?.issues}</span>
                </div>
              </div>
            </div>
          </Card>

          {/* Score Breakdown */}
          <Card>
            <h3 className="font-bold text-cloud-900 mb-4">Score Breakdown</h3>
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-cloud-700">Correctness</span>
                  <span className="text-sm font-bold">85%</span>
                </div>
                <ProgressBar progress={85} size="sm" />
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-cloud-700">Completeness</span>
                  <span className="text-sm font-bold">95%</span>
                </div>
                <ProgressBar progress={95} size="sm" />
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-cloud-700">Best Practices</span>
                  <span className="text-sm font-bold">90%</span>
                </div>
                <ProgressBar progress={90} size="sm" />
              </div>
            </div>
          </Card>

          {/* Action Buttons */}
          <div className="space-y-3">
            <Button
              variant="primary"
              size="lg"
              onClick={() => navigate('/recommendations')}
              className="w-full"
            >
              View Recommendations
            </Button>
            <Button
              variant="secondary"
              size="lg"
              onClick={() => navigate('/challenges')}
              className="w-full"
            >
              Next Challenge
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
