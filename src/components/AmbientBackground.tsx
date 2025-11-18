interface AmbientBackgroundProps {
  isPlaying: boolean;
  videoKey?: string;
}

const AmbientBackground = ({ isPlaying, videoKey = 'home' }: AmbientBackgroundProps) => {
  // Mapeo de experiencias a videos
  const videoMap: Record<string, string> = {
    // Home/Default
    'home': '/videos/home.mp4',
    'default': '/videos/ambient-bg.mp4',
    
    // Moods
    'relax': '/videos/moods/relax.mp4',
    'sleep': '/videos/moods/sleep.mp4',
    'focus': '/videos/moods/focus.mp4',
    'gratitude': '/videos/moods/gratitude.mp4',
    'boost': '/videos/moods/boost.mp4',
    'stoic': '/videos/moods/stoic.mp4',
    
    // Ambients
    'rain': '/videos/ambients/rain.mp4',
    'ocean': '/videos/ambients/ocean.mp4',
    'forest': '/videos/ambients/forest.mp4',
    'fireplace': '/videos/ambients/fireplace.mp4',
    'whitenoise': '/videos/ambients/whitenoise.mp4',
    'city': '/videos/ambients/city.mp4',
    
    // Binaural
    'barbershop': '/videos/binaural/barbershop.mp4',
    'spa': '/videos/binaural/spa.mp4',
    'ear-cleaning': '/videos/binaural/ear-cleaning.mp4',
    'bedtime': '/videos/binaural/bedtime.mp4',
    'art-studio': '/videos/binaural/art-studio.mp4',
    'yoga': '/videos/binaural/yoga.mp4',
    
    // Voice Journeys
    'story': '/videos/voice/story.mp4',
    'prayer': '/videos/voice/prayer.mp4',
    'stoic-voice': '/videos/voice/stoic-voice.mp4',
    'manifestation': '/videos/voice/manifestation.mp4',
    'motivational': '/videos/voice/motivational.mp4',
    'brainwash': '/videos/voice/brainwash.mp4',
    'fullattention': '/videos/voice/fullattention.mp4',
    
    // Backup
    'creator': '/videos/backup/creator.mp4',
  };

  const videoSrc = videoMap[videoKey] || videoMap['home'];
  
  // Opacidad más baja para home, normal para sesiones
  const opacity = videoKey === 'home' ? 'opacity-[0.15]' : 'opacity-30';

  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
      {/* Video background layer */}
      <video
        key={videoKey}
        autoPlay
        loop
        muted
        playsInline
        className={`absolute inset-0 w-full h-full object-cover ${opacity} transition-opacity duration-1000`}
        style={{
          filter: 'hue-rotate(260deg) saturate(0.8) brightness(0.6)'
        }}
      >
        <source src={videoSrc} type="video/mp4" />
      </video>
      
      {/* Gradient overlay for blend */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-accent/10" />
      
      {/* Floating particles - solo cuando está playing */}
      {isPlaying && (
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
      )}
    </div>
  );
};

export default AmbientBackground;
