import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import api from '../api/mockApi';
import { learningTracks, difficulties } from '../data/mockData';

export default function ChallengesPage() {
  const navigate = useNavigate();
  const [selectedTrack, setSelectedTrack] = useState(null);
  const [selectedDifficulty, setSelectedDifficulty] = useState(null);
  const [showGeneratingModal, setShowGeneratingModal] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  const handleStartChallenge = async () => {
    setIsGenerating(true);
    try {
      await api.startChallenge(1);
      // Simulate generation time
      await new Promise((r) => setTimeout(r, 2000));
      navigate('/mission/new');
    } finally {
      setIsGenerating(false);
      setShowGeneratingModal(false);
    }
  };

  const isFormValid = selectedTrack && selectedDifficulty;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-cloud-900">Launch New Challenge</h1>
        <p className="text-cloud-600 mt-1">
          Select your learning track and difficulty level to begin
        </p>
      </div>

      {/* Challenge Creation Form */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Learning Tracks */}
        <div className="lg:col-span-2">
          <Card>
            <h2 className="text-xl font-bold text-cloud-900 mb-6">Select Learning Track</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {learningTracks.map((track) => (
                <button
                  key={track.id}
                  onClick={() => setSelectedTrack(track.id)}
                  className={`p-6 rounded-xl border-2 transition cursor-pointer ${
                    selectedTrack === track.id
                      ? 'border-primary-600 bg-primary-50'
                      : 'border-cloud-200 hover:border-primary-400 bg-white'
                  }`}
                >
                  <div className="text-3xl mb-3">{track.icon}</div>
                  <h3 className="font-bold text-cloud-900 text-left">{track.name}</h3>
                  <p className="text-sm text-cloud-600 text-left mt-2">{track.description}</p>
                </button>
              ))}
            </div>
          </Card>

          {/* Difficulty Selection */}
          <Card className="mt-6">
            <h2 className="text-xl font-bold text-cloud-900 mb-6">Select Difficulty Level</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {difficulties.map((difficulty) => (
                <button
                  key={difficulty.id}
                  onClick={() => setSelectedDifficulty(difficulty.id)}
                  className={`p-6 rounded-xl border-2 transition cursor-pointer text-center ${
                    selectedDifficulty === difficulty.id
                      ? 'border-primary-600 bg-primary-50'
                      : 'border-cloud-200 hover:border-primary-400 bg-white'
                  }`}
                >
                  <div className="text-2xl mb-3">
                    {['🌱', '📚', '🚀'][difficulty.level - 1]}
                  </div>
                  <h3 className="font-bold text-cloud-900">{difficulty.name}</h3>
                  <p className="text-xs text-cloud-600 mt-2">Level {difficulty.level}</p>
                </button>
              ))}
            </div>
          </Card>

          {/* Description */}
          {selectedTrack && (
            <Card className="mt-6 bg-blue-50 border border-blue-200">
              <h3 className="font-bold text-blue-900 mb-2">What to Expect</h3>
              <p className="text-sm text-blue-800">
                Our AI will generate a unique, personalized cloud scenario based on your selections.
                You'll have access to a temporary Google Cloud environment to complete realistic
                challenges. Your actions will be continuously evaluated, and you'll receive
                detailed feedback upon completion.
              </p>
            </Card>
          )}
        </div>

        {/* Preview Panel */}
        <div className="lg:col-span-1">
          <Card className="sticky top-24">
            <h2 className="text-xl font-bold text-cloud-900 mb-6">Challenge Preview</h2>

            {selectedTrack ? (
              <>
                <div className="space-y-4 mb-6">
                  <div>
                    <p className="text-xs uppercase text-cloud-500 font-medium">Track</p>
                    <p className="text-lg font-bold text-cloud-900 mt-1">
                      {learningTracks.find((t) => t.id === selectedTrack)?.name}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs uppercase text-cloud-500 font-medium">Difficulty</p>
                    <p className="text-lg font-bold text-cloud-900 mt-1">
                      {difficulties.find((d) => d.id === selectedDifficulty)?.name || 'Not selected'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs uppercase text-cloud-500 font-medium">Estimated Time</p>
                    <p className="text-lg font-bold text-cloud-900 mt-1">
                      {selectedDifficulty === 'beginner'
                        ? '30-45 min'
                        : selectedDifficulty === 'intermediate'
                          ? '60-90 min'
                          : '120+ min'}
                    </p>
                  </div>
                </div>

                <Button
                  variant="primary"
                  size="lg"
                  disabled={!isFormValid}
                  onClick={() => setShowGeneratingModal(true)}
                  className="w-full"
                >
                  Generate Challenge
                </Button>

                <div className="mt-4 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                  <p className="text-xs text-yellow-800">
                    <strong>Note:</strong> Challenge generation typically takes 30-60 seconds as
                    our AI creates a unique scenario for you.
                  </p>
                </div>
              </>
            ) : (
              <div className="text-center py-8">
                <p className="text-cloud-600">Select a track to begin</p>
              </div>
            )}
          </Card>
        </div>
      </div>

      {/* Generating Modal */}
      <Modal
        isOpen={showGeneratingModal}
        onClose={() => !isGenerating && setShowGeneratingModal(false)}
        title="Generating Your Challenge..."
        size="md"
      >
        <div className="text-center py-8 space-y-4">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-100 rounded-full animate-pulse">
            <span className="text-3xl">⚡</span>
          </div>
          <p className="text-cloud-700 font-medium">AI is crafting your unique challenge...</p>
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
