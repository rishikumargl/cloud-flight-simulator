import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Zap, Loader, CheckCircle2, AlertCircle } from "lucide-react";
import api from "../../../api/apiService";

export const Route = createFileRoute("/_protected/admin/playground")({
  head: () => ({ meta: [{ title: "AI Mission Playground — Admin" }] }),
  component: MissionPlayground,
});

const TRACKS = ["COMPUTE", "STORAGE", "NETWORKING", "SECURITY", "DEVOPS", "ARCHITECTURE"];
const DIFFICULTIES = ["BEGINNER", "INTERMEDIATE", "ADVANCED"];

function MissionPlayground() {
  const [track, setTrack] = useState("COMPUTE");
  const [difficulty, setDifficulty] = useState("INTERMEDIATE");
  const [preview, setPreview] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    setLoading(true);
    setError(null);
    setPreview(null);

    try {
      const mission = await api.generateScenario(track, difficulty);
      setPreview(mission);
    } catch (err) {
      setError(`Failed to generate mission: ${err instanceof Error ? err.message : "Unknown error"}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 pb-16">
      <div style={{ animation: "cfFadeSlideUp 0.5s ease both" }}>
        <h1 className="font-display text-[28px] font-medium tracking-[-0.025em] text-ink mb-2">
          AI Mission Playground
        </h1>
        <p className="text-[14px] text-foreground">
          Preview AI-generated missions before they are deployed to learners.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Controls */}
        <div className="rounded-2xl border border-border bg-surface p-6 h-fit">
          <h3 className="font-medium text-ink mb-5">Mission Parameters</h3>

          {/* Track selector */}
          <div className="mb-5">
            <label className="mono-label mb-2 block text-[10px]">TRACK</label>
            <select
              value={track}
              onChange={(e) => setTrack(e.target.value)}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-[13px] focus:border-primary focus:outline-none"
            >
              {TRACKS.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>

          {/* Difficulty selector */}
          <div className="mb-6">
            <label className="mono-label mb-2 block text-[10px]">DIFFICULTY</label>
            <select
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value)}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-[13px] focus:border-primary focus:outline-none"
            >
              {DIFFICULTIES.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>

          {/* Generate button */}
          <button
            onClick={handleGenerate}
            disabled={loading}
            className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-[13px] font-medium text-white hover:opacity-90 disabled:opacity-50 transition"
          >
            {loading ? (
              <>
                <Loader className="h-4 w-4 animate-spin" />
                Generating…
              </>
            ) : (
              <>
                <Zap className="h-4 w-4" />
                Generate Preview
              </>
            )}
          </button>

          {/* Mission controls (disabled for now) */}
          <div className="mt-6 space-y-2 border-t border-border pt-6">
            <button
              disabled
              className="w-full rounded-lg border border-border px-4 py-2.5 text-[12px] font-medium text-foreground hover:bg-muted transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Approve
            </button>
            <button
              disabled
              className="w-full rounded-lg border border-border px-4 py-2.5 text-[12px] font-medium text-foreground hover:bg-muted transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Reject
            </button>
          </div>

          <p className="text-[11px] text-foreground/60 mt-3">
            Backend approval workflow not yet implemented.
          </p>
        </div>

        {/* Preview */}
        <div className="lg:col-span-2">
          {error && (
            <div className="rounded-2xl border border-red-200 bg-red-50 p-6 mb-6">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
                <div>
                  <h4 className="font-medium text-red-900 mb-1">Generation Failed</h4>
                  <p className="text-[13px] text-red-800">{error}</p>
                </div>
              </div>
            </div>
          )}

          {!preview && !loading && (
            <div className="rounded-2xl border border-border bg-surface p-12 text-center">
              <Zap className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
              <p className="text-foreground mb-2">Generate a mission to preview it here</p>
              <p className="text-[12px] text-foreground/60">
                Select a track and difficulty, then click "Generate Preview"
              </p>
            </div>
          )}

          {loading && (
            <div className="rounded-2xl border border-border bg-surface p-12 text-center">
              <Loader className="h-12 w-12 text-primary mx-auto mb-4 animate-spin" />
              <p className="text-foreground">Generating AI mission preview…</p>
              <p className="text-[12px] text-foreground/60 mt-2">This typically takes 2-5 seconds</p>
            </div>
          )}

          {preview && (
            <div className="space-y-4">
              {/* Mission meta */}
              <div className="rounded-2xl border border-border bg-surface p-6">
                <div className="grid grid-cols-2 gap-4 mb-6">
                  {[
                    { label: "TITLE", value: preview.title || "Untitled Mission" },
                    { label: "TRACK", value: preview.track || track },
                    { label: "DIFFICULTY", value: preview.difficulty || difficulty },
                    {
                      label: "ESTIMATED TIME",
                      value: `${preview.time_limit_minutes || 60} minutes`,
                    },
                  ].map((item) => (
                    <div key={item.label}>
                      <div className="mono-label mb-1 text-[10px]">{item.label}</div>
                      <div className="text-[14px] font-medium text-ink">{item.value}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Business context */}
              {preview.business_context && (
                <div className="rounded-2xl border border-border bg-surface p-6">
                  <h4 className="mono-label mb-3 text-[10px]">BUSINESS CONTEXT</h4>
                  <p className="text-[13px] text-foreground leading-relaxed">{preview.business_context}</p>
                </div>
              )}

              {/* Objectives */}
              {preview.objectives && (
                <div className="rounded-2xl border border-border bg-surface p-6">
                  <h4 className="mono-label mb-3 text-[10px]">OBJECTIVES</h4>
                  <ul className="space-y-2">
                    {(Array.isArray(preview.objectives) ? preview.objectives : [preview.objectives])
                      .slice(0, 5)
                      .map((obj: string, i: number) => (
                        <li key={i} className="text-[13px] text-foreground flex gap-2">
                          <span className="font-semibold">•</span>
                          {obj}
                        </li>
                      ))}
                  </ul>
                </div>
              )}

              {/* Success criteria preview */}
              {preview.success_criteria && (
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-6">
                  <div className="flex items-start gap-2 mb-3">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 mt-0.5" />
                    <h4 className="font-medium text-emerald-900">Success Criteria</h4>
                  </div>
                  <p className="text-[12px] text-emerald-800">
                    This mission includes {Array.isArray(preview.success_criteria) ? preview.success_criteria.length : "multiple"}{" "}
                    validation criteria that learners must satisfy to complete the challenge.
                  </p>
                </div>
              )}

              {/* Fault configuration */}
              {preview.fault_configuration && (
                <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6">
                  <div className="flex items-start gap-2 mb-3">
                    <AlertCircle className="h-4 w-4 text-amber-600 mt-0.5" />
                    <h4 className="font-medium text-amber-900">Initial Fault State</h4>
                  </div>
                  <p className="text-[12px] text-amber-800">
                    This mission starts with intentional faults that learners must diagnose and repair.
                  </p>
                </div>
              )}

              {/* Generation metadata */}
              <div className="rounded-2xl border border-border bg-surface p-4">
                <div className="text-[11px] text-foreground/60 font-mono">
                  <p>Generated: {new Date().toLocaleString()}</p>
                  <p>Mission ID: {preview.mission_id?.slice(0, 16) || "Not yet saved"}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <style>{`@keyframes cfFadeSlideUp { from { opacity:0; transform:translateY(10px); } to { opacity:1; transform:translateY(0); } }`}</style>
    </div>
  );
}
