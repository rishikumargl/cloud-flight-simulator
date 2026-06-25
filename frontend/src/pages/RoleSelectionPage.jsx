import { useNavigate } from 'react-router-dom';
import { ArrowRight, Zap, Target, BookOpen } from 'lucide-react';
import Button from '../components/ui/Button';
import Logo from '../components/ui/Logo';

export default function RoleSelectionPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen grid grid-cols-1 md:grid-cols-2">
      {/* Left Side - Dark Visual Design */}
      <div className="relative bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 overflow-hidden flex items-center justify-center p-6 md:p-12">
        {/* Animated grid background */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute inset-0 bg-[linear-gradient(0deg,transparent_24%,rgba(59,130,246,.05)_25%,rgba(59,130,246,.05)_26%,transparent_27%,transparent_74%,rgba(59,130,246,.05)_75%,rgba(59,130,246,.05)_76%,transparent_77%,transparent)] bg-[length:50px_50px]"></div>
        </div>

        {/* Glowing elements */}
        <div className="absolute top-20 left-10 w-40 h-40 bg-orange-500/20 rounded-full blur-3xl opacity-50 animate-pulse"></div>
        <div className="absolute bottom-32 right-20 w-32 h-32 bg-primary-600/20 rounded-full blur-3xl opacity-40"></div>

        {/* Plus symbols for visual interest */}
        <div className="absolute top-1/4 left-1/4 text-orange-500/40 text-3xl">+</div>
        <div className="absolute bottom-1/3 right-1/4 text-orange-500/30 text-2xl">+</div>
        <div className="absolute top-1/3 right-1/3 text-primary-500/30 text-2xl">+</div>

        {/* Content */}
        <div className="relative z-10 text-center md:text-left max-w-lg">
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-white leading-tight mb-4">
            Learn.<br />
            <span className="text-orange-500">Simulate.</span><br />
            Master.
          </h1>
          <p className="text-lg text-slate-300 mt-6">
            Real-world cloud engineering missions powered by AI, tailored to your journey.
          </p>
        </div>
      </div>

      {/* Right Side - Light Content */}
      <div className="bg-white flex flex-col items-center justify-center p-6 md:p-12">
        <div className="w-full max-w-md space-y-8">
          {/* Header */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-gradient-to-br from-primary-600 to-primary-700 rounded-lg flex items-center justify-center">
                <Logo size={20} className="text-white" />
              </div>
              <span className="text-sm font-semibold text-cloud-600 tracking-wide">CLOUDFLIGHT</span>
            </div>
            <h2 className="text-4xl font-bold text-cloud-900">Simulator</h2>
            <p className="text-orange-600 font-semibold text-lg">Learning Platform</p>
          </div>

          {/* Description */}
          <div className="space-y-4">
            <p className="text-lg text-cloud-700 leading-relaxed font-medium">
              AI-Generated Cloud Missions
            </p>
            <p className="text-base text-cloud-600 leading-relaxed">
              Learn cloud engineering through personalized, real-world scenarios in temporary Google Cloud environments with instant AI-powered feedback.
            </p>
          </div>

          {/* Key Features */}
          <div className="space-y-3 py-4">
            <div className="flex items-start gap-3">
              <Zap className="w-5 h-5 text-orange-500 flex-shrink-0 mt-1" />
              <span className="text-sm text-cloud-700">Personalized AI-generated missions</span>
            </div>
            <div className="flex items-start gap-3">
              <Target className="w-5 h-5 text-orange-500 flex-shrink-0 mt-1" />
              <span className="text-sm text-cloud-700">Real GCP labs with instant evaluation</span>
            </div>
            <div className="flex items-start gap-3">
              <BookOpen className="w-5 h-5 text-orange-500 flex-shrink-0 mt-1" />
              <span className="text-sm text-cloud-700">Adaptive difficulty & recommendations</span>
            </div>
          </div>

          {/* CTA Button */}
          <div className="space-y-4 pt-4">
            <Button
              onClick={() => navigate('/login')}
              variant="primary"
              size="lg"
              className="w-full gap-2 py-3 text-base font-semibold rounded-xl"
            >
              Get Started <ArrowRight className="w-5 h-5" />
            </Button>
            <p className="text-xs text-center text-cloud-500">
              No credit card required • Free forever tier
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
