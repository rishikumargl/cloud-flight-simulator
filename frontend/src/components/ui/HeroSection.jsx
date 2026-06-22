import Logo from './Logo';

export default function HeroSection({
  greeting = 'Welcome back',
  userName = 'Learner',
  headline = 'Ready for your next mission?',
  subheadline = 'Continue your cloud learning journey',
  cta = null,
  backgroundGradient = 'from-primary-600 to-sky-500',
  icon = 'logo',
  compact = false,
}) {
  return (
    <div
      className={`relative bg-gradient-to-r ${backgroundGradient} rounded-3xl overflow-hidden ${
        compact ? 'p-8 md:p-10' : 'p-10 md:p-16'
      } text-white`}
    >
      {/* Decorative Elements */}
      <div className="absolute -top-20 -right-20 w-40 h-40 bg-white/10 rounded-full blur-3xl" />
      <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-white/10 rounded-full blur-3xl" />

      {/* Content */}
      <div className="relative z-10">
        <div className="flex items-start gap-4 mb-6">
          <div className="text-5xl">
            {icon === 'logo' ? (
              <Logo size={48} className="text-white" />
            ) : (
              icon
            )}
          </div>
          <div>
            <p className="text-sm font-semibold text-white/80 uppercase tracking-wide">
              {greeting}
            </p>
            <h1 className={`${compact ? 'text-3xl' : 'text-4xl md:text-5xl'} font-bold text-white font-display`}>
              {userName}
            </h1>
          </div>
        </div>

        <h2
          className={`${
            compact ? 'text-2xl' : 'text-3xl md:text-4xl'
          } font-bold text-white mb-3 font-display`}
        >
          {headline}
        </h2>

        <p className="text-lg text-white/90 mb-8 max-w-2xl">
          {subheadline}
        </p>

        {cta && <div className="flex gap-4">{cta}</div>}
      </div>
    </div>
  );
}
