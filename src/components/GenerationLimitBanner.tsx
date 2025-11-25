import { useState, useEffect } from 'react';
import { Sparkles } from 'lucide-react';

interface GenerationLimitBannerProps {
  remaining?: number;
  limit?: number;
  tier?: string;
}

export const GenerationLimitBanner = ({ remaining, limit, tier }: GenerationLimitBannerProps) => {
  const [isVisible, setIsVisible] = useState(true);
  const [shouldRender, setShouldRender] = useState(true);

  useEffect(() => {
    // Iniciar fade-out a los 9.5 segundos
    const fadeOutTimer = setTimeout(() => {
      setIsVisible(false);
    }, 9500);

    // Remover del DOM a los 10 segundos (después del fade-out)
    const removeTimer = setTimeout(() => {
      setShouldRender(false);
    }, 10000);

    return () => {
      clearTimeout(fadeOutTimer);
      clearTimeout(removeTimer);
    };
  }, []);

  // Solo mostrar para usuarios free con datos válidos
  if (tier !== 'free' || remaining === undefined || limit === undefined) {
    return null;
  }

  if (!shouldRender) {
    return null;
  }

  return (
    <div className={`
      absolute top-4 left-0 right-0 z-40 flex justify-center px-4
      transition-all duration-500
      ${isVisible ? 'animate-fade-in opacity-100' : 'opacity-0 -translate-y-2'}
    `}>
      <div className="bg-card/80 backdrop-blur-md border border-border/50 rounded-lg px-4 py-3 shadow-lg">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Sparkles className="w-4 h-4 text-primary" />
          <span>
            <span className="font-medium text-foreground">{remaining}</span> of {limit} generations remaining this week
          </span>
        </div>
      </div>
    </div>
  );
};
