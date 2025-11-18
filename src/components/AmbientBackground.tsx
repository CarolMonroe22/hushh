interface AmbientBackgroundProps {
  isPlaying: boolean;
}

const AmbientBackground = ({ isPlaying }: AmbientBackgroundProps) => {
  if (!isPlaying) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
      {/* Video background layer */}
      <video
        autoPlay
        loop
        muted
        playsInline
        className="absolute inset-0 w-full h-full object-cover opacity-30"
        style={{
          filter: 'hue-rotate(260deg) saturate(0.8) brightness(0.6)'
        }}
      >
        <source src="/videos/ambient-bg.mp4" type="video/mp4" />
      </video>
      
      {/* Gradient overlay for blend */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-accent/10" />
      
      {/* Floating particles */}
      <div className="absolute inset-0">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full bg-primary/20"
            style={{
              width: `${Math.random() * 6 + 2}px`,
              height: `${Math.random() * 6 + 2}px`,
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animation: `float ${Math.random() * 10 + 15}s ease-in-out infinite`,
              animationDelay: `${Math.random() * 5}s`,
              opacity: Math.random() * 0.3 + 0.1,
            }}
          />
        ))}
      </div>
    </div>
  );
};

export default AmbientBackground;
