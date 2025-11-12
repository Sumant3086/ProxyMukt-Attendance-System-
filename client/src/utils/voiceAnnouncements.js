/**
 * Voice Announcements Utility
 * Provides text-to-speech functionality for accessibility and enhanced UX
 */

class VoiceAnnouncer {
  constructor() {
    this.synth = window.speechSynthesis;
    this.enabled = localStorage.getItem('voiceEnabled') === 'true';
    this.voice = null;
    this.initVoice();
  }

  initVoice() {
    if (!this.synth) return;

    const setVoice = () => {
      const voices = this.synth.getVoices();
      // Prefer English voices
      this.voice = voices.find(v => v.lang.startsWith('en')) || voices[0];
    };

    setVoice();
    this.synth.onvoiceschanged = setVoice;
  }

  enable() {
    this.enabled = true;
    localStorage.setItem('voiceEnabled', 'true');
  }

  disable() {
    this.enabled = false;
    localStorage.setItem('voiceEnabled', 'false');
    this.cancel();
  }

  toggle() {
    if (this.enabled) {
      this.disable();
    } else {
      this.enable();
    }
    return this.enabled;
  }

  isEnabled() {
    return this.enabled;
  }

  speak(text, options = {}) {
    if (!this.enabled || !this.synth) return;

    // Cancel any ongoing speech
    this.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.voice = this.voice;
    utterance.rate = options.rate || 1.0;
    utterance.pitch = options.pitch || 1.0;
    utterance.volume = options.volume || 1.0;

    this.synth.speak(utterance);
  }

  cancel() {
    if (this.synth) {
      this.synth.cancel();
    }
  }

  // Predefined announcements
  announceAttendanceMarked(studentName) {
    this.speak(`Attendance marked successfully for ${studentName}. Welcome!`);
  }

  announceAttendanceError(reason) {
    this.speak(`Attendance marking failed. ${reason}`);
  }

  announceSessionStarted(className) {
    this.speak(`Session started for ${className}. Students can now mark their attendance.`);
  }

  announceSessionEnded(className, attendanceCount, totalStudents) {
    const percentage = ((attendanceCount / totalStudents) * 100).toFixed(0);
    this.speak(`Session ended for ${className}. ${attendanceCount} out of ${totalStudents} students attended. That's ${percentage} percent.`);
  }

  announceLocationVerified(distance) {
    this.speak(`Location verified. You are ${distance} meters from the session location.`);
  }

  announceLocationFailed(distance, allowed) {
    this.speak(`Location verification failed. You are ${distance} meters away, but only ${allowed} meters is allowed.`);
  }

  announceStreak(days) {
    if (days === 1) {
      this.speak(`Congratulations! You've started your attendance streak!`);
    } else if (days === 7) {
      this.speak(`Amazing! You've reached a 7-day streak! Keep it up!`);
    } else if (days === 30) {
      this.speak(`Incredible! 30-day streak achieved! You're a legend!`);
    } else if (days % 10 === 0) {
      this.speak(`Fantastic! ${days}-day streak! You're doing great!`);
    }
  }

  announceAtRisk(percentage) {
    this.speak(`Warning: Your attendance is at ${percentage} percent, which is below the required 75 percent. Please attend more classes.`);
  }

  announceWelcome(userName, role) {
    const greeting = this.getGreeting();
    this.speak(`${greeting}, ${userName}. Welcome to the attendance system.`);
  }

  getGreeting() {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  }
}

// Create singleton instance
const voiceAnnouncer = new VoiceAnnouncer();

export default voiceAnnouncer;
