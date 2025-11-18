export const base64ToBlob = (base64: string, type: string = "audio/mpeg"): Blob => {
  const byteCharacters = atob(base64);
  const byteNumbers = new Array(byteCharacters.length);
  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i);
  }
  const byteArray = new Uint8Array(byteNumbers);
  return new Blob([byteArray], { type });
};

export const initAudioContext = (): AudioContext | null => {
  if (typeof window === 'undefined') return null;

  const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
  if (!AudioContextClass) return null;

  const context = new AudioContextClass();
  if (context.state === 'suspended') {
    context.resume();
    console.log('AudioContext resumed');
  }

  return context;
};

export const setupNormalAudio = (audioUrl: string): HTMLAudioElement => {
  return new Audio(audioUrl);
};

export const setup3DAudio = (
  audioUrl: string,
  audioContext: AudioContext
): { audio: HTMLAudioElement; panner: PannerNode } | null => {
  if (!audioContext) return null;

  const audio = new Audio(audioUrl);

  // Create Web Audio API nodes
  const source = audioContext.createMediaElementSource(audio);
  const panner = audioContext.createPanner();

  // Configure panner for 3D binaural effect
  panner.panningModel = 'HRTF';
  panner.distanceModel = 'inverse';
  panner.refDistance = 1;
  panner.maxDistance = 10;
  panner.rolloffFactor = 1;
  panner.coneInnerAngle = 360;
  panner.coneOuterAngle = 0;
  panner.coneOuterGain = 0;

  // Connect: source -> panner -> destination
  source.connect(panner);
  panner.connect(audioContext.destination);

  return { audio, panner };
};

export const start3DAnimation = (panner: PannerNode): NodeJS.Timeout => {
  let angle = 0;
  const radius = 2; // Distance from listener
  const speed = 0.02; // Rotation speed (radians per frame)

  return setInterval(() => {
    const x = Math.cos(angle) * radius;
    const z = Math.sin(angle) * radius;
    const y = Math.sin(angle * 2) * 0.5; // Add vertical movement

    panner.setPosition(x, y, z);
    angle += speed;

    if (angle > Math.PI * 2) {
      angle = 0;
    }
  }, 50); // Update every 50ms for smooth movement
};
