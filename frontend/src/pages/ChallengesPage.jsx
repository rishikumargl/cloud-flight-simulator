import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Zap } from 'lucide-react';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import MissionCard from '../components/ui/MissionCard';
import api from '../api/mockApi';
import { learningTracks, difficulties } from '../data/mockData';

export default function ChallengesPage() {
  const navigate = useNavigate();
  const [selectedTrack, setSelectedTrack] = useState(null);
  const [selectedDifficulty, setSelectedDifficulty] = useState(null);
  const [showGeneratingModal, setShowGeneratingModal] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  const isFormValid = selectedTrack && selectedDifficulty;

  const handleLaunchMission = async () => {
    setIsGenerating(true);
    try {
      await api.startChallenge(1);
      await new Promise((r) => setTimeout(r, 2000));
      navigate('/mission/new');
    } finally {
      setIsGenerating(false);
      setShowGeneratingModal(false);
    }
  };

  useEffect(() => {
    if (showGeneratingModal && !isGenerating) {
      handleLaunchMission();
    }
  }, [showGeneratingModal]);

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Hero Banner */}
      <div className="relative rounded-3xl overflow-hidden h-64 bg-gradient-to-r from-primary-600 to-sky-600 shadow-lg border border-primary-500/20">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-0 right-0 w-96 h-96 bg-white rounded-full -mr-48 -mt-48"></div>
        </div>
        <div className="relative h-full flex items-center justify-between px-8">
          <div className="max-w-xl">
            <Badge variant="primary" size="sm" className="mb-4 bg-white/20 text-white border-white/30">Cloud Missions</Badge>
            <h2 className="text-4xl font-bold text-white mb-2">Choose Your Mission</h2>
            <p className="text-white/90 text-lg">Select a track and difficulty level to deploy real cloud scenarios</p>
          </div>
          <div className="hidden lg:block text-6xl">🎯</div>
        </div>
      </div>

      {/* Popular Missions Section */}
      <div>
        <h2 className="text-2xl font-bold text-cloud-900 mb-2">Popular Missions</h2>
        <p className="text-cloud-600 mb-6">Choose a mission to get started or customize your learning path below</p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {learningTracks.slice(0, 4).map((track) => (
            <MissionCard
              key={track.id}
              icon={track.icon}
              title={track.name}
              description={track.description}
              difficulty="Intermediate"
              estimatedTime="60-90 min"
              status="available"
              onClick={() => {
                setSelectedTrack(track.id);
                setSelectedDifficulty('intermediate');
              }}
              skills={['Cloud', 'DevOps']}
            />
          ))}
        </div>
      </div>

      {/* Customize Mission Section */}
      <div className="bg-gradient-to-br from-sky-50 via-white to-primary-50 rounded-3xl p-10 border-2 border-primary-200 shadow-lg">
        <h2 className="text-2xl font-bold text-cloud-900 mb-8">Customize Your Mission</h2>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Learning Track Selection */}
          <div>
            <h3 className="text-lg font-bold text-cloud-900 mb-5">1. Choose Learning Track</h3>
            <div className="space-y-3">
              {learningTracks.map((track) => (
                <button
                  key={track.id}
                  onClick={() => setSelectedTrack(track.id)}
                  className={`w-full p-4 rounded-xl border-2 transition-all text-left group ${
                    selectedTrack === track.id
                      ? 'border-primary-600 bg-gradient-to-br from-primary-100 to-sky-100 shadow-md'
                      : 'border-cloud-200 hover:border-primary-400 hover:shadow-md bg-white'
                  }`}
                >
                  <div className="text-2xl mb-2 group-hover:scale-110 transition-transform">{track.icon}</div>
                  <p className="font-semibold text-cloud-900">{track.name}</p>
                  <p className="text-xs text-cloud-600 mt-1">{track.description}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Difficulty Selection & Launch */}
          <div>
            <h3 className="text-lg font-bold text-cloud-900 mb-5">2. Choose Difficulty</h3>
            <div className="space-y-3 mb-8">
              {difficulties.map((difficulty) => (
                <button
                  key={difficulty.id}
                  onClick={() => setSelectedDifficulty(difficulty.id)}
                  className={`w-full p-4 rounded-xl border-2 transition-all text-left group ${
                    selectedDifficulty === difficulty.id
                      ? 'border-primary-600 bg-gradient-to-br from-primary-100 to-sky-100 shadow-md'
                      : 'border-cloud-200 hover:border-primary-400 hover:shadow-md bg-white'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="text-2xl mb-2 group-hover:scale-110 transition-transform">
                        {['🌱', '📚', '🚀'][difficulty.level - 1]}
                      </div>
                      <p className="font-semibold text-cloud-900">{difficulty.name}</p>
                      <p className="text-xs text-cloud-600 mt-1">
                        {difficulty.level === 1 ? '30-45 min' : difficulty.level === 2 ? '60-90 min' : '120+ min'}
                      </p>
                    </div>
                    {selectedDifficulty === difficulty.id && (
                      <Badge variant="primary" size="sm">
                        ✓
                      </Badge>
                    )}
                  </div>
                </button>
              ))}
            </div>

            {/* Summary Card */}
            {selectedTrack && selectedDifficulty && (
              <Card className="bg-white/90 border-2 border-accent-200 bg-gradient-to-br from-accent-50 to-green-50 mb-6">
                <div className="flex items-center gap-2 mb-4">
                  <div className="text-2xl">✓</div>
                  <h4 className="font-bold text-accent-900">Ready to Launch!</h4>
                </div>
                <div className="space-y-2 text-sm">
                  <p className="text-cloud-700">
                    <span className="font-semibold">Track:</span> {learningTracks.find(t => t.id === selectedTrack)?.name}
                  </p>
                  <p className="text-cloud-700">
                    <span className="font-semibold">Level:</span> {difficulties.find(d => d.id === selectedDifficulty)?.name}
                  </p>
                  <p className="text-cloud-700">
                    <span className="font-semibold">Duration:</span> {selectedDifficulty === 'beginner' ? '30-45 min' : selectedDifficulty === 'intermediate' ? '60-90 min' : '120+ min'}
                  </p>
                </div>
              </Card>
            )}

            {/* Launch Button */}
            <Button
              variant="primary"
              size="lg"
              onClick={() => setShowGeneratingModal(true)}
              disabled={!isFormValid}
              className="w-full flex items-center justify-center gap-2"
            >
              <Zap className="w-5 h-5" />
              {isFormValid ? 'Launch Mission' : 'Select Track & Difficulty'}
            </Button>

            {/* Info Box */}
            <div className="mt-4 p-4 rounded-lg bg-sky-100/60 border border-sky-200 text-xs text-sky-900">
              💡 Our AI will generate a unique cloud scenario personalized to your selections. This typically takes 30-60 seconds.
            </div>
          </div>
        </div>
      </div>

      {/* Generating Modal */}
      <Modal
        isOpen={showGeneratingModal}
        onClose={() => !isGenerating && setShowGeneratingModal(false)}
        title="Generating Your Mission..."
        size="md"
      >
        <div className="text-center py-8 space-y-4">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-100 rounded-full animate-pulse">
            <span className="text-3xl">⚡</span>
          </div>
          <p className="text-cloud-700 font-medium">AI is crafting your unique mission...</p>
          <div className="space-y-2 text-sm text-cloud-600">
            <p>✓ Analyzing your skill level</p>
            <p>✓ Generating realistic scenario</p>
            <p>✓ Provisioning cloud environment</p>
          </div>
        </div>
      </Modal>
    </div>
  );
}
