import { useEffect, useState } from 'react';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import LoadingSkeleton from '../components/ui/LoadingSkeleton';
import { Users, TrendingUp, Target } from 'lucide-react';

export default function AdminLearnersPage() {
  const [learners, setLearners] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      // Simulate API call
      await new Promise((r) => setTimeout(r, 500));
      setLearners([
        { id: 1, name: 'Alex Johnson', email: 'alex@example.com', status: 'active', level: 'Intermediate', completedChallenges: 8, successRate: 92 },
        { id: 2, name: 'Sarah Smith', email: 'sarah@example.com', status: 'active', level: 'Advanced', completedChallenges: 15, successRate: 88 },
        { id: 3, name: 'Mike Chen', email: 'mike@example.com', status: 'inactive', level: 'Beginner', completedChallenges: 3, successRate: 75 },
        { id: 4, name: 'Emily Davis', email: 'emily@example.com', status: 'active', level: 'Intermediate', completedChallenges: 12, successRate: 94 },
        { id: 5, name: 'John Wilson', email: 'john@example.com', status: 'active', level: 'Beginner', completedChallenges: 5, successRate: 85 },
        { id: 6, name: 'Lisa Anderson', email: 'lisa@example.com', status: 'active', level: 'Advanced', completedChallenges: 20, successRate: 91 },
      ]);
      setLoading(false);
    };

    loadData();
  }, []);

  if (loading) {
    return <LoadingSkeleton count={5} type="row" />;
  }

  const getStatusColor = (status) => {
    return status === 'active' ? 'success' : 'warning';
  };

  const getLevelColor = (level) => {
    switch (level) {
      case 'Beginner':
        return 'success';
      case 'Intermediate':
        return 'warning';
      case 'Advanced':
        return 'error';
      default:
        return 'info';
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="space-y-3">
        <h1 className="text-3xl md:text-4xl font-bold text-cloud-900">Manage Learners</h1>
        <p className="text-orange-600 font-semibold text-base">Monitor and manage all registered learners</p>
      </div>

      {/* Stats */}
      <div className="space-y-6">
        <div>
          <h3 className="text-xl font-semibold text-cloud-900">Learner Statistics</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 rounded-lg bg-white border border-cloud-100 hover:border-primary-300/50 hover:shadow-sm transition-all duration-300">
            <div className="flex items-start justify-between mb-3">
              <Users className="w-5 h-5 text-orange-500 flex-shrink-0" />
              <span className="text-xs font-semibold text-orange-600">Total</span>
            </div>
            <p className="text-xs font-semibold text-cloud-500 uppercase tracking-wide mb-1">Total Learners</p>
            <p className="text-2xl font-semibold text-cloud-900">{learners.length}</p>
          </div>
          <div className="p-4 rounded-lg bg-white border border-cloud-100 hover:border-primary-300/50 hover:shadow-sm transition-all duration-300">
            <div className="flex items-start justify-between mb-3">
              <TrendingUp className="w-5 h-5 text-orange-500 flex-shrink-0" />
              <span className="text-xs font-semibold text-orange-600">Active</span>
            </div>
            <p className="text-xs font-semibold text-cloud-500 uppercase tracking-wide mb-1">Active Now</p>
            <p className="text-2xl font-semibold text-cloud-900">{learners.filter((l) => l.status === 'active').length}</p>
          </div>
          <div className="p-4 rounded-lg bg-white border border-cloud-100 hover:border-primary-300/50 hover:shadow-sm transition-all duration-300">
            <div className="flex items-start justify-between mb-3">
              <Target className="w-5 h-5 text-orange-500 flex-shrink-0" />
              <span className="text-xs font-semibold text-orange-600">Avg</span>
            </div>
            <p className="text-xs font-semibold text-cloud-500 uppercase tracking-wide mb-1">Success Rate</p>
            <p className="text-2xl font-semibold text-cloud-900">
              {Math.round(learners.reduce((sum, l) => sum + l.successRate, 0) / learners.length)}%
            </p>
          </div>
        </div>
      </div>

      {/* Learners Table */}
      <div className="space-y-6">
        <div>
          <h3 className="text-xl font-semibold text-cloud-900">All Learners</h3>
        </div>

        <Card>
          <h2 className="text-base font-semibold text-cloud-900 mb-6">Learner Details</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-base">
              <thead>
                <tr className="border-b-2 border-cloud-200">
                  <th className="text-left py-4 px-4 text-base font-semibold text-cloud-900">Name</th>
                  <th className="text-left py-4 px-4 text-base font-semibold text-cloud-900">Email</th>
                  <th className="text-center py-4 px-4 text-base font-semibold text-cloud-900">Status</th>
                  <th className="text-center py-4 px-4 text-base font-semibold text-cloud-900">Level</th>
                  <th className="text-center py-4 px-4 text-base font-semibold text-cloud-900">Challenges</th>
                  <th className="text-center py-4 px-4 text-base font-semibold text-cloud-900">Success Rate</th>
                  <th className="text-center py-4 px-4 text-base font-semibold text-cloud-900">Actions</th>
                </tr>
              </thead>
              <tbody>
                {learners.map((learner) => (
                  <tr key={learner.id} className="border-b border-cloud-100 hover:bg-cloud-50 transition">
                    <td className="py-4 px-4 text-base font-medium text-cloud-900">{learner.name}</td>
                    <td className="py-4 px-4 text-base text-cloud-600">{learner.email}</td>
                    <td className="py-4 px-4 text-center">
                      <Badge variant={getStatusColor(learner.status)}>
                        {learner.status.charAt(0).toUpperCase() + learner.status.slice(1)}
                      </Badge>
                    </td>
                    <td className="py-4 px-4 text-center">
                      <Badge variant={getLevelColor(learner.level)}>{learner.level}</Badge>
                    </td>
                    <td className="py-4 px-4 text-center text-base font-semibold text-cloud-900">{learner.completedChallenges}</td>
                    <td className="py-4 px-4 text-center text-base font-semibold text-cloud-900">{learner.successRate}%</td>
                    <td className="py-4 px-4 text-center">
                      <Button variant="ghost" size="sm">
                        View Details
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  );
}
