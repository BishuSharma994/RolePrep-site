import { useEffect, useState } from "react";

interface DeviceProfile {
  width: number;
  height: number;
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  isTouch: boolean;
  canHover: boolean;
  prefersReducedMotion: boolean;
  isStandalone: boolean;
}

function readDeviceProfile(): DeviceProfile {
  const width = window.innerWidth;
  const height = window.innerHeight;
  const isTouch = window.matchMedia("(pointer: coarse)").matches;
  const canHover = window.matchMedia("(hover: hover)").matches;
  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const isStandalone =
    window.matchMedia("(display-mode: standalone)").matches ||
    (window.navigator as Navigator & { standalone?: boolean }).standalone === true;

  return {
    width,
    height,
    isMobile: width < 768,
    isTablet: width >= 768 && width < 1200,
    isDesktop: width >= 1200,
    isTouch,
    canHover,
    prefersReducedMotion,
    isStandalone,
  };
}

export function useDeviceProfile() {
  const [profile, setProfile] = useState<DeviceProfile>(() => readDeviceProfile());

  useEffect(() => {
    const mediaQueries = [
      window.matchMedia("(pointer: coarse)"),
      window.matchMedia("(hover: hover)"),
      window.matchMedia("(prefers-reduced-motion: reduce)"),
      window.matchMedia("(display-mode: standalone)"),
    ];

    const updateProfile = () => {
      setProfile(readDeviceProfile());
    };

    updateProfile();
    window.addEventListener("resize", updateProfile);
    window.addEventListener("orientationchange", updateProfile);
    mediaQueries.forEach((query) => query.addEventListener("change", updateProfile));

    return () => {
      window.removeEventListener("resize", updateProfile);
      window.removeEventListener("orientationchange", updateProfile);
      mediaQueries.forEach((query) => query.removeEventListener("change", updateProfile));
    };
  }, []);

  return profile;
}
