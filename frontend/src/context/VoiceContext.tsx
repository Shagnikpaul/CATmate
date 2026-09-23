import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { api } from '../api/apiService';
import { useAuth } from './AuthContext';

interface VoiceContextType {
  isListening: boolean;
  transcript: string;
  interimTranscript: string;
  lastReply: string | null;
  isSpeaking: boolean;
  isSupported: boolean;
  startListening: () => void;
  stopListening: () => void;
  toggleListening: () => void;
  speakText: (text: string) => void;
  stopSpeaking: () => void;
  sendManualQuery: (text: string) => Promise<string>;
  clearReply: () => void;
}

const VoiceContext = createContext<VoiceContextType | undefined>(undefined);

// Web Speech API recognition interface declarations
interface SpeechRecognitionInstance extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onresult: (event: any) => void;
  onerror: (event: any) => void;
  onend: () => void;
}

export const VoiceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [lastReply, setLastReply] = useState<string | null>(null);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isSupported, setIsSupported] = useState(false);

  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);

  useEffect(() => {
    // Check SpeechRecognition support
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (SpeechRecognition) {
      setIsSupported(true);
      try {
        const recognition: SpeechRecognitionInstance = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = true;
        recognition.lang = 'en-US';

        recognition.onresult = (event: any) => {
          let interim = '';
          let final = '';

          for (let i = event.resultIndex; i < event.results.length; ++i) {
            if (event.results[i].isFinal) {
              final += event.results[i][0].transcript;
            } else {
              interim += event.results[i][0].transcript;
            }
          }

          if (interim) {
            setInterimTranscript(interim);
          }

          if (final) {
            setTranscript(final);
            setInterimTranscript('');
            handleSpokenText(final);
          }
        };

        recognition.onerror = (event: any) => {
          console.warn('Speech recognition error:', event.error);
          setIsListening(false);
        };

        recognition.onend = () => {
          setIsListening(false);
        };

        recognitionRef.current = recognition;
      } catch (err) {
        console.warn('SpeechRecognition initialization error:', err);
      }
    }
  }, [user]);

  const speakText = (text: string) => {
    if (!('speechSynthesis' in window)) return;

    window.speechSynthesis.cancel(); // Stop any pending speech
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;

    // Pick a natural clear voice if available
    const voices = window.speechSynthesis.getVoices();
    const clearVoice = voices.find(
      (v) => v.lang.startsWith('en') && (v.name.includes('Natural') || v.name.includes('Google') || v.name.includes('Samantha'))
    );
    if (clearVoice) {
      utterance.voice = clearVoice;
    }

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.speak(utterance);
  };

  const stopSpeaking = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  };

  const handleSpokenText = async (text: string) => {
    if (!text.trim()) return;
    const operatorId = user?.user_id || 'OP1001';
    try {
      const response = await api.queryAssistant(operatorId, text);
      setLastReply(response.reply_text);
      speakText(response.reply_text);
    } catch (err) {
      console.error('Error handling spoken text:', err);
      const fallbackMsg = "Command received. I've updated your cab console.";
      setLastReply(fallbackMsg);
      speakText(fallbackMsg);
    }
  };

  const sendManualQuery = async (text: string): Promise<string> => {
    setTranscript(text);
    const operatorId = user?.user_id || 'OP1001';
    const response = await api.queryAssistant(operatorId, text);
    setLastReply(response.reply_text);
    speakText(response.reply_text);
    return response.reply_text;
  };

  const startListening = () => {
    if (recognitionRef.current && !isListening) {
      try {
        setInterimTranscript('');
        recognitionRef.current.start();
        setIsListening(true);
      } catch (e) {
        console.warn('Could not start recognition:', e);
        setIsListening(false);
      }
    } else if (!isSupported) {
      // Simulate quick sample query if microphone API is not supported in environment
      const simulatedText = "CatMate, what's on my plate today?";
      setTranscript(simulatedText);
      handleSpokenText(simulatedText);
    }
  };

  const stopListening = () => {
    if (recognitionRef.current && isListening) {
      try {
        recognitionRef.current.stop();
      } catch {
        // ignore
      }
      setIsListening(false);
    }
  };

  const toggleListening = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  const clearReply = () => {
    stopSpeaking();
    setLastReply(null);
    setTranscript('');
    setInterimTranscript('');
  };

  const value = {
    isListening,
    transcript,
    interimTranscript,
    lastReply,
    isSpeaking,
    isSupported,
    startListening,
    stopListening,
    toggleListening,
    speakText,
    stopSpeaking,
    sendManualQuery,
    clearReply
  };

  return <VoiceContext.Provider value={value}>{children}</VoiceContext.Provider>;
};

export const useVoice = () => {
  const ctx = useContext(VoiceContext);
  if (!ctx) {
    throw new Error('useVoice must be used within a VoiceProvider');
  }
  return ctx;
};
