import { useEffect, useState } from 'react';

export type PlatformProfile = {
  width: number;
  height: number;
  orientation: 'portrait' | 'landscape';
  deviceClass: 'phone' | 'tablet' | 'desktop' | 'foldable';
  hasCoarsePointer: boolean;
  hasFinePointer: boolean;
  isTouchPreferred: boolean;
  safeAreaClass: string;
};

function readProfile(): PlatformProfile {
  const width = window.innerWidth;
  const height = window.innerHeight;
  const shortest = Math.min(width, height);
  const longest = Math.max(width, height);
  const orientation = height >= width ? 'portrait' : 'landscape';
  const hasCoarsePointer = window.matchMedia('(pointer: coarse)').matches;
  const hasFinePointer = window.matchMedia('(pointer: fine)').matches;
  const aspect = longest / Math.max(1, shortest);

  let deviceClass: PlatformProfile['deviceClass'] = 'desktop';
  if (hasCoarsePointer && shortest < 600) deviceClass = 'phone';
  else if (hasCoarsePointer && shortest < 980) deviceClass = 'tablet';
  if (hasCoarsePointer && shortest >= 600 && aspect > 1.85) deviceClass = 'foldable';

  return {
    width,
    height,
    orientation,
    deviceClass,
    hasCoarsePointer,
    hasFinePointer,
    isTouchPreferred: hasCoarsePointer && (!hasFinePointer || width < 1100),
    safeAreaClass: `platform-${deviceClass} orientation-${orientation}`,
  };
}

export function usePlatformProfile(): PlatformProfile {
  const [profile, setProfile] = useState<PlatformProfile>(() => readProfile());

  useEffect(() => {
    const update = () => setProfile(readProfile());
    window.addEventListener('resize', update);
    window.addEventListener('orientationchange', update);
    const coarse = window.matchMedia('(pointer: coarse)');
    const fine = window.matchMedia('(pointer: fine)');
    coarse.addEventListener?.('change', update);
    fine.addEventListener?.('change', update);
    return () => {
      window.removeEventListener('resize', update);
      window.removeEventListener('orientationchange', update);
      coarse.removeEventListener?.('change', update);
      fine.removeEventListener?.('change', update);
    };
  }, []);

  return profile;
}
