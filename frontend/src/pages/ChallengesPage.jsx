import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Zap, Cpu, Database, Wifi, Lock, Rocket, Layout, Sprout, BookOpen, Zap as ZapIcon } from 'lucide-react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import MissionCard from '../components/ui/MissionCard';
import api from '../api/mockApi';
import { learningTracks, difficulties } from '../data/mockData';

const trackIcons = {
  compute: <Cpu className="w-5 h-5 text-orange-500 flex-shrink-0" />,
  storage: <Database className="w-5 h-5 text-orange-500 flex-shrink-0" />,
  networking: <Wifi className="w-5 h-5 text-orange-500 flex-shrink-0" />,
  security: <Lock className="w-5 h-5 text-orange-500 flex-shrink-0" />,
  devops: <Rocket className="w-5 h-5 text-orange-500 flex-shrink-0" />,
  architecture: <Layout className="w-5 h-5 text-orange-500 flex-shrink-0" />,
};

const difficultyIcons = {
  beginner: <Sprout className="w-5 h-5 text-green-500 flex-shrink-0" />,
  intermediate: <BookOpen className="w-5 h-5 text-amber-500 flex-shrink-0" />,
  advanced: <ZapIcon className="w-5 h-5 text-red-500 flex-shrink-0" />,
};

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
      {/* Popular Missions Section */}
      <div>
        <h2 className="text-2xl font-bold text-cloud-900 mb-2">Popular Missions</h2>
        <p className="text-orange-600 font-semibold text-base mb-6">Get started or customize your learning path</p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {learningTracks.slice(0, 4).map((track) => (
            <MissionCard
              key={track.id}
              icon={track.icon}
              title={track.name}
              difficulty="Intermediate"
              estimatedTime="60-90 min"
              status="available"
              onClick={() => {
                setSelectedTrack(track.id);
                setSelectedDifficulty('intermediate');
              }}
              compact={true}
            />
          ))}
        </div>
      </div>

      {/* Customize Mission Section */}
      <div className="rounded-2xl border border-cloud-200 p-6 md:p-8">
        <h2 className="text-2xl font-bold text-cloud-900 mb-2">Customize Your Mission</h2>
        <p className="text-orange-600 font-semibold text-base mb-6">Select your learning track and difficulty level</p>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Learning Track Selection */}
          <div>
            <h3 className="text-base font-bold text-cloud-900 mb-4">Learning Track</h3>
            <div className="space-y-2">
              {learningTracks.map((track) => (
                <button
                  key={track.id}
                  onClick={() => setSelectedTrack(track.id)}
                  className={`w-full p-3 rounded-lg border transition-all text-left ${
                    selectedTrack === track.id
                      ? 'border-primary-500 bg-primary-50'
                      : 'border-cloud-200 hover:border-primary-300 bg-white'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {trackIcons[track.id]}
                    <span className="text-sm font-medium text-cloud-900">{track.name}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Difficulty Selection & Launch */}
          <div>
            <h3 className="text-base font-bold text-cloud-900 mb-4">Difficulty Level</h3>
            <div className="space-y-2 mb-6">
              {difficulties.map((difficulty) => (
                <button
                  key={difficulty.id}
                  onClick={() => setSelectedDifficulty(difficulty.id)}
                  className={`w-full p-3 rounded-lg border transition-all text-left ${
                    selectedDifficulty === difficulty.id
                      ? 'border-primary-500 bg-primary-50'
                      : 'border-cloud-200 hover:border-primary-300 bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div>
                        {difficultyIcons[difficulty.id]}
                      </div>
                      <span className="text-sm font-medium text-cloud-900">{difficulty.name}</span>
                    </div>
                    {selectedDifficulty === difficulty.id && (
                      <span className="text-primary-600">✓</span>
                    )}
                  </div>
                </button>
              ))}
            </div>

            {/* Launch Button */}
            <Button
              variant="primary"
              size="lg"
              onClick={() => setShowGeneratingModal(true)}
              disabled={!isFormValid}
              className="w-full"
            >
              {isFormValid ? 'Launch Mission' : 'Select Track & Difficulty'}
            </Button>
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
