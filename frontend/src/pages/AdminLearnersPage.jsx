import { useEffect, useState } from 'react';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import LoadingSkeleton from '../components/ui/LoadingSkeleton';

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
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold text-cloud-900">Manage Learners</h1>
        <p className="text-lg text-cloud-600 mt-2">Monitor and manage all registered learners</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <p className="text-base text-cloud-600 font-medium">Total Learners</p>
          <p className="text-4xl font-bold text-primary-600 mt-2">{learners.length}</p>
        </Card>
        <Card>
          <p className="text-base text-cloud-600 font-medium">Active Now</p>
          <p className="text-4xl font-bold text-success mt-2">{learners.filter((l) => l.status === 'active').length}</p>
        </Card>
        <Card>
          <p className="text-base text-cloud-600 font-medium">Avg Success Rate</p>
          <p className="text-4xl font-bold text-info mt-2">
            {Math.round(learners.reduce((sum, l) => sum + l.successRate, 0) / learners.length)}%
          </p>
        </Card>
      </div>

      {/* Learners Table */}
      <Card>
        <h2 className="text-2xl font-bold text-cloud-900 mb-6">All Learners</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-base">
            <thead>
              <tr className="border-b-2 border-cloud-200">
                <th className="text-left py-4 px-4 text-lg font-bold text-cloud-900">Name</th>
                <th className="text-left py-4 px-4 text-lg font-bold text-cloud-900">Email</th>
                <th className="text-center py-4 px-4 text-lg font-bold text-cloud-900">Status</th>
                <th className="text-center py-4 px-4 text-lg font-bold text-cloud-900">Level</th>
                <th className="text-center py-4 px-4 text-lg font-bold text-cloud-900">Challenges</th>
                <th className="text-center py-4 px-4 text-lg font-bold text-cloud-900">Success Rate</th>
                <th className="text-center py-4 px-4 text-lg font-bold text-cloud-900">Actions</th>
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
                  <td className="py-4 px-4 text-center text-base font-bold text-cloud-900">{learner.completedChallenges}</td>
                  <td className="py-4 px-4 text-center text-base font-bold text-info">{learner.successRate}%</td>
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
  );
}
