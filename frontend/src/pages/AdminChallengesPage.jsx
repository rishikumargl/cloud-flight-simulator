import { useEffect, useState } from 'react';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import LoadingSkeleton from '../components/ui/LoadingSkeleton';

export default function AdminChallengesPage() {
  const [challenges, setChallenges] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      await new Promise((r) => setTimeout(r, 500));
      setChallenges([
        {
          id: 1,
          title: 'Deploy a Web Application',
          track: 'Compute',
          difficulty: 'Beginner',
          attempts: 24,
          passRate: 89,
          avgTime: '45 min',
        },
        {
          id: 2,
          title: 'Configure Cloud Storage',
          track: 'Storage',
          difficulty: 'Beginner',
          attempts: 18,
          passRate: 92,
          avgTime: '30 min',
        },
        {
          id: 3,
          title: 'Setup VPC Network',
          track: 'Networking',
          difficulty: 'Intermediate',
          attempts: 15,
          passRate: 85,
          avgTime: '60 min',
        },
        {
          id: 4,
          title: 'Implement Security Policies',
          track: 'Security',
          difficulty: 'Intermediate',
          attempts: 12,
          passRate: 78,
          avgTime: '75 min',
        },
        {
          id: 5,
          title: 'Deploy Kubernetes Cluster',
          track: 'DevOps',
          difficulty: 'Advanced',
          attempts: 8,
          passRate: 72,
          avgTime: '120 min',
        },
        {
          id: 6,
          title: 'Design Scalable Architecture',
          track: 'Architecture',
          difficulty: 'Advanced',
          attempts: 6,
          passRate: 65,
          avgTime: '150 min',
        },
      ]);
      setLoading(false);
    };

    loadData();
  }, []);

  if (loading) {
    return <LoadingSkeleton count={5} type="row" />;
  }

  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
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
        <h1 className="text-4xl font-bold text-cloud-900">Manage Challenges</h1>
        <p className="text-lg text-cloud-600 mt-2">Monitor challenge performance and learner engagement</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <p className="text-base text-cloud-600 font-medium">Total Challenges</p>
          <p className="text-4xl font-bold text-primary-600 mt-2">{challenges.length}</p>
        </Card>
        <Card>
          <p className="text-base text-cloud-600 font-medium">Total Attempts</p>
          <p className="text-4xl font-bold text-info mt-2">{challenges.reduce((sum, c) => sum + c.attempts, 0)}</p>
        </Card>
        <Card>
          <p className="text-base text-cloud-600 font-medium">Avg Pass Rate</p>
          <p className="text-4xl font-bold text-success mt-2">
            {Math.round(challenges.reduce((sum, c) => sum + c.passRate, 0) / challenges.length)}%
          </p>
        </Card>
        <Card>
          <p className="text-base text-cloud-600 font-medium">Most Popular</p>
          <p className="text-2xl font-bold text-cloud-900 mt-2">
            {challenges.reduce((max, c) => (c.attempts > max.attempts ? c : max)).track}
          </p>
        </Card>
      </div>

      {/* Challenges Table */}
      <Card>
        <h2 className="text-2xl font-bold text-cloud-900 mb-6">All Challenges</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-base">
            <thead>
              <tr className="border-b-2 border-cloud-200">
                <th className="text-left py-4 px-4 text-lg font-bold text-cloud-900">Title</th>
                <th className="text-center py-4 px-4 text-lg font-bold text-cloud-900">Track</th>
                <th className="text-center py-4 px-4 text-lg font-bold text-cloud-900">Difficulty</th>
                <th className="text-center py-4 px-4 text-lg font-bold text-cloud-900">Attempts</th>
                <th className="text-center py-4 px-4 text-lg font-bold text-cloud-900">Pass Rate</th>
                <th className="text-center py-4 px-4 text-lg font-bold text-cloud-900">Avg Time</th>
                <th className="text-center py-4 px-4 text-lg font-bold text-cloud-900">Actions</th>
              </tr>
            </thead>
            <tbody>
              {challenges.map((challenge) => (
                <tr key={challenge.id} className="border-b border-cloud-100 hover:bg-cloud-50 transition">
                  <td className="py-4 px-4 text-base font-medium text-cloud-900">{challenge.title}</td>
                  <td className="py-4 px-4 text-center">
                    <Badge variant="info">{challenge.track}</Badge>
                  </td>
                  <td className="py-4 px-4 text-center">
                    <Badge variant={getDifficultyColor(challenge.difficulty)}>{challenge.difficulty}</Badge>
                  </td>
                  <td className="py-4 px-4 text-center text-base font-bold text-cloud-900">{challenge.attempts}</td>
                  <td className="py-4 px-4 text-center text-base font-bold text-success">{challenge.passRate}%</td>
                  <td className="py-4 px-4 text-center text-base text-cloud-600">{challenge.avgTime}</td>
                  <td className="py-4 px-4 text-center">
                    <Button variant="ghost" size="sm">
                      Edit
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
