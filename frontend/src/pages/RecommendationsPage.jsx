import { TrendingUp, Zap, Target } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import ProgressBar from '../components/ui/ProgressBar';
import LoadingSkeleton from '../components/ui/LoadingSkeleton';
import api from '../api/mockApi';

export default function RecommendationsPage() {
  const navigate = useNavigate();
  const [recommendations, setRecommendations] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadRecommendations = async () => {
      try {
        const data = await api.getRecommendations();
        setRecommendations(data);
      } finally {
        setLoading(false);
      }
    };

    loadRecommendations();
  }, []);

  if (loading) {
    return <LoadingSkeleton count={4} type="card" />;
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-cloud-900">Personalized Recommendations</h1>
        <p className="text-cloud-600 mt-1">
          AI-powered learning path tailored to your skills and progress
        </p>
      </div>

      {/* Current Status */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center text-2xl">
              ⭐
            </div>
            <div>
              <p className="text-sm text-cloud-600">Current Level</p>
              <p className="text-lg font-bold text-cloud-900">{recommendations?.currentLevel}</p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-success/10 rounded-lg flex items-center justify-center text-2xl">
              📈
            </div>
            <div>
              <p className="text-sm text-cloud-600">Recommended</p>
              <p className="text-lg font-bold text-cloud-900">2 challenges</p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-warning/10 rounded-lg flex items-center justify-center text-2xl">
              🎯
            </div>
            <div>
              <p className="text-sm text-cloud-600">Skill Gaps</p>
              <p className="text-lg font-bold text-cloud-900">3 areas</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Suggested Learning Path */}
      <Card>
        <h2 className="text-xl font-bold text-cloud-900 mb-6 flex items-center gap-2">
          <TrendingUp className="w-6 h-6 text-primary-600" />
          Suggested Learning Path
        </h2>
        <div className="space-y-4">
          {recommendations?.suggestedPath?.map((challenge, idx) => (
            <div
              key={challenge.id}
              className="border border-primary-200 rounded-lg p-4 hover:shadow-md transition"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center font-bold text-primary-600">
                      {idx + 1}
                    </span>
                    <Badge variant="info">{challenge.track}</Badge>
                    <Badge variant={challenge.difficulty === 'beginner' ? 'success' : challenge.difficulty === 'intermediate' ? 'warning' : 'error'}>
                      {challenge.difficulty}
                    </Badge>
                  </div>
                  <h3 className="text-lg font-bold text-cloud-900">{challenge.title}</h3>
                  <p className="text-sm text-cloud-600 mt-2">{challenge.reason}</p>
                </div>
                <Button variant="primary" onClick={() => navigate('/challenges')}>
                  Start
                </Button>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Skill Gaps */}
      <Card>
        <h2 className="text-xl font-bold text-cloud-900 mb-6 flex items-center gap-2">
          <Zap className="w-6 h-6 text-warning" />
          Skill Gaps & Development Areas
        </h2>
        <div className="space-y-6">
          {recommendations?.skillGaps?.map((gap) => (
            <div key={gap.skill}>
              <div className="flex items-center justify-between mb-3">
                <span className="font-medium text-cloud-900">{gap.skill}</span>
                <Badge
                  variant={
                    gap.gap === 'High'
                      ? 'error'
                      : gap.gap === 'Medium'
                        ? 'warning'
                        : 'success'
                  }
                >
                  {gap.gap} Gap
                </Badge>
              </div>
              <p className="text-sm text-cloud-600 mb-3">{gap.suggestion}</p>
              <Button variant="secondary" size="sm" className="w-full">
                Explore Resources
              </Button>
            </div>
          ))}
        </div>
      </Card>

      {/* Learning Insights */}
      <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200">
        <h2 className="text-xl font-bold text-blue-900 mb-4 flex items-center gap-2">
          <Target className="w-6 h-6" />
          Learning Insights
        </h2>
        <ul className="space-y-3">
          {recommendations?.insights?.map((insight, idx) => (
            <li key={idx} className="flex items-start gap-3 text-blue-800">
              <span className="text-blue-600 font-bold mt-1">💡</span>
              <span>{insight}</span>
            </li>
          ))}
        </ul>
      </Card>

      {/* Next Steps */}
      <Card>
        <h2 className="text-xl font-bold text-cloud-900 mb-4">Recommended Next Steps</h2>
        <ol className="space-y-3">
          <li className="flex items-start gap-3">
            <span className="flex-shrink-0 w-6 h-6 bg-primary-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
              1
            </span>
            <span className="text-cloud-700">
              Start with <strong>{recommendations?.suggestedPath?.[0]?.title}</strong> to reinforce
              your networking foundation
            </span>
          </li>
          <li className="flex items-start gap-3">
            <span className="flex-shrink-0 w-6 h-6 bg-primary-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
              2
            </span>
            <span className="text-cloud-700">
              Focus on <strong>Kubernetes</strong> skills through specialized training
            </span>
          </li>
          <li className="flex items-start gap-3">
            <span className="flex-shrink-0 w-6 h-6 bg-primary-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
              3
            </span>
            <span className="text-cloud-700">
              Complete advanced architecture challenges to become a cloud architect
            </span>
          </li>
        </ol>
      </Card>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-4">
        <Button
          variant="primary"
          size="lg"
          onClick={() => navigate('/challenges')}
          className="flex-1"
        >
          Start Recommended Challenge
        </Button>
        <Button
          variant="secondary"
          size="lg"
          onClick={() => navigate('/progress')}
          className="flex-1"
        >
          View Full Progress
        </Button>
      </div>
    </div>
  );
}
