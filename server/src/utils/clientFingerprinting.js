/**
 * Advanced Client-Side Fingerprinting Utilities
 * These functions run on the client to generate comprehensive device fingerprints
 */

/**
 * Generate comprehensive device fingerprint
 * This should be called from the client and sent to the server
 */
export const generateComprehensiveFingerprint = async () => {
  const fingerprint = {
    // Basic info
    userAgent: navigator.userAgent,
    language: navigator.language,
    languages: navigator.languages,
    platform: navigator.platform,
    hardwareConcurrency: navigator.hardwareConcurrency,
    deviceMemory: navigator.deviceMemory,
    maxTouchPoints: navigator.maxTouchPoints,

    // Screen info
    screen: {
      width: window.screen.width,
      height: window.screen.height,
      colorDepth: window.screen.colorDepth,
      pixelDepth: window.screen.pixelDepth,
      devicePixelRatio: window.devicePixelRatio,
    },

    // Timezone
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    timezoneOffset: new Date().getTimezoneOffset(),

    // Canvas fingerprint
    canvas: await getCanvasFingerprint(),

    // WebGL fingerprint
    webgl: getWebGLFingerprint(),

    // Audio context fingerprint
    audio: getAudioContextFingerprint(),

    // Fonts
    fonts: getInstalledFonts(),

    // Plugins
    plugins: getPluginList(),

    // Local storage
    localStorage: !!window.localStorage,
    sessionStorage: !!window.sessionStorage,
    indexedDB: !!window.indexedDB,

    // Features
    features: {
      webWorker: typeof Worker !== 'undefined',
      serviceWorker: 'serviceWorker' in navigator,
      webGL: !!getWebGLContext(),
      webRTC: !!(
        window.RTCPeerConnection ||
        window.webkitRTCPeerConnection ||
        window.mozRTCPeerConnection
      ),
      geolocation: !!navigator.geolocation,
      notification: !!window.Notification,
      vibration: !!navigator.vibrate,
    },

    // Timestamp
    timestamp: Date.now(),
  };

  return fingerprint;
};

/**
 * Get canvas fingerprint
 */
export const getCanvasFingerprint = async () => {
  try {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) return null;

    canvas.width = 280;
    canvas.height = 60;

    // Draw text
    ctx.textBaseline = 'top';
    ctx.font = '14px Arial';
    ctx.textBaseline = 'alphabetic';
    ctx.fillStyle = '#f60';
    ctx.fillRect(125, 1, 62, 20);
    ctx.fillStyle = '#069';
    ctx.fillText('Browser Fingerprint', 2, 15);
    ctx.fillStyle = 'rgba(102, 204, 0, 0.7)';
    ctx.fillText('Browser Fingerprint', 4, 17);

    // Draw shapes
    ctx.globalCompositeOperation = 'multiply';
    ctx.fillStyle = 'rgb(255,0,255)';
    ctx.beginPath();
    ctx.arc(50, 50, 50, 0, Math.PI * 2, true);
    ctx.fill();

    ctx.fillStyle = 'rgb(0,255,255)';
    ctx.beginPath();
    ctx.arc(100, 50, 50, 0, Math.PI * 2, true);
    ctx.fill();

    return canvas.toDataURL();
  } catch (error) {
    console.error('Canvas fingerprint error:', error);
    return null;
  }
};

/**
 * Get WebGL fingerprint
 */
export const getWebGLFingerprint = () => {
  try {
    const canvas = document.createElement('canvas');
    const gl =
      canvas.getContext('webgl') || canvas.getContext('experimental-webgl');

    if (!gl) return null;

    const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
    if (!debugInfo) return null;

    return {
      vendor: gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL),
      renderer: gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL),
    };
  } catch (error) {
    console.error('WebGL fingerprint error:', error);
    return null;
  }
};

/**
 * Get audio context fingerprint
 */
export const getAudioContextFingerprint = () => {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return null;

    const context = new AudioContext();
    const oscillator = context.createOscillator();
    const analyser = context.createAnalyser();
    const gainNode = context.createGain();
    const scriptProcessor = context.createScriptProcessor(4096, 1, 1);

    gainNode.gain.value = 0; // Mute
    oscillator.connect(analyser);
    analyser.connect(scriptProcessor);
    scriptProcessor.connect(gainNode);
    gainNode.connect(context.destination);

    oscillator.start(0);

    return {
      sampleRate: context.sampleRate,
      channelCount: context.destination.maxChannelCount,
      state: context.state,
    };
  } catch (error) {
    console.error('Audio context fingerprint error:', error);
    return null;
  }
};

/**
 * Get installed fonts
 */
export const getInstalledFonts = () => {
  const baseFonts = ['monospace', 'sans-serif', 'serif'];
  const testFonts = [
    'Arial',
    'Verdana',
    'Helvetica',
    'Times New Roman',
    'Courier New',
    'Georgia',
    'Palatino',
    'Garamond',
    'Bookman',
    'Comic Sans MS',
    'Trebuchet MS',
    'Impact',
  ];

  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  const testString = 'mmmmmmmmmmlli';
  const textSize = '72px';

  const getWidth = (font) => {
    ctx.font = `${textSize} ${font}`;
    return ctx.measureText(testString).width;
  };

  const baseFontWidths = {};
  baseFonts.forEach((font) => {
    baseFontWidths[font] = getWidth(font);
  });

  const detectedFonts = [];
  testFonts.forEach((font) => {
    let detected = false;
    baseFonts.forEach((baseFont) => {
      const width = getWidth(`'${font}', ${baseFont}`);
      if (width !== baseFontWidths[baseFont]) {
        detected = true;
      }
    });
    if (detected) {
      detectedFonts.push(font);
    }
  });

  return detectedFonts;
};

/**
 * Get plugin list
 */
export const getPluginList = () => {
  const plugins = [];

  if (navigator.plugins) {
    for (let i = 0; i < navigator.plugins.length; i++) {
      const plugin = navigator.plugins[i];
      plugins.push({
        name: plugin.name,
        description: plugin.description,
        version: plugin.version,
      });
    }
  }

  return plugins;
};

/**
 * Get WebGL context
 */
const getWebGLContext = () => {
  try {
    const canvas = document.createElement('canvas');
    return (
      canvas.getContext('webgl') || canvas.getContext('experimental-webgl')
    );
  } catch (error) {
    return null;
  }
};

/**
 * Detect WebRTC leak (real IP detection)
 */
export const detectWebRTCLeak = async () => {
  return new Promise((resolve) => {
    try {
      const peerConnection = new (window.RTCPeerConnection ||
        window.webkitRTCPeerConnection ||
        window.mozRTCPeerConnection)({
        iceServers: [],
      });

      const candidates = [];

      peerConnection.onicecandidate = (ice) => {
        if (ice && ice.candidate) {
          candidates.push(ice.candidate.candidate);
        }
      };

      peerConnection
        .createDataChannel('')
        .then(() => {
          peerConnection.createOffer().then((offer) => {
            peerConnection.setLocalDescription(offer);
          });
        })
        .catch(() => {
          resolve(null);
        });

      setTimeout(() => {
        resolve(candidates);
      }, 1000);
    } catch (error) {
      console.error('WebRTC leak detection error:', error);
      resolve(null);
    }
  });
};

/**
 * Detect location spoofing indicators
 */
export const detectLocationSpoofingIndicators = async () => {
  const indicators = {
    mockLocationDetected: false,
    unrealisticAccuracy: false,
    warnings: [],
  };

  try {
    if (!navigator.geolocation) {
      indicators.warnings.push('Geolocation not available');
      return indicators;
    }

    const position = await new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(resolve, reject, {
        timeout: 5000,
        enableHighAccuracy: true,
      });
    });

    const { accuracy } = position.coords;

    // Unrealistic accuracy (< 1 meter is suspicious)
    if (accuracy < 1) {
      indicators.unrealisticAccuracy = true;
      indicators.warnings.push('Unrealistic GPS accuracy detected');
    }

    // Check for mock location (Android)
    if (navigator.permissions) {
      try {
        const result = await navigator.permissions.query({
          name: 'geolocation',
        });
        if (result.state === 'denied') {
          indicators.mockLocationDetected = true;
          indicators.warnings.push('Mock location likely detected');
        }
      } catch (error) {
        // Permissions API not available
      }
    }

    return indicators;
  } catch (error) {
    console.error('Location spoofing detection error:', error);
    return indicators;
  }
};

/**
 * Hash fingerprint data
 */
export const hashFingerprint = async (fingerprint) => {
  const data = JSON.stringify(fingerprint);
  const encoder = new TextEncoder();
  const dataBuffer = encoder.encode(data);
  const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
  return hashHex;
};

/**
 * Send fingerprint to server
 */
export const sendFingerprintToServer = async (fingerprint) => {
  try {
    const hash = await hashFingerprint(fingerprint);

    const response = await fetch('/api/device/fingerprint', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        fingerprint,
        hash,
        timestamp: Date.now(),
      }),
    });

    return await response.json();
  } catch (error) {
    console.error('Fingerprint submission error:', error);
    return null;
  }
};
