/**
 * Generate a simple device fingerprint on the client side
 * This will be sent with attendance requests
 */
export const generateClientFingerprint = () => {
  const components = [
    navigator.userAgent,
    navigator.language,
    navigator.platform,
    screen.colorDepth,
    screen.width + 'x' + screen.height,
    new Date().getTimezoneOffset(),
    navigator.hardwareConcurrency || 'unknown',
    navigator.deviceMemory || 'unknown',
  ];

  return btoa(components.join('|'));
};

/**
 * Get detailed device information
 */
export const getDeviceInfo = () => {
  return {
    userAgent: navigator.userAgent,
    platform: navigator.platform,
    language: navigator.language,
    screenResolution: `${screen.width}x${screen.height}`,
    colorDepth: screen.colorDepth,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    timezoneOffset: new Date().getTimezoneOffset(),
    hardwareConcurrency: navigator.hardwareConcurrency,
    deviceMemory: navigator.deviceMemory,
    fingerprint: generateClientFingerprint(),
  };
};

/**
 * Detect if user is using developer tools (basic check)
 */
export const detectDevTools = () => {
  const threshold = 160;
  return (
    window.outerWidth - window.innerWidth > threshold ||
    window.outerHeight - window.innerHeight > threshold
  );
};

/**
 * Track tab visibility changes
 */
export const trackTabVisibility = (callback) => {
  let tabSwitches = 0;

  const handleVisibilityChange = () => {
    if (document.hidden) {
      tabSwitches++;
      callback(tabSwitches);
    }
  };

  document.addEventListener('visibilitychange', handleVisibilityChange);

  return () => {
    document.removeEventListener('visibilitychange', handleVisibilityChange);
  };
};

/**
 * Calculate attention time (time with tab visible)
 */
export const trackAttentionTime = () => {
  let startTime = Date.now();
  let totalTime = 0;
  let isVisible = !document.hidden;

  const handleVisibilityChange = () => {
    if (document.hidden) {
      // Tab hidden - stop counting
      if (isVisible) {
        totalTime += Date.now() - startTime;
        isVisible = false;
      }
    } else {
      // Tab visible - start counting
      if (!isVisible) {
        startTime = Date.now();
        isVisible = true;
      }
    }
  };

  document.addEventListener('visibilitychange', handleVisibilityChange);

  return {
    getAttentionTime: () => {
      if (isVisible) {
        return totalTime + (Date.now() - startTime);
      }
      return totalTime;
    },
    cleanup: () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    },
  };
};
