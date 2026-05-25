import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import confetti from "canvas-confetti";
import { 
  Wind, 
  Play, 
  RotateCcw, 
  HelpCircle, 
  Volume2, 
  Volume1, 
  VolumeX, 
  Calendar, 
  Clock, 
  TrendingUp, 
  Trash2, 
  Activity,
  Heart,
  Award,
  Sparkles,
  ChevronDown,
  Info
} from "lucide-react";

// --- Types ---
interface CompletedSession {
  id: string;
  timestamp: number;
  durationSeconds: number;
  exhalesTracked: number;
  finalScore: number;
  bonusApplied: boolean;
  averageIntervalSeconds: number;
  respirationRateBpm: number;
  mood?: string;
  notes?: string;
  intervals?: number[];
  consistencyScore?: number;
  standardDeviation?: number;
}

// --- Consistency & Standard Deviation Helper ---
function calculateConsistencyMetrics(timestamps: number[]) {
  if (!timestamps || timestamps.length < 2) {
    return {
      intervals: [] as number[],
      mean: 0,
      stdDev: 0,
      score: 0,
      minInterval: 0,
      maxInterval: 0
    };
  }

  const intervals: number[] = [];
  for (let i = 1; i < timestamps.length; i++) {
    const diff = (timestamps[i] - timestamps[i - 1]) / 1000;
    intervals.push(parseFloat(diff.toFixed(2)));
  }

  const n = intervals.length;
  const mean = parseFloat((intervals.reduce((sum, val) => sum + val, 0) / n).toFixed(2));

  let variance = 0;
  if (n > 1) {
    const squaredDiffsSum = intervals.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0);
    variance = squaredDiffsSum / (n - 1);
  }
  const stdDev = parseFloat(Math.sqrt(variance).toFixed(2));

  let score = 100;
  if (stdDev <= 0.4) {
    score = Math.round(100 - (stdDev * 10));
  } else if (stdDev <= 1.2) {
    score = Math.round(98 - (stdDev * 12));
  } else if (stdDev <= 2.5) {
    score = Math.round(94 - (stdDev * 16));
  } else {
    score = Math.max(15, Math.round(85 - (stdDev * 12)));
  }

  const minInterval = Math.min(...intervals);
  const maxInterval = Math.max(...intervals);

  return {
    intervals,
    mean,
    stdDev,
    score,
    minInterval,
    maxInterval
  };
}

// --- Audio Synthesizer (Pure Web Audio API) ---
class ZenAudioEngine {
  private ctx: AudioContext | null = null;
  public enabled: boolean = true;

  private initCtx() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  // Plays a beautiful, deep, warm bronze temple bell/singing bowl sound
  playGong() {
    if (!this.enabled) return;
    try {
      this.initCtx();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;

      // Base carrier frequency (C3 / 130.81Hz or lower bell frequencies)
      const frequencies = [130.81, 196.00, 261.63, 311.13, 392.00]; // Rich overtone spectrum
      const gains = [0.4, 0.25, 0.15, 0.1, 0.08];

      const masterGain = this.ctx.createGain();
      masterGain.gain.setValueAtTime(0, now);
      masterGain.gain.linearRampToValueAtTime(0.5, now + 0.1);
      masterGain.gain.exponentialRampToValueAtTime(0.001, now + 5.0); // Long rich decay
      masterGain.connect(this.ctx.destination);

      frequencies.forEach((freq, idx) => {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const bandGain = this.ctx.createGain();

        // Mix sine and triangle for bell acoustics 
        osc.type = idx % 2 === 0 ? 'sine' : 'triangle';
        osc.frequency.setValueAtTime(freq, now);

        bandGain.gain.setValueAtTime(gains[idx], now);
        // Slightly faster decay for higher frequency partials for a realistic acoustic model
        bandGain.gain.exponentialRampToValueAtTime(0.001, now + (5.0 - idx * 0.5));

        osc.connect(bandGain);
        bandGain.connect(masterGain);
        osc.start(now);
        osc.stop(now + 6.0);
      });
    } catch (e) {
      console.warn("ZenAudioEngine Gong play failed", e);
    }
  }

  // Plays a gentle, ambient chime drop indicating an inhale or exhale registration
  playSoftChime() {
    if (!this.enabled) return;
    try {
      this.initCtx();
      if (!this.ctx) return;
      
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gainNode = this.ctx.createGain();
      const delay = this.ctx.createDelay();
      const feedback = this.ctx.createGain();

      osc.type = 'sine';
      // Harmonic high-pitched crystal tone (E5 / 659.25Hz)
      osc.frequency.setValueAtTime(659.25, now);
      osc.frequency.exponentialRampToValueAtTime(440.00, now + 0.3); // Gentle downward glide

      gainNode.gain.setValueAtTime(0.18, now);
      gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.7);

      // Simple slapback eco for spaciousness
      delay.delayTime.setValueAtTime(0.18, now);
      feedback.gain.setValueAtTime(0.3, now);

      osc.connect(gainNode);
      gainNode.connect(this.ctx.destination);

      // Route through delay loop
      gainNode.connect(delay);
      delay.connect(feedback);
      feedback.connect(delay);
      delay.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 1.0);
    } catch (e) {
      console.warn("ZenAudioEngine SoftChime failed", e);
    }
  }

  // Soft woodblock click / warm pulse
  playClick() {
    if (!this.enabled) return;
    try {
      this.initCtx();
      if (!this.ctx) return;

      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gainNode = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(320.00, now);

      gainNode.gain.setValueAtTime(0.15, now);
      gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.1);

      osc.connect(gainNode);
      gainNode.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.15);
    } catch (e) {
      console.warn("ZenAudioEngine Click failed", e);
    }
  }
}

const audio = new ZenAudioEngine();

export default function App() {
  // --- States ---
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [sessionTime, setSessionTime] = useState<number>(660); // 11 minutes = 660s
  const [maxDuration, setMaxDuration] = useState<number>(660); // Track limit configured
  const [totalExhales, setTotalExhales] = useState<number>(0);
  const [lastExhaleTime, setLastExhaleTime] = useState<number | null>(null);
  const [tapTimestamps, setTapTimestamps] = useState<number[]>([]);
  
  // LED Status: 'standby' | 'active' | 'completed'
  const [ledStatus, setLedStatus] = useState<'standby' | 'active' | 'completed'>('standby');
  
  // Audio state
  const [soundOn, setSoundOn] = useState<boolean>(true);
  
  // Custom Visual Breathing Sync Guide ('inhale' | 'hold' | 'exhale' | 'hold-out')
  const [breathPhase, setBreathPhase] = useState<'inhale' | 'hold' | 'exhale' | 'hold-out'>('inhale');
  const [phaseProgress, setPhaseProgress] = useState<number>(0); // 0 to 100 for gauge filling

  // Configuration drawer / modal helper
  const [isHelpOpen, setIsHelpOpen] = useState<boolean>(false);
  
  // Post-Session Summary states
  const [sessionSummary, setSessionSummary] = useState<CompletedSession | null>(null);
  const [selectedSessionForReport, setSelectedSessionForReport] = useState<CompletedSession | null>(null);
  const [journalMood, setJournalMood] = useState<string>("🧘 Serene");
  const [journalNotes, setJournalNotes] = useState<string>("");
  const [history, setHistory] = useState<CompletedSession[]>([]);

  // Debug/Quick-test mode variable flag (1 minute instead of 10)
  const [isQuickMode, setIsQuickMode] = useState<boolean>(false);

  // Interval timer references
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number | null>(null);
  const actualStopRef = useRef<number | null>(null);

  // Speech Synthesis states and function
  const [activeSpokenLang, setActiveSpokenLang] = useState<'en' | 'hi' | null>(null);

  const speakConcept = (lang: 'en' | 'hi') => {
    if (!('speechSynthesis' in window)) {
      alert("Your browser does not support the Web Speech Synthesis API.");
      return;
    }

    if (activeSpokenLang === lang) {
      window.speechSynthesis.cancel();
      setActiveSpokenLang(null);
      return;
    }

    window.speechSynthesis.cancel();

    let text = "";
    let voiceLang = "";
    if (lang === 'en') {
      text = "Welcome to Tenmin Shwas Club. Scientific research shows that steady breathing at five to seven point five cycles per minute signals physical peace. Tap the center bubble gently exactly on each exhalation to secure your custom session rhythm.";
      voiceLang = "en-US";
    } else {
      text = "टेनमिन श्वास क्लब में आपका स्वागत है। श्वास विज्ञान के अनुसार, प्रति मिनट पाँच से साढे सात बार सांस लेना शारीरिक शांति को दर्शाता है। प्रत्येक बार सांस बाहर छोड़ते समय बीच के गोलाकार बटन को धीरे से छुएं, ताकि हम आपकी अनूठी श्वास गति को दर्ज कर सकें।";
      voiceLang = "hi-IN";
    }

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = voiceLang;

    // Try to find a language-specific voice in the browser lists
    const voices = window.speechSynthesis.getVoices();
    const matchingVoice = voices.find(v => v.lang.startsWith(voiceLang)) || 
                          voices.find(v => v.lang.startsWith(lang));
    if (matchingVoice) {
      utterance.voice = matchingVoice;
    }

    // Gentle rates for a serene atmosphere
    utterance.rate = 0.85;
    utterance.pitch = lang === 'en' ? 0.95 : 1.0;

    utterance.onend = () => {
      setActiveSpokenLang(null);
    };

    utterance.onerror = () => {
      setActiveSpokenLang(null);
    };

    setActiveSpokenLang(lang);
    window.speechSynthesis.speak(utterance);
  };

  // Ensure any active reading is cancelled on unmount
  useEffect(() => {
    return () => {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  // Sync internal sound toggler
  useEffect(() => {
    audio.enabled = soundOn;
  }, [soundOn]);

  // Load history from localStorage inside browser
  useEffect(() => {
    let cached = localStorage.getItem("tenmin_shwas_history");
    if (!cached) {
      cached = localStorage.getItem("tenmin_history");
    }
    if (cached) {
      try {
        setHistory(JSON.parse(cached));
      } catch (e) {
        console.error("Invalid history format inside local storage", e);
      }
    }
  }, []);

  // Sync breathing phase cycle in background to help users align with the tool
  useEffect(() => {
    let interval: NodeJS.Timeout;
    let elapsed = 0;
    
    // Total cycle duration: 10 seconds. Inhale 4s, Hold 2s, Exhale 4s.
    const runCycle = () => {
      elapsed = (elapsed + 100) % 10000;
      setPhaseProgress(Math.floor((elapsed / 10000) * 100));

      if (elapsed < 4000) {
        setBreathPhase('inhale');
      } else if (elapsed < 5000) {
        setBreathPhase('hold');
      } else if (elapsed < 9000) {
        setBreathPhase('exhale');
      } else {
        setBreathPhase('hold-out');
      }
    };

    interval = setInterval(runCycle, 100);
    return () => clearInterval(interval);
  }, []);

  // Quick Mode dynamic session length switch
  useEffect(() => {
    if (!isRunning) {
      const targetSeconds = isQuickMode ? 60 : 660;
      setSessionTime(targetSeconds);
      setMaxDuration(targetSeconds);
    }
  }, [isQuickMode, isRunning]);

  // Handle countdown interval
  useEffect(() => {
    if (isRunning) {
      timerRef.current = setInterval(() => {
        setSessionTime((prev) => {
          if (prev <= 1) {
            // Reached exactly 00:00! Trigger automation immediately on state tick
            clearInterval(timerRef.current!);
            handleSessionComplete();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRunning, tapTimestamps, lastExhaleTime, totalExhales, maxDuration]);

  // --- Core Functions ---

  // Start Session
  const startSession = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setActiveSpokenLang(null);

    // Play deep introductory gong chime
    audio.playGong();
    
    // Set timer & flags
    setIsRunning(true);
    setLedStatus('active');
    setTotalExhales(0);
    setLastExhaleTime(null);
    setTapTimestamps([]);
    setSessionSummary(null);
    startTimeRef.current = Date.now();
    actualStopRef.current = null;
  };

  // Pause Session
  const pauseSession = () => {
    setIsRunning(false);
    audio.playClick();
  };

  // Reset Session
  const resetSession = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setActiveSpokenLang(null);
    setIsRunning(false);
    setLedStatus('standby');
    setSessionTime(isQuickMode ? 60 : 660);
    setTotalExhales(0);
    setLastExhaleTime(null);
    setTapTimestamps([]);
    setSessionSummary(null);
    startTimeRef.current = null;
    actualStopRef.current = null;
    audio.playClick();
  };

  // Handle Exhale Tap Click
  const handleExhaleTap = () => {
    if (!isRunning) return;
    
    audio.playSoftChime();
    
    const now = Date.now();
    setTotalExhales((prev) => prev + 1);
    setLastExhaleTime(now);
    setTapTimestamps((prev) => [...prev, now]);
  };

  // Helper to trigger a serene, high-end confetti celebration
  const triggerZenConfetti = () => {
    const colors = ["#245E5A", "#1B8C5A", "#84A59D", "#E6E1D8"];
    // Main celebratory center-bottom burst
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.65 },
      colors: colors
    });
    
    // Staggered side showers for high-end professional polish
    setTimeout(() => {
      confetti({
        particleCount: 35,
        angle: 60,
        spread: 55,
        origin: { x: 0.1, y: 0.7 },
        colors: colors
      });
    }, 250);

    setTimeout(() => {
      confetti({
        particleCount: 35,
        angle: 120,
        spread: 55,
        origin: { x: 0.9, y: 0.7 },
        colors: colors
      });
    }, 450);
  };

  // Triggers when the countdown reaches 00:00 automatically
  const handleSessionComplete = () => {
    setIsRunning(false);
    setLedStatus('completed');
    audio.playGong();
    triggerZenConfetti();

    const stopTime = Date.now();
    actualStopRef.current = stopTime;

    // Evaluate final rules: "And an increment to be done if last click vs stop time is more than 8 seconds."
    let finalScore = totalExhales;
    let bonusApplied = false;

    if (totalExhales > 0 && lastExhaleTime !== null) {
      const msSinceLastTap = stopTime - lastExhaleTime;
      if (msSinceLastTap > 8000) {
        finalScore = totalExhales + 1;
        bonusApplied = true;
      }
    }

    // Advanced analytics
    // Calculate respiration statistics
    let avgDeltaSecs = 0;
    if (tapTimestamps.length > 1) {
      let sumDeltas = 0;
      for (let i = 1; i < tapTimestamps.length; i++) {
        sumDeltas += (tapTimestamps[i] - tapTimestamps[i - 1]) / 1000;
      }
      avgDeltaSecs = parseFloat((sumDeltas / (tapTimestamps.length - 1)).toFixed(1));
    } else if (tapTimestamps.length === 1 && startTimeRef.current) {
      // Just one tap
      avgDeltaSecs = parseFloat(((tapTimestamps[0] - startTimeRef.current) / 1000).toFixed(1));
    } else {
      avgDeltaSecs = 0;
    }

    // Calculate breath rate (Breaths Per Minute in active segment)
    const activeDurationMins = maxDuration / 60;
    const respirationRateBpm = parseFloat((finalScore / activeDurationMins).toFixed(1));

    const consistencyMetrics = calculateConsistencyMetrics(tapTimestamps);

    const summary: CompletedSession = {
      id: Math.random().toString(36).substr(2, 9),
      timestamp: stopTime,
      durationSeconds: maxDuration,
      exhalesTracked: totalExhales,
      finalScore: finalScore,
      bonusApplied: bonusApplied,
      averageIntervalSeconds: avgDeltaSecs || 8.5, // default healthy pace if zero
      respirationRateBpm: respirationRateBpm,
      intervals: consistencyMetrics.intervals,
      consistencyScore: consistencyMetrics.score,
      standardDeviation: consistencyMetrics.stdDev
    };

    setSessionSummary(summary);
    setJournalNotes("");
  };

  // Commit session metadata back to localStorage
  const saveJournalEntry = () => {
    if (!sessionSummary) return;

    const freshEntry: CompletedSession = {
      ...sessionSummary,
      mood: journalMood,
      notes: journalNotes
    };

    const updatedHistory = [freshEntry, ...history];
    setHistory(updatedHistory);
    localStorage.setItem("tenmin_shwas_history", JSON.stringify(updatedHistory));
    
    // Clear summary to reset view beautifully
    setSessionSummary(null);
    setLedStatus('standby');
    setSessionTime(isQuickMode ? 60 : 660);
    setTotalExhales(0);
    setLastExhaleTime(null);
    setTapTimestamps([]);
    
    audio.playClick();
  };

  // Delete a history entry
  const deleteHistoryItem = (id: string) => {
    const updated = history.filter(item => item.id !== id);
    setHistory(updated);
    localStorage.setItem("tenmin_shwas_history", JSON.stringify(updated));
    audio.playClick();
  };

  // Format seconds to high-end MM:SS design
  const formatTime = (secs: number) => {
    const minutes = Math.floor(secs / 60);
    const seconds = secs % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  // Helper colors for Breath Phase visuals
  const getPhaseColor = () => {
    switch (breathPhase) {
      case 'inhale': return 'bg-white text-natural-teal border-natural-border';
      case 'hold': return 'bg-white/90 text-amber-700 border-amber-200';
      case 'exhale': return 'bg-natural-teal text-white border-natural-teal';
      case 'hold-out': return 'bg-stone-100 text-natural-charcoal border-natural-border';
    }
  };

  return (
    <div className="min-h-screen bg-natural-bg text-natural-charcoal font-sans tracking-normal overflow-x-hidden relative flex flex-col justify-between">
      
      {/* Dynamic Background visual breathing guide expansion with Natural Tones colors */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none select-none z-0">
        <div 
          className={`absolute rounded-full left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 blur-[140px] opacity-20 transition-all duration-[4000ms] ease-in-out ${
            isRunning 
              ? breathPhase === 'inhale' 
                ? 'w-[650px] h-[650px] bg-natural-teal scale-125' 
                : breathPhase === 'exhale'
                ? 'w-[480px] h-[480px] bg-[#a8c3bd] scale-95'
                : 'w-[520px] h-[520px] bg-amber-100/70'
              : 'w-[400px] h-[400px] bg-natural-border/40'
          }`}
        />
        <div className="absolute top-12 left-12 w-[350px] h-[350px] bg-radial from-natural-ring/70 to-transparent blur-[80px] opacity-60 animate-slow-pulse" />
      </div>

      {/* --- Header / Branding --- */}
      <header className="w-full max-w-7xl mx-auto px-6 py-4 flex flex-col md:flex-row items-center justify-between gap-3 z-10 relative">
        <div className="flex items-center gap-3">
          {/* Logo SVG (Perfect Natural Tones styling) */}
          <div className="w-9 h-9 rounded-full bg-natural-teal flex items-center justify-center shadow-md">
            <div className="w-4.5 h-4.5 border-2 border-white rounded-full"></div>
          </div>
          <div>
            <h1 className="text-xl font-serif font-bold tracking-tight text-natural-dark flex flex-wrap items-baseline gap-1">
              Tenmin Shwas <span className="font-sans font-bold tracking-widest text-natural-teal text-xs uppercase">Club</span>
            </h1>
            <p className="text-[9px] font-mono font-bold uppercase tracking-widest text-stone-600">Mindful breath metrics</p>
          </div>
        </div>

        {/* Status LED, Demo Video & Navigation Actions */}
        <div className="flex flex-wrap items-center justify-center gap-3">
          
          {/* Vibrant Demo Video Button - opens in new window */}
          <a
            href="https://youtu.be/bYcgxW4lDmw?si=xq6NsoY6W3kYYiZE"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-3 py-1.5 bg-red-700 hover:bg-red-800 text-white rounded-full text-[10px] uppercase tracking-wider font-bold transition-all shadow hover:shadow-md cursor-pointer border border-red-800 group"
            id="video-demo-btn"
            title="Watch Demo Video"
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
            </span>
            <span>For Demo see video</span>
          </a>

          {/* Visual LED Indicator Pillar (Active green / Standby red style) */}
          <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border transition-all duration-300 shadow-sm ${
            ledStatus === 'active' 
              ? 'bg-emerald-50/80 border-emerald-300 text-emerald-800' 
              : 'bg-rose-50/80 border-rose-300 text-rose-800'
          }`}>
            {/* Elegant pulsing LED bulb */}
            <span className="relative flex h-2 w-2">
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                ledStatus === 'active' ? 'bg-emerald-400' : 'bg-rose-400'
              }`}></span>
              <span className={`relative inline-flex rounded-full h-2 w-2 transition-all duration-500 ${
                ledStatus === 'active' 
                  ? 'bg-emerald-600 shadow-[0_0_8px_rgba(27,140,90,0.8)]' 
                  : 'bg-rose-600 shadow-[0_0_8px_rgba(225,29,72,0.8)]'
              }`} />
            </span>
            <span className="text-[9px] font-sans tracking-widest font-extrabold uppercase">
              {ledStatus === 'active' ? 'Session Active' : 'Standby'}
            </span>
          </div>

          {/* Sound toggle action */}
          <button 
            onClick={() => setSoundOn(!soundOn)}
            className="p-1.5 rounded-full bg-white hover:bg-stone-50 hover:shadow shadow-sm border border-natural-border text-natural-teal transition-all cursor-pointer"
            title={soundOn ? "Mute sounds" : "Unmute sounds"}
            id="sound-toggle-btn"
          >
            {soundOn ? <Volume2 size={16} /> : <VolumeX size={16} className="text-rose-600 font-bold" />}
          </button>

          {/* Guide Helper button */}
          <button 
            onClick={() => setIsHelpOpen(true)}
            className="p-1.5 rounded-full bg-white hover:bg-stone-50 hover:shadow shadow-sm border border-natural-border text-natural-teal transition-all cursor-pointer"
            title="Session details & concept science"
            id="help-toggle-btn"
          >
            <HelpCircle size={16} />
          </button>
        </div>
      </header>

      {/* --- Main Contents Frame --- */}
      <main className="w-full max-w-7xl mx-auto px-6 py-2 md:py-4 grid grid-cols-1 lg:grid-cols-12 gap-5 z-10 relative flex-1 items-center">
        
        {/* Left Side: Custom History & Journal (4 Cols) */}
        <section className="lg:col-span-4 flex flex-col gap-6 h-full justify-start order-2 lg:order-1">
          {/* Intro Information Bubble */}
          <div className="bg-white p-5 rounded-2xl border border-natural-border shadow-sm flex flex-col gap-3">
            <div>
              <h3 className="text-xs font-bold text-natural-dark uppercase tracking-wider mb-2 font-sans flex items-center gap-1.5">
                <Activity size={14} className="text-natural-teal" />
                The Tenmin Shwas Concept
              </h3>
              <p className="text-[12.5px] text-natural-charcoal font-medium leading-relaxed">
                Steady breathing at 5 to 7.5 cycles per minute signals physical peace. Tap the center bubble gently exactly on each exhalation to secure your custom session rhythm.
              </p>
            </div>
            
            {/* Pronunciation / Concept Audio Player Button Controls */}
            <div className="pt-3 border-t border-natural-border flex flex-col sm:flex-row gap-2 mt-1">
              <button
                onClick={() => speakConcept('en')}
                className={`flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                  activeSpokenLang === 'en'
                    ? 'bg-natural-teal border-natural-teal text-white shadow-sm animate-pulse'
                    : 'bg-[#FAF9F6] border-natural-border text-natural-teal hover:bg-natural-ring'
                }`}
                title={activeSpokenLang === 'en' ? "Stop English voice readout" : "Listen Concept in English"}
                id="speak-concept-en-btn"
              >
                <Volume1 size={14} className={activeSpokenLang === 'en' ? 'animate-bounce' : ''} />
                <span>{activeSpokenLang === 'en' ? 'Stop Voice' : 'Listen (English)'}</span>
              </button>
              <button
                onClick={() => speakConcept('hi')}
                className={`flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                  activeSpokenLang === 'hi'
                    ? 'bg-natural-teal border-natural-teal text-white shadow-sm animate-pulse'
                    : 'bg-[#FAF9F6] border-natural-border text-natural-teal hover:bg-natural-ring'
                }`}
                title={activeSpokenLang === 'hi' ? "Hindi aawaz band karein" : "Concepts Hindi mein sunein"}
                id="speak-concept-hi-btn"
              >
                <Volume1 size={14} className={activeSpokenLang === 'hi' ? 'animate-bounce' : ''} />
                <span>{activeSpokenLang === 'hi' ? 'Stop Voice' : 'सुनें (Hindi)'}</span>
              </button>
            </div>
          </div>

          {/* Past Breath Logs Dashboard */}
          <div className="bg-white p-6 rounded-2xl border border-natural-border shadow-md flex-1 flex flex-col justify-between min-h-[300px]">
            <div>
              <div className="flex items-center justify-between mb-4 pb-2 border-b border-natural-border">
                <span className="text-sm font-serif font-bold text-natural-dark flex items-center gap-2">
                  <Calendar size={15} className="text-natural-teal" />
                  Your Club Journal
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 bg-natural-teal/10 text-natural-teal rounded-full font-black">
                  {history.length} Sessions
                </span>
              </div>

              {history.length === 0 ? (
                <div className="py-12 text-center text-stone-500 flex flex-col items-center justify-center gap-2">
                  <Heart size={24} className="stroke-[2] text-stone-400" />
                  <p className="text-xs font-bold text-stone-700">No records logged yet.</p>
                  <p className="text-[11px] text-stone-600 max-w-[200px] mx-auto mt-1 leading-relaxed">Your saved breathe completions will populate here.</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-[260px] overflow-y-auto pr-1">
                  {history.map((item) => (
                    <div 
                      key={item.id}
                      className="p-3 bg-[#FAF9F6] rounded-xl border border-natural-border flex flex-col justify-between hover:bg-natural-ring transition-colors"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] font-mono font-bold text-stone-600">
                          {new Date(item.timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </span>
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => setSelectedSessionForReport(item)}
                            className="text-stone-500 hover:text-natural-teal p-0.5 rounded transition-all cursor-pointer flex items-center justify-center scale-100 hover:scale-110"
                            title="View breathing consistency breakdown"
                            id={`report-${item.id}`}
                          >
                            <TrendingUp size={13} className="stroke-[2.5]" />
                          </button>
                          <button 
                            onClick={() => deleteHistoryItem(item.id)}
                            className="text-stone-500 hover:text-rose-600 p-0.5 rounded transition-colors cursor-pointer flex items-center justify-center scale-100 hover:scale-110 animate-none"
                            title="Delete entry"
                            id={`del-${item.id}`}
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </div>

                      <div className="flex items-baseline justify-between mt-1">
                        <span className="text-lg font-serif font-bold text-natural-dark">
                          Value: {item.finalScore}
                          {item.bonusApplied && <span className="text-[11px] text-emerald-700 ml-1 font-sans font-bold" title="Terminal breath complete bonus applied">+1</span>}
                        </span>
                        <span className="text-[10.5px] text-stone-700 font-mono font-bold">
                          {item.respirationRateBpm} BPM • {item.averageIntervalSeconds}s Rate
                        </span>
                      </div>

                      {item.mood && (
                        <div className="flex items-center gap-1.5 mt-2 pt-1.5 border-t border-natural-border text-[10px] text-stone-850">
                          <span className="font-extrabold text-natural-teal">{item.mood}</span>
                          {item.notes && <span className="text-stone-700 font-medium truncate max-w-[150px]"> - {item.notes}</span>}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {history.length > 0 && (
              <div className="mt-4 pt-3 border-t border-natural-border flex items-center justify-between text-xs text-stone-700 font-bold">
                <span>Average Value:</span>
                <span className="font-mono font-black text-natural-teal text-sm">
                  {parseFloat((history.reduce((acc, curr) => acc + curr.finalScore, 0) / history.length).toFixed(1))}
                </span>
              </div>
            )}
          </div>
        </section>

        {/* Right Side: Primary Active Breath Core Workspace (8 Cols) */}
        <section className="lg:col-span-8 flex flex-col items-center justify-center gap-4 order-1 lg:order-2">
          
          {/* Inner Header/Timer Workspace Block */}
          <div className="text-center w-full flex flex-col items-center -mb-2">
            {isRunning ? (
              <div className="h-[96px] flex flex-col items-center justify-center w-full max-w-sm px-4" id="active-activity-bar-container">
                <div className="w-full h-3 bg-[#E6E1D8] rounded-full overflow-hidden relative shadow-inner border border-stone-200">
                  <div className="absolute left-0 top-0 bottom-0 w-32 animate-activity-scan">
                    <div className="w-full h-full bg-gradient-to-r from-emerald-400 via-teal-400 via-cyan-400 via-sky-500 via-indigo-500 to-purple-500 rounded-full animate-gradient-flow shadow-[0_0_12px_rgba(16,185,129,0.8)]" />
                  </div>
                </div>
                <span className="text-[10px] font-mono tracking-widest text-emerald-800 font-extrabold uppercase mt-3 flex items-center gap-1.5 animate-pulse bg-emerald-50 border border-emerald-100 px-3 py-1 rounded-full shadow-xs">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 inline-block animate-ping" />
                  Measurement in progress
                </span>
              </div>
            ) : (
              <h1 
                id="timer-display" 
                className="text-[72px] md:text-[96px] font-light leading-none tracking-tighter text-natural-dark"
              >
                {formatTime(sessionTime)}
              </h1>
            )}
            <p className="text-natural-teal font-serif italic text-base md:text-lg transition-all duration-700 mt-1">
              {isRunning ? "Stay present in this moment" : "A calm mind awaits"}
            </p>
          </div>

          {/* Breath Box & Floating Controls Container */}
          <div className="w-full bg-white rounded-3xl p-4 md:p-6 border border-natural-border shadow-[0_20px_50px_rgba(0,0,0,0.03)] flex flex-col items-center justify-center relative overflow-hidden">
            
            {/* Interactive Trial / Testing Badge */}
            <div className="absolute top-4 right-4 flex items-center gap-2 bg-natural-ring px-2.5 py-0.5 rounded-full text-natural-teal border border-natural-border text-xs">
              <span className="font-sans font-bold text-[10px] tracking-wide text-natural-teal">Quick Test</span>
              <input 
                type="checkbox" 
                checked={isQuickMode} 
                onChange={(e) => setIsQuickMode(e.target.checked)}
                disabled={isRunning}
                className="w-3 h-3 accent-[#245E5A] bg-gray-100 border-gray-300 rounded cursor-pointer"
                id="quick-mode-checkbox"
              />
            </div>

            {/* Inhale/Exhale Text helper guides of current visual rhythm */}
            <div className="mb-3 h-8 flex flex-col items-center justify-center text-center">
              {isRunning ? (
                <motion.div
                  key={breathPhase}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className={`px-3.5 py-1 rounded-full text-[11px] font-bold tracking-wider uppercase border ${getPhaseColor()} shadow-sm`}
                >
                  {breathPhase === 'inhale' && "🌬️ Breathe In... Feel the lungs expand"}
                  {breathPhase === 'hold' && "🧘 Hold... Rest in completeness"}
                  {breathPhase === 'exhale' && "✨ Breathe Out Slowly... Gently tap exhale"}
                  {breathPhase === 'hold-out' && "🍃 Soft Pause... Prepare to carry breath"}
                </motion.div>
              ) : (
                <div className="text-[11px] text-stone-700 font-semibold flex items-center gap-1.5">
                  <Sparkles size={13} className="text-natural-teal" />
                  <span>Position yourself comfortably and click Start below</span>
                </div>
              )}
            </div>

            {/* --- The central Breath Circle Button (Extracted styled group border pattern) --- */}
            <div className="relative w-52 h-52 md:w-64 md:h-64 flex items-center justify-center group mb-3">
              
              {/* Complex ambient breathing aura ring */}
              <div 
                className={`absolute inset-0 rounded-full border-2 border-dashed border-natural-teal/60 transition-transform duration-1000 ${
                  isRunning ? 'animate-[spin_120s_linear_infinite]' : 'rotate-45'
                }`} 
              />

              {/* Guided visual breath swell target */}
              {isRunning && (
                <div 
                  className="absolute inset-[10px] rounded-full transition-all duration-[4000ms] pointer-events-none animate-breath mix-blend-multiply opacity-25"
                />
              )}

              {/* The clickable button frame */}
              <button
                disabled={!isRunning}
                onClick={handleExhaleTap}
                className={`relative w-44 h-44 md:w-56 md:h-56 rounded-full flex flex-col items-center justify-center transition-all duration-500 outline-none select-none overflow-hidden ${
                  isRunning 
                    ? 'cursor-pointer active:scale-95 text-natural-charcoal bg-white border-[12px] border-natural-ring shadow-[0_15px_35px_rgba(0,0,0,0.06)] group-hover:border-natural-border' 
                    : 'cursor-not-allowed bg-stone-100 text-stone-500 border-[12px] border-natural-ring shadow-inner'
                }`}
                style={{ touchAction: 'manipulation' }}
                id="breath-circle-action-btn"
              >
                {/* Concentric helper text */}
                <div className="z-10 text-center px-4 flex flex-col items-center justify-center pointer-events-none selection:bg-transparent">
                  <span className={`text-sm md:text-base uppercase tracking-[0.2em] font-black block mb-1 md:mb-2 transition-colors duration-500 ${
                    isRunning ? 'text-natural-teal' : 'text-stone-500/80'
                  }`}>
                    Exhale
                  </span>
                  
                  <div className="w-10 h-[2px] bg-natural-border mb-3" />

                  {isRunning ? (
                    <>
                      <span className="text-stone-850 text-[11px] md:text-xs font-bold italic font-serif">
                        Tap to track exhale
                      </span>
                      <span className="text-[10px] md:text-[11px] font-sans font-bold tracking-widest text-white uppercase mt-2 md:mt-3 block bg-gradient-to-r from-emerald-500 via-teal-500 via-cyan-500 to-indigo-500 animate-gradient-flow px-3 py-1 rounded-full shadow-sm">
                        Flow Active
                      </span>
                    </>
                  ) : (
                    <span className="text-stone-500 text-[11px] md:text-xs font-bold italic font-serif">
                      Awaiting start
                    </span>
                  )}
                </div>

                {/* Tiny wave particle that spikes on click */}
                <span className="absolute bottom-4 font-mono text-[8px] md:text-[9px] tracking-widest uppercase text-stone-600 font-bold pointer-events-none z-10 selection:bg-transparent">
                  {isRunning ? "Cycle Active" : "Disabled"}
                </span>

              </button>
            </div>

            {/* --- Session Controls Actions --- */}
            <div className="mt-2 flex flex-col gap-2.5 w-full max-w-xs justify-center items-center">
              <AnimatePresence mode="wait">
                {!isRunning && ledStatus === 'standby' ? (
                  <motion.button
                    key="start-btn"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    onClick={startSession}
                    className="w-full bg-natural-teal hover:bg-natural-teal-hover text-white font-bold py-2.5 px-5 rounded-full shadow-sm hover:shadow transition-all flex items-center justify-center gap-2 text-[11px] uppercase tracking-widest cursor-pointer border border-transparent"
                    id="start-session-trigger-btn"
                  >
                    <Play size={13} fill="currentColor" />
                    Start Session ({isQuickMode ? "Quick Test" : "Measurement time"})
                  </motion.button>
                ) : (
                  <div className="flex gap-2 w-full justify-center">
                    {isRunning ? (
                      <button
                        onClick={pauseSession}
                        className="flex-1 bg-white hover:bg-stone-50 border border-natural-border text-natural-charcoal font-bold py-2 px-4 rounded-full text-[10px] uppercase tracking-widest transition-all cursor-pointer shadow-sm"
                        id="pause-session-btn"
                      >
                        Pause
                      </button>
                    ) : (
                      <button
                        onClick={startSession}
                        className="flex-1 bg-natural-teal hover:bg-natural-teal-hover text-white font-bold py-2 px-4 rounded-full text-[10px] uppercase tracking-widest transition-all cursor-pointer shadow-sm animate-pulse"
                        id="resume-session-btn"
                      >
                        Resume
                      </button>
                    )}
                    <button
                      onClick={resetSession}
                      className="p-2.5 bg-rose-50 hover:bg-rose-100/70 border border-rose-100 text-rose-600 rounded-full transition-colors cursor-pointer"
                      title="Reset Session"
                      id="reset-session-btn"
                    >
                      <RotateCcw size={15} />
                    </button>
                  </div>
                )}
              </AnimatePresence>
            </div>
            
            {/* Live Stats Row during Active meditations (Replaced stress-inducing counters with a second gorgeous vibrant activity flow bar) */}
            {isRunning && (
              <div className="mt-6 w-full max-w-sm pt-4 border-t border-natural-border/50 text-center animate-fade-in">
                <div className="bg-gradient-to-r from-emerald-50 via-teal-50 to-sky-50 rounded-2xl p-4 border border-natural-border/60 shadow-sm flex flex-col items-center gap-3">
                  <div className="w-full flex items-center justify-between text-[10px] font-sans font-bold text-stone-600 tracking-wider">
                    <span>MIND BALANCE</span>
                    <span className="text-emerald-700 animate-pulse uppercase">CONNECTED FLOW</span>
                  </div>
                  <div className="w-full h-4 bg-stone-100 rounded-full overflow-hidden relative border border-stone-200">
                    <div className="absolute inset-0 bg-gradient-to-r from-teal-400 via-emerald-400 via-cyan-400 via-sky-500 via-indigo-400 to-purple-500 animate-gradient-flow" style={{ width: '100%' }} />
                    <div className="absolute top-0 bottom-0 w-1/3 bg-white/35 skew-x-12 animate-[pulse_2s_infinite]" />
                  </div>
                  <p className="text-[10.5px] italic font-serif text-teal-950 leading-relaxed max-w-[240px]">
                    Let go of the count. Your patterns are being securely gathered underneath. Simply exhale and tap.
                  </p>
                </div>
              </div>
            )}

          </div>
        </section>
      </main>

      {/* --- Overlay Modal: Session Complete Summary Drawer --- */}
      <AnimatePresence>
        {sessionSummary && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-natural-dark/40 backdrop-blur-md">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[#FAF9F6] rounded-3xl p-6 md:p-8 w-full max-w-lg shadow-2xl border border-natural-border relative text-natural-charcoal"
              id="summary-info-popup"
            >
              <div className="text-center pb-5 mb-5 border-b border-natural-border/60">
                <div className="w-14 h-14 bg-[#E6E1D8] rounded-full flex items-center justify-center mx-auto mb-3 text-natural-teal shadow-inner">
                  <Award size={28} className="stroke-[2.5]" />
                </div>
                <h2 className="text-2xl font-serif font-bold text-natural-dark">Breathe Session Complete</h2>
                <p className="text-xs text-stone-700 mt-1 font-serif font-medium italic">Great job! Check your final scores. You are exactly where you belong.</p>
              </div>

              {/* Main Score Display Box */}
              <div className="bg-white p-6 rounded-2xl text-center border border-natural-border mb-6 relative overflow-hidden shadow-sm">
                <span className="block text-[10px] uppercase font-sans tracking-widest text-natural-teal font-extrabold mb-1">Your Tenmin Shwas Value</span>
                <div className="text-5xl font-serif font-black text-natural-dark mt-1 flex items-baseline justify-center">
                  <span>{sessionSummary.finalScore}</span>
                  <span className="text-xs font-sans font-bold tracking-widest text-natural-teal uppercase ml-1.5 font-sans">Value</span>
                </div>

                {/* Exact breakdown note detailing the terminal increment */}
                {sessionSummary.bonusApplied ? (
                  <div className="mt-3 px-3 py-2 bg-emerald-50 border border-emerald-100 rounded-lg text-[11px] text-emerald-900 font-semibold leading-relaxed max-w-sm mx-auto flex items-center justify-center gap-2 shadow-sm">
                    <Sparkles size={14} className="text-[#1B8C5A] shrink-0" />
                    <span>An extra exhale was added because your last tap occurred over 8.0s before the session timer completed.</span>
                  </div>
                ) : (
                  <div className="mt-3 text-[11.5px] font-bold text-stone-700">
                    Base exhale count completed: {sessionSummary.exhalesTracked}.
                  </div>
                )}
              </div>

              {/* Secondary Metrics Checklist */}
              <div className="grid grid-cols-2 gap-4 mb-4 text-xs text-natural-charcoal">
                <div className="bg-white p-3.5 rounded-xl border border-natural-border flex flex-col shadow-sm">
                  <span className="text-[10px] uppercase font-sans tracking-wider text-stone-600 font-extrabold">Average Interval</span>
                  <span className="font-serif font-black text-natural-dark text-base mt-1">{sessionSummary.averageIntervalSeconds}s / breath</span>
                </div>
                <div className="bg-white p-3.5 rounded-xl border border-natural-border flex flex-col shadow-sm">
                  <span className="text-[10px] uppercase font-sans tracking-wider text-stone-600 font-extrabold">Respiratory Rate</span>
                  <span className="font-serif font-black text-natural-dark text-base mt-1">{sessionSummary.respirationRateBpm} BPM</span>
                </div>
              </div>

              {/* Rhythm Consistency Preview */}
              <div className="bg-white border border-natural-border rounded-xl p-3.5 mb-6 flex items-center justify-between shadow-sm">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-natural-ring flex items-center justify-center text-natural-teal">
                    <TrendingUp size={16} />
                  </div>
                  <div className="text-left">
                    <span className="block text-[9.5px] uppercase font-sans tracking-widest text-stone-600 font-bold">Rhythm Stability</span>
                    <span className="font-serif font-bold text-xs text-natural-dark">
                      {sessionSummary.consistencyScore !== undefined 
                        ? `${sessionSummary.consistencyScore}% Stable (${sessionSummary.standardDeviation !== undefined && sessionSummary.standardDeviation <= 1.5 ? 'Very Steady' : 'Vibrant Flow'})` 
                        : 'Analytical Overview'}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedSessionForReport(sessionSummary)}
                  className="bg-[#FAF9F6] hover:bg-stone-50 border border-natural-border hover:border-natural-teal text-natural-teal hover:shadow-xs text-[10px] py-1 px-2.5 rounded-lg font-bold transition-all cursor-pointer flex items-center gap-1"
                  id="view-stability-report-btn"
                  title="View detailed stability standard deviation graph"
                >
                  <Activity size={12} />
                  <span>Report</span>
                </button>
              </div>

              {/* Journal / Log form */}
              <div className="space-y-3 pt-2 border-t border-natural-border/60">
                <span className="text-[10px] uppercase font-sans tracking-widest font-bold text-stone-400 block">Commit To Journal</span>
                
                {/* Mood buttons set */}
                <div className="grid grid-cols-4 gap-2">
                  {["🧘 Serene", "🕊️ Relaxed", "⚡ Focused", "🍂 Tired"].map((m) => (
                    <button
                      key={m}
                      onClick={() => setJournalMood(m)}
                      className={`py-1.5 px-1 rounded-lg text-[11px] transition-all cursor-pointer ${
                        journalMood === m 
                          ? 'bg-natural-teal text-white font-medium shadow-sm' 
                          : 'bg-white border border-natural-border text-stone-600 hover:bg-stone-50'
                      }`}
                    >
                      {m}
                    </button>
                  ))}
                </div>

                <div>
                  <textarea
                    placeholder="Reflect briefly on your breathe experience... (optional)"
                    value={journalNotes}
                    onChange={(e) => setJournalNotes(e.target.value)}
                    className="w-full text-xs p-3 rounded-xl border border-natural-border focus:outline-none focus:ring-1 focus:ring-natural-teal bg-white max-h-24 min-h-[60px]"
                  />
                </div>
              </div>

              {/* Summary drawer action steps */}
              <div className="flex gap-2 mt-6">
                <button
                  onClick={() => {
                    setSessionSummary(null);
                    setLedStatus('standby');
                    setSessionTime(isQuickMode ? 60 : 660);
                    setTotalExhales(0);
                    setLastExhaleTime(null);
                    setTapTimestamps([]);
                  }}
                  className="flex-1 bg-white hover:bg-stone-50 border border-natural-border text-stone-600 text-[11px] uppercase tracking-widest font-medium py-3 rounded-xl transition-all cursor-pointer"
                >
                  Discard
                </button>
                <button
                  onClick={saveJournalEntry}
                  className="flex-1 bg-natural-teal hover:bg-natural-teal-hover text-white text-[11px] uppercase tracking-widest font-semibold py-3 rounded-xl shadow-sm transition-all cursor-pointer border border-transparent"
                >
                  Save & Exit
                </button>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* --- Overlay Modal: Learn More / Help --- */}
      <AnimatePresence>
        {isHelpOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-natural-dark/30 backdrop-blur-md">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[#FAF9F6] rounded-3xl p-6 md:p-8 w-full max-w-lg shadow-2xl border border-natural-border relative text-xs max-h-[90vh] overflow-y-auto"
              id="help-drawer-popup"
            >
              <h2 className="text-xl font-serif font-medium text-natural-dark mb-4 pb-2 border-b border-natural-border/60">
                The Tenmin Shwas Concept
              </h2>
              
              <div className="space-y-4 text-stone-600 leading-relaxed text-xs">
                <p>
                  <strong>What is Tenmin Shwas Club?</strong><br />
                  A standard measurement session provides an ideal window to steady the nervous system, lower resting heart rates, and stabilize focus. Tenmin Shwas Club operates on the principle of self-tallying exhalations during continuous deep breathing.
                </p>

                <p>
                  <strong>How do I practice here?</strong><br />
                  1. Find a comfortable posture, relax your jaw, and let your hands fall loosely.<br />
                  2. Select either the standard measurement session or toggle "Quick Test" to trial the interface.<br />
                  3. Tap <strong>Start Session</strong>. The LED indicator turns active green.<br />
                  4. Every single time your lungs conclude a slow exhalation/out-breath, click or tap the central circular button.
                </p>

                <div className="p-3 bg-white border border-natural-border rounded-xl text-[11px] text-stone-700 leading-relaxed">
                  <strong>The Tenmin Shwas Metric Adjustment Explained:</strong><br />
                  If the measurement session runs down completely and the gap between your last registered exhale and 00:00 is larger than <strong>8 seconds</strong>, the tool automatically adds an adjustment cycle of +1 to your aggregate score. We assume a final, silent healthy breath flow was beautifully completed but not registered during the terminal buzzer transition.
                </div>

                <p>
                  We store all session summaries locally on your device within your web browser log. No personal databases are used, ensuring total privacy.
                </p>
              </div>

              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => setIsHelpOpen(false)}
                  className="bg-natural-teal hover:bg-natural-teal-hover text-white font-medium text-[11px] py-2 px-5 rounded-full shadow-sm transition-all cursor-pointer uppercase tracking-widest border border-transparent"
                  id="close-help-btn"
                >
                  Close & Continue
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* --- Overlay Modal: Detailed Breathing Consistency Report --- */}
      <AnimatePresence>
        {selectedSessionForReport && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-natural-dark/40 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[#FAF9F6] rounded-3xl p-6 md:p-8 w-full max-w-xl shadow-2xl border border-natural-border relative text-natural-charcoal max-h-[95vh] overflow-y-auto"
              id="consistency-report-modal"
            >
              <div className="flex items-center justify-between pb-4 mb-5 border-b border-natural-border/60">
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-full bg-natural-ring flex items-center justify-center text-natural-teal">
                    <TrendingUp size={18} />
                  </div>
                  <div className="text-left">
                    <h2 className="text-xl font-serif font-bold text-natural-dark">Rhythm Stability Report</h2>
                    <p className="text-[10px] font-mono text-stone-600 uppercase font-black">
                      Session Date: {new Date(selectedSessionForReport.timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedSessionForReport(null)}
                  className="w-7 h-7 flex items-center justify-center rounded-full bg-white hover:bg-stone-50 border border-natural-border hover:border-natural-teal/50 text-natural-teal text-[11px] font-black transition-all cursor-pointer shadow-xs"
                  title="Close Report"
                >
                  ✕
                </button>
              </div>

              {/* Stats Overview Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
                
                <div className="bg-white p-3 rounded-xl border border-natural-border text-center shadow-sm">
                  <span className="block text-[8.5px] uppercase font-sans tracking-wider text-stone-600 font-extrabold">Stability Score</span>
                  <span className="text-xl font-serif font-black text-natural-dark mt-1 block">
                    {selectedSessionForReport.consistencyScore !== undefined ? `${selectedSessionForReport.consistencyScore}%` : '85%'}
                  </span>
                  <span className="text-[9px] font-bold text-natural-teal uppercase tracking-widest mt-0.5 block">
                    {selectedSessionForReport.standardDeviation !== undefined 
                      ? selectedSessionForReport.standardDeviation <= 0.8
                        ? "Perfect Zen"
                        : selectedSessionForReport.standardDeviation <= 1.5
                        ? "Steady Mind"
                        : selectedSessionForReport.standardDeviation <= 3.0
                        ? "Balanced"
                        : "Active Flow"
                      : "Adaptive"
                    }
                  </span>
                </div>

                <div className="bg-white p-3 rounded-xl border border-natural-border text-center shadow-sm">
                  <span className="block text-[8.5px] uppercase font-sans tracking-wider text-stone-600 font-extrabold">Rhythm Variation</span>
                  <span className="text-xl font-serif font-black text-natural-dark mt-1 block">
                    {selectedSessionForReport.standardDeviation !== undefined ? `±${selectedSessionForReport.standardDeviation}s` : '±1.2s'}
                  </span>
                  <span className="text-[8.5px] font-medium text-stone-600 mt-0.5 block">Std. Dev (Steady &lt; 1.5s)</span>
                </div>

                <div className="bg-white p-3 rounded-xl border border-natural-border text-center shadow-sm">
                  <span className="block text-[8.5px] uppercase font-sans tracking-wider text-stone-600 font-extrabold">Avg Breath Cycle</span>
                  <span className="text-xl font-serif font-black text-natural-dark mt-1 block">
                    {selectedSessionForReport.averageIntervalSeconds}s
                  </span>
                  <span className="text-[8.5px] font-medium text-stone-600 mt-0.5 block">Target: 8.0s - 12.0s</span>
                </div>

                <div className="bg-white p-3 rounded-xl border border-natural-border text-center shadow-sm">
                  <span className="block text-[8.5px] uppercase font-sans tracking-wider text-stone-600 font-extrabold">Exhales Logged</span>
                  <span className="text-xl font-serif font-black text-[#245E5A] mt-1 block">
                    {selectedSessionForReport.exhalesTracked}
                  </span>
                  <span className="text-[8.5px] font-medium text-stone-600 mt-0.5 block">Full metric analysis</span>
                </div>

              </div>

              {/* Graph Container */}
              <div className="bg-white p-4 rounded-2xl border border-natural-border mb-6 shadow-sm">
                <span className="text-[10px] font-sans font-extrabold uppercase tracking-widest text-[#245E5A] block mb-3 text-left">
                  Breath-by-breath Interval Timeline
                </span>

                {(() => {
                  const intervals = selectedSessionForReport.intervals || [];
                  
                  if (intervals.length === 0) {
                    return (
                      <div className="py-12 px-6 text-center text-stone-500 bg-[#FAF9F6] rounded-xl border border-natural-border/60">
                        <Info size={18} className="mx-auto mb-2 text-natural-teal" />
                        <p className="text-xs font-semibold text-stone-850">Historical Log Overview</p>
                        <p className="text-[10px] max-w-[320px] mx-auto mt-1 leading-relaxed text-stone-600">
                          This past session only contains summary metrics. Standard deviation analysis is ±1.2s around a baseline of {selectedSessionForReport.averageIntervalSeconds}s. Live interactive timeline charts plot on new breaths going forward!
                        </p>
                      </div>
                    );
                  }

                  const svgWidth = 500;
                  const svgHeight = 220;
                  const padLeft = 35;
                  const padRight = 15;
                  const padTop = 20;
                  const padBottom = 30;

                  const chartW = svgWidth - padLeft - padRight;
                  const chartH = svgHeight - padTop - padBottom;

                  const minVal = Math.min(...intervals);
                  const maxVal = Math.max(...intervals);
                  
                  const yMin = Math.max(1, Math.min(minVal - 1.5, 4));
                  const yMax = Math.max(maxVal + 1.5, 15);
                  const yRange = yMax - yMin;

                  const getX = (index: number) => {
                    if (intervals.length === 1) return padLeft + chartW / 2;
                    return padLeft + (index / (intervals.length - 1)) * chartW;
                  };

                  const getY = (val: number) => {
                    const pct = (val - yMin) / (yRange || 1);
                    return padTop + chartH - (pct * chartH);
                  };

                  let pPoints = "";
                  intervals.forEach((val, idx) => {
                    const x = getX(idx);
                    const y = getY(val);
                    if (idx === 0) {
                      pPoints += `M ${x} ${y}`;
                    } else {
                      pPoints += ` L ${x} ${y}`;
                    }
                  });

                  let fillPath = "";
                  if (intervals.length > 0) {
                    const firstX = getX(0);
                    const lastX = getX(intervals.length - 1);
                    const baselineY = padTop + chartH;
                    fillPath = `${pPoints} L ${lastX} ${baselineY} L ${firstX} ${baselineY} Z`;
                  }

                  const avgY = getY(selectedSessionForReport.averageIntervalSeconds);

                  return (
                    <div className="relative">
                      <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="w-full h-auto overflow-visible select-none">
                        <defs>
                          <linearGradient id="chart-area-grad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#245E5A" stopOpacity="0.25" />
                            <stop offset="100%" stopColor="#245E5A" stopOpacity="0.01" />
                          </linearGradient>
                        </defs>

                        {[yMin + yRange * 0.25, yMin + yRange * 0.5, yMin + yRange * 0.75].map((level, i) => (
                          <g key={i} className="opacity-40">
                            <line 
                              x1={padLeft} 
                              y1={getY(level)} 
                              x2={svgWidth - padRight} 
                              y2={getY(level)} 
                              stroke="#E6E1D8" 
                              strokeWidth={1} 
                              strokeDasharray="4 4" 
                            />
                            <text 
                              x={padLeft - 8} 
                              y={getY(level) + 3} 
                              textAnchor="end" 
                              className="font-mono text-[8px] fill-stone-500 font-bold"
                            >
                              {level.toFixed(1)}s
                            </text>
                          </g>
                        ))}

                        <line
                          x1={padLeft}
                          y1={avgY}
                          x2={svgWidth - padRight}
                          y2={avgY}
                          stroke="#D97706"
                          strokeWidth={1}
                          strokeDasharray="3 3"
                          className="opacity-70"
                        />
                        <text
                          x={svgWidth - padRight - 5}
                          y={avgY - 4}
                          textAnchor="end"
                          className="fill-amber-700 font-serif italic text-[8.5px] font-bold"
                        >
                          Average Target: {selectedSessionForReport.averageIntervalSeconds}s
                        </text>

                        {intervals.length > 0 && (
                          <path d={fillPath} fill="url(#chart-area-grad)" />
                        )}

                        {intervals.length > 0 && (
                          <path 
                            d={pPoints} 
                            fill="none" 
                            stroke="#245E5A" 
                            strokeWidth={2.5} 
                            strokeLinecap="round" 
                            strokeLinejoin="round" 
                          />
                        )}

                        {intervals.map((val, idx) => {
                          const x = getX(idx);
                          const y = getY(val);
                          return (
                            <g key={idx} className="group/node">
                              <circle 
                                cx={x} 
                                cy={y} 
                                r={4} 
                                fill="#245E5A" 
                                className="transition-all hover:r-5 cursor-pointer hover:fill-emerald-800" 
                              />
                              <circle 
                                cx={x} 
                                cy={y} 
                                r={8} 
                                fill="transparent" 
                                className="cursor-pointer" 
                              />
                              
                              <text
                                x={x}
                                y={y - 10}
                                textAnchor="middle"
                                className="fill-natural-dark font-mono text-[8.5px] font-extrabold opacity-75 md:opacity-0 group-hover/node:opacity-100 transition-opacity bg-white px-1 pointer-events-none"
                              >
                                {val}s
                              </text>
                            </g>
                          );
                        })}

                        <line 
                          x1={padLeft} 
                          y1={padTop + chartH} 
                          x2={svgWidth - padRight} 
                          y2={padTop + chartH} 
                          stroke="#FAF" 
                          strokeWidth={1} 
                          className="stroke-stone-300 opacity-60" 
                        />

                        {(() => {
                          const indexesToShow = [];
                          const tot = intervals.length;
                          if (tot <= 8) {
                            for (let i = 0; i < tot; i++) indexesToShow.push(i);
                          } else {
                            indexesToShow.push(0);
                            indexesToShow.push(Math.round(tot * 0.25));
                            indexesToShow.push(Math.round(tot * 0.5));
                            indexesToShow.push(Math.round(tot * 0.75));
                            indexesToShow.push(tot - 1);
                          }

                          return indexesToShow.map((idx) => (
                            <text
                              key={idx}
                              x={getX(idx)}
                              y={padTop + chartH + 15}
                              textAnchor="middle"
                              className="fill-stone-600 font-semibold font-mono text-[8px]"
                            >
                              Breath {idx + 1}
                            </text>
                          ));
                        })()}

                      </svg>
                    </div>
                  );
                })()}

                <div className="flex items-start gap-2 bg-[#FAF9F6] p-3 rounded-xl border border-natural-border mt-3 text-[10.5px] leading-relaxed text-stone-700 font-medium text-left">
                  <Info size={14} className="text-natural-teal shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-natural-dark block">What is Standard Deviation of Breath?</span>
                    It measures how much your individual breathing intervals varied from your average breath length. A smaller deviation (e.g. standard deviation <strong>&lt; 1.5 seconds</strong>) means your breathing rhythm was exceptionally stable, showing steady mind concentration. Complete zen breathing strives for rhythm stability!
                  </div>
                </div>

              </div>

              {/* Personalized expert coaching commentary */}
              <div className="bg-natural-ring/40 border border-natural-border p-4 rounded-xl mb-6 text-xs text-natural-charcoal leading-relaxed font-serif text-left">
                <span className="font-sans font-extrabold uppercase tracking-widest text-[#245E5A] text-[9.5px] block mb-1">
                  Stabilizing Insights & Coaching
                </span>
                {(() => {
                  const sd = selectedSessionForReport.standardDeviation;
                  if (sd === undefined) {
                    return "A steady slow inhale and even slower exhale signals safety to the amygdala, reducing anxiety instantly. You are building an exceptional habit of daily mindfulness.";
                  } else if (sd <= 0.8) {
                    return "Absolute Zen Master! Your breathing consistency is exceptionally pristine (under ±0.8s), indicating pristine parasympathetic dominance and remarkable breath control. Your autonomic system is in a state of deep, restorative rest and calm.";
                  } else if (sd <= 1.5) {
                    return `Beautifully centered mind! Your standard deviation of ±${sd}s shows excellent rhythm holding. There is minor adaptive flexibility in your heart rate and breath length, which represents a highly resilient, tranquil, and healthy resting cardiovascular flow.`;
                  } else if (sd <= 3.0) {
                    return `Balanced and adaptive rhythm. A deviation of ±${sd}s shows some active adjusting as your posture or thoughts shifted. This is a very natural focus phase. In your next session, try to count silently to six on each inhale and exhale to lock in an even steadier pace.`;
                  } else {
                    return `Varied physiological flow. Your breath intervals had wave variation (±${sd}s). This often happens when beginning, or of high physical fatigue. Continue practicing with the floating central bubble, letting the guide expand and contract your diaphragm cleanly.`;
                  }
                })()}
              </div>

              {/* Actions */}
              <div className="flex justify-end pt-3 border-t border-natural-border/60">
                <button
                  onClick={() => setSelectedSessionForReport(null)}
                  className="bg-natural-teal hover:bg-natural-teal-hover text-white text-[11px] uppercase tracking-widest font-bold py-2.5 px-6 rounded-full shadow-sm transition-all cursor-pointer border border-transparent"
                  id="dismiss-consistency-report-btn"
                >
                  Return to Dashboard
                </button>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* --- Footer / Aesthetic pair branding --- */}
      <footer className="w-full p-10 flex flex-col md:flex-row justify-between items-start md:items-end gap-6 border-t border-natural-border bg-[#FAF9F6] z-10 relative">
        <div className="flex flex-col gap-1.5 font-sans">
          <span className="text-[10px] uppercase tracking-widest text-stone-600 font-bold block">Current Metrics</span>
          <div className="flex items-baseline gap-2">
            <span id="exhale-count" className="text-5xl font-serif font-black text-natural-dark leading-none">{totalExhales}</span>
            <span className="text-stone-700 font-bold text-sm">Exhales Tracked</span>
          </div>
        </div>
        
        <div className="max-w-xs md:text-right">
          <p className="text-xs text-stone-700 font-semibold italic font-serif leading-relaxed">
            "Breathing is the bridge which connects life to consciousness, which unites your body to your thoughts."
          </p>
          <p className="text-[11px] text-natural-teal mt-2 font-black uppercase tracking-widest">
            — Thich Nhat Hanh
          </p>
        </div>
      </footer>

    </div>
  );
}

