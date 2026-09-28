import { useRef, useState, useEffect } from "react";

export function useSpeech() {
  const [listening, setListening] = useState(false);
  const recognitionRef = useRef<any>(null);
  const mountedRef = useRef(true);

  // ---------------------------------------------------------------
  // Cancel any ongoing speech on unmount or page unload.
  // Fixes: voice keeps playing after refresh / navigating away.
  // ---------------------------------------------------------------
  useEffect(() => {
    mountedRef.current = true;

    const cancelAll = () => {
      try {
        window.speechSynthesis.cancel();
      } catch {
        /* ignore */
      }
      try {
        recognitionRef.current?.abort?.();
      } catch {
        /* ignore */
      }
    };

    // Fires on refresh, tab close, external navigation
    window.addEventListener("beforeunload", cancelAll);
    // Fires when tab loses visibility (mobile: user switches apps)
    document.addEventListener("visibilitychange", () => {
      if (document.hidden) cancelAll();
    });

    return () => {
      mountedRef.current = false;
      window.removeEventListener("beforeunload", cancelAll);
      cancelAll();
    };
  }, []);

  // ---------------------------------------------------------------
  // Speech-to-Text
  // ---------------------------------------------------------------
  const startListening = (onResult: (text: string) => void) => {
    const SR =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;

    if (!SR) {
      alert("Your browser doesn't support voice input. Try Chrome or Edge.");
      return;
    }

    const rec = new SR();
    rec.lang = "en-US";
    rec.interimResults = false;
    rec.continuous = false;

    rec.onstart = () => setListening(true);
    rec.onend = () => setListening(false);
    rec.onerror = () => setListening(false);
    rec.onresult = (e: any) => {
      const text = e.results[0][0].transcript;
      onResult(text);
    };

    rec.start();
    recognitionRef.current = rec;
  };

  const stopListening = () => {
    try {
      recognitionRef.current?.stop?.();
    } catch {
      /* ignore */
    }
    setListening(false);
  };

  // ---------------------------------------------------------------
  // Text-to-Speech
  // ---------------------------------------------------------------
  const speak = (text: string) => {
    // Cancel anything already speaking (prevents queue pile-up)
    try {
      window.speechSynthesis.cancel();
    } catch {
      /* ignore */
    }

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.05;
    utterance.pitch = 1;

    const voices = window.speechSynthesis.getVoices();
    const preferred = voices.find(
      (v) => v.lang.startsWith("en") && v.name.includes("Google")
    );
    if (preferred) utterance.voice = preferred;

    // If the component unmounts mid-speech, stop it
    utterance.onend = () => {
      if (!mountedRef.current) {
        window.speechSynthesis.cancel();
      }
    };

    window.speechSynthesis.speak(utterance);
  };

  const stopSpeaking = () => {
    try {
      window.speechSynthesis.cancel();
    } catch {
      /* ignore */
    }
  };

  return {
    listening,
    startListening,
    stopListening,
    speak,
    stopSpeaking,
  };
}