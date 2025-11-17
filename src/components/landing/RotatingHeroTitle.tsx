import { useState, useEffect } from "react";
import { TITLE_ROTATIONS } from "@/lib/constants/session-constants";

export const RotatingHeroTitle = () => {
  const [currentTitleIndex, setCurrentTitleIndex] = useState(0);
  const [titleFade, setTitleFade] = useState(true);

  useEffect(() => {
    const titleInterval = setInterval(() => {
      setTitleFade(false);
      setTimeout(() => {
        setCurrentTitleIndex((prevIndex) =>
          (prevIndex + 1) % TITLE_ROTATIONS.length
        );
        setTitleFade(true);
      }, 600);
    }, 5000);

    return () => clearInterval(titleInterval);
  }, []);

  return (
    <div className="text-center mb-8">
      <div className="inline-block">
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-light tracking-tight text-white mb-2">
          1-Minute{" "}
          <span
            className={`inline-block transition-opacity duration-500 bg-gradient-to-r from-purple-400 via-pink-300 to-blue-300 bg-clip-text text-transparent font-medium min-w-[200px] ${
              titleFade ? "opacity-100" : "opacity-0"
            }`}
          >
            {TITLE_ROTATIONS[currentTitleIndex]}
          </span>
        </h1>
      </div>
      <p className="text-base sm:text-lg text-white/60 font-light tracking-wide">
        build beautiful feelings, in sound
      </p>
    </div>
  );
};
