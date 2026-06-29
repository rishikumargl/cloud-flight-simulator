import { createFileRoute } from "@tanstack/react-router";
import { AlertCircle, Settings } from "lucide-react";

export const Route = createFileRoute("/_protected/admin/policy")({
  head: () => ({ meta: [{ title: "Enterprise Policy — Admin" }] }),
  component: EnterprisePolicy,
});

function EnterprisePolicy() {
  return (
    <div className="space-y-8 pb-16">
      <div style={{ animation: "cfFadeSlideUp 0.5s ease both" }}>
        <h1 className="font-display text-[28px] font-medium tracking-[-0.025em] text-ink mb-2">
          Enterprise Policy Studio
        </h1>
        <p className="text-[14px] text-foreground">
          Configure organization-specific policies, constraints, and customizations for AI mission generation.
        </p>
      </div>

      {/* Backend not implemented notice */}
      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6">
        <div className="flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5 shrink-0" />
          <div>
            <h3 className="font-medium text-amber-900 mb-1">Backend Policy Service Not Implemented</h3>
            <p className="text-[13px] text-amber-800">
              This page is ready for enterprise customization. The UI framework is in place, but the backend
              policy storage and retrieval service has not yet been implemented. Contact your platform administrator
              to enable persistent policy configuration.
            </p>
          </div>
        </div>
      </div>

      {/* Coming soon placeholder */}
      <div className="rounded-2xl border border-border bg-surface p-12 text-center">
        <div className="flex items-center justify-center h-16 w-16 rounded-full bg-blue-50 text-blue-600 mx-auto mb-4">
          <Settings className="h-8 w-8" />
        </div>
        <h3 className="font-display text-[18px] font-medium text-ink mb-2">Coming Soon</h3>
        <p className="text-foreground text-[14px] mb-4">
          This interface will allow enterprise administrators to configure organization-specific policies
          that govern how the AI generates missions and evaluations.
        </p>
      </div>

      {/* Policy categories */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {[
          {
            section: "Mission Generation",
            fields: [
              "Allowed Tracks",
              "Maximum Difficulty",
              "Mandatory Skill Focus",
              "Estimated Time Limits",
            ],
          },
          {
            section: "GCP Configuration",
            fields: [
              "Enabled Services",
              "Disabled Services",
              "Allowed Regions",
              "Cost Limits",
            ],
          },
          {
            section: "Compliance & Security",
            fields: [
              "Security Focus Level",
              "Compliance Requirements",
              "Data Protection Rules",
              "Audit Logging",
            ],
          },
          {
            section: "Brand & Style",
            fields: [
              "Organization Logo",
              "Brand Colors",
              "Custom Instructions",
              "Mission Narrative Style",
            ],
          },
        ].map((category) => (
          <div key={category.section} className="rounded-2xl border border-border bg-surface p-5">
            <h4 className="font-medium text-ink mb-3">{category.section}</h4>
            <ul className="space-y-2">
              {category.fields.map((field) => (
                <li key={field} className="text-[12px] text-foreground flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-muted" />
                  {field}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <style>{`@keyframes cfFadeSlideUp { from { opacity:0; transform:translateY(10px); } to { opacity:1; transform:translateY(0); } }`}</style>
    </div>
  );
}
