import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { Zap } from "lucide-react";
import { learningTracks, difficulties } from "../../data/mockData";
import api from "../../api/apiService";

export const Route = createFileRoute("/_protected/challenges")({
  head: () => ({ meta: [{ title: "Challenges — CloudFlight" }] }),
  component: ChallengesPage,
});

function StatusDot({ color }: { color: string }) {
  return <span className={`h-2 w-2 rounded-full ${color}`} />;
}

function ChallengesPage() {
  const [selectedTrack, setSelectedTrack] = useState<string | null>(null);
  const [selectedDifficulty, setSelectedDifficulty] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const navigate = Route.useNavigate();

  const isFormValid = selectedTrack && selectedDifficulty;

  const handleLaunch = async () => {
    if (!selectedTrack || !selectedDifficulty) {
      console.error("Track and difficulty are required");
      return;
    }

    setIsGenerating(true);
    try {
      // Step 1: Generate scenario to get mission_id
      const scenario = await api.generateScenario(selectedTrack, selectedDifficulty);
      const mission_id = scenario.mission_id;

      if (!mission_id) {
        throw new Error("No mission_id returned from scenario generation");
      }

      // Step 2: Start challenge with mission_id
      const challenge = await api.startChallenge(mission_id);
      const session_id = challenge.session?.session_id ?? challenge.session_id;

      if (!session_id) {
        throw new Error("No session_id returned from challenge start");
      }

      // Step 3: Navigate to mission page with session_id
      await new Promise((r) => setTimeout(r, 1000));
      navigate({ to: "/mission/$id", params: { id: session_id } });
    } catch (error) {
      console.error("Failed to launch challenge:", error);
      alert("Failed to launch challenge. Please try again.");
    } finally {
      setIsGenerating(false);
      setShowModal(false);
    }
  };

  useEffect(() => {
    if (showModal) handleLaunch();
  }, [showModal]);

  const diffIcons = ["🌱", "📚", "🚀"];
  const diffTimes = ["30–45 min", "60–90 min", "120+ min"];

  return (
    <div className="space-y-12">
      {/* Hero */}
      <div className="relative overflow-hidden rounded-3xl bg-ink p-10 text-white">
        <div className="absolute right-10 top-1/2 -translate-y-1/2 text-6xl opacity-20">🎯</div>
        <div className="mono-label mb-4 !text-white/50">CLOUD MISSIONS</div>
        <h1 className="font-display text-[clamp(2rem,5vw,3.5rem)] font-medium leading-[1] tracking-[-0.03em]">
          Choose Your Mission
        </h1>
        <p className="mt-3 max-w-lg text-[15px] text-white/70">
          Select a track and difficulty to deploy real cloud scenarios on live GCP environments.
        </p>
      </div>

      {/* Popular missions */}
      <div>
        <div className="mono-label mb-2">POPULAR MISSIONS</div>
        <h2 className="font-display text-[26px] font-medium leading-tight tracking-[-0.02em] text-ink mb-6">
          Jump straight in.
        </h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          {learningTracks.slice(0, 4).map((t) => (
            <button
              key={t.id}
              onClick={() => { setSelectedTrack(t.id); setSelectedDifficulty("intermediate"); }}
              className={`group rounded-3xl border p-7 text-left transition ${
                selectedTrack === t.id
                  ? "border-primary bg-background"
                  : "border-border bg-surface hover:border-primary/40"
              }`}
            >
              <div className="text-3xl">{t.icon}</div>
              <h3 className="mt-4 font-display text-[18px] font-semibold text-ink">{t.name}</h3>
              <p className="mt-1 text-[13px] text-foreground">{t.description}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Customizer */}
      <div className="rounded-3xl border border-border bg-surface p-10">
        <div className="mono-label mb-8">CUSTOMIZE YOUR MISSION</div>
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-2">

          {/* Track */}
          <div>
            <h3 className="font-display text-[20px] font-medium text-ink mb-5">1. Choose learning track</h3>
            <div className="space-y-2">
              {learningTracks.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setSelectedTrack(t.id)}
                  className={`flex w-full items-center gap-4 rounded-2xl border p-4 text-left transition ${
                    selectedTrack === t.id
                      ? "border-primary bg-background"
                      : "border-border hover:border-primary/40"
                  }`}
                >
                  <span className="text-xl">{t.icon}</span>
                  <div>
                    <div className="text-[14px] font-semibold text-ink">{t.name}</div>
                    <div className="text-[12px] text-foreground">{t.description}</div>
                  </div>
                  {selectedTrack === t.id && (
                    <span className="ml-auto text-primary">✓</span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Difficulty + launch */}
          <div>
            <h3 className="font-display text-[20px] font-medium text-ink mb-5">2. Choose difficulty</h3>
            <div className="space-y-2 mb-8">
              {difficulties.map((d, i) => (
                <button
                  key={d.id}
                  onClick={() => setSelectedDifficulty(d.id)}
                  className={`flex w-full items-center gap-4 rounded-2xl border p-4 text-left transition ${
                    selectedDifficulty === d.id
                      ? "border-primary bg-background"
                      : "border-border hover:border-primary/40"
                  }`}
                >
                  <span className="text-xl">{diffIcons[i]}</span>
                  <div>
                    <div className="text-[14px] font-semibold text-ink">{d.name}</div>
                    <div className="text-[12px] text-foreground">{diffTimes[i]}</div>
                  </div>
                  {selectedDifficulty === d.id && (
                    <span className="ml-auto text-primary">✓</span>
                  )}
                </button>
              ))}
            </div>

            {/* Summary */}
            {isFormValid && (
              <div className="mb-6 rounded-2xl border border-border bg-background p-5">
                <div className="mono-label mb-3">READY TO LAUNCH</div>
                <div className="space-y-1.5 text-[13px]">
                  <div className="flex justify-between">
                    <span className="text-foreground">Track</span>
                    <span className="font-medium text-ink">{learningTracks.find(t => t.id === selectedTrack)?.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-foreground">Difficulty</span>
                    <span className="font-medium text-ink">{difficulties.find(d => d.id === selectedDifficulty)?.name}</span>
                  </div>
                </div>
              </div>
            )}

            <button
              onClick={() => setShowModal(true)}
              disabled={!isFormValid}
              className={`w-full inline-flex items-center justify-center gap-2 rounded-full px-6 py-3.5 text-[15px] font-medium transition ${
                isFormValid
                  ? "bg-primary text-white hover:opacity-90"
                  : "bg-muted text-foreground/40 cursor-not-allowed"
              }`}
            >
              <Zap className="h-4 w-4" />
              {isFormValid ? "Launch Mission" : "Select Track & Difficulty"}
            </button>

            <div className="mt-4 rounded-2xl border border-border bg-background px-5 py-4 text-[13px] text-foreground">
              💡 Our AI generates a unique cloud scenario personalised to your selections. Typically takes 30–60 seconds.
            </div>
          </div>
        </div>
      </div>

      {/* Generating modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-3xl bg-background p-10 text-center shadow-2xl">
            <div className="mx-auto mb-6 flex h-16 w-16 animate-pulse items-center justify-center rounded-full bg-primary/10">
              <span className="text-3xl">⚡</span>
            </div>
            <h3 className="font-display text-[24px] font-medium text-ink">Generating your mission…</h3>
            <div className="mt-6 space-y-2 text-[14px] text-foreground">
              <p>✓ Analysing your skill level</p>
              <p>✓ Generating realistic scenario</p>
              <p>✓ Provisioning GCP environment</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
