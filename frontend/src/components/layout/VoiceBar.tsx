import React, { useState } from 'react';
import {
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  X,
  Send,
  MessageSquare
} from 'lucide-react';
import { useVoice } from '../../context/VoiceContext';

export const VoiceBar: React.FC = () => {
  const {
    isListening,
    transcript,
    interimTranscript,
    lastReply,
    isSpeaking,
    toggleListening,
    speakText,
    stopSpeaking,
    sendManualQuery,
    clearReply
  } = useVoice();

  const [textInput, setTextInput] = useState('');
  const [showTextModal, setShowTextModal] = useState(false);

  const handleSubmitText = (e: React.FormEvent) => {
    e.preventDefault();
    if (!textInput.trim()) return;
    sendManualQuery(textInput);
    setTextInput('');
    setShowTextModal(false);
  };

  const handleQuickPrompt = (prompt: string) => {
    sendManualQuery(prompt);
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 pointer-events-none">
      <div className="max-w-4xl mx-auto px-3 pb-3 pointer-events-auto flex flex-col items-center gap-2">
        {/* Spoken Reply Bubble */}
        {lastReply && (
          <div
            role="status"
            aria-live="polite"
            className="w-full max-w-2xl bg-surface border-2 border-[#FFC300] rounded p-3 sm:p-4 shadow-xl flex items-start justify-between gap-3 animate-in fade-in slide-in-from-bottom-3 duration-200"
          >
            <div className="flex items-start gap-3">
              <div className="p-2 rounded bg-[#FFC300] text-[#211E1C] shrink-0">
                <Volume2 className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <div className="text-[11px] font-industrial uppercase font-bold text-text-secondary tracking-wider flex items-center gap-1.5">
                  <span>CatMate Cab Assistant</span>
                  {isSpeaking && (
                    <span className="text-[10px] text-[#3C8C4A] font-sans font-semibold">
                      (Speaking...)
                    </span>
                  )}
                </div>
                <p className="text-sm sm:text-base font-semibold text-text-primary mt-0.5 leading-snug">
                  {lastReply}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1 shrink-0">
              <button
                onClick={() => (isSpeaking ? stopSpeaking() : speakText(lastReply))}
                title={isSpeaking ? 'Mute speech' : 'Replay audio'}
                className="btn-touch p-2 rounded hover:bg-stone-200 dark:hover:bg-stone-800 text-text-secondary transition"
              >
                {isSpeaking ? <VolumeX className="w-5 h-5 text-red-500" /> : <Volume2 className="w-5 h-5" />}
              </button>
              <button
                onClick={clearReply}
                title="Dismiss message"
                className="btn-touch p-2 rounded hover:bg-stone-200 dark:hover:bg-stone-800 text-text-secondary transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}

        {/* Live Transcript Chip */}
        {(isListening || interimTranscript || transcript) && !lastReply && (
          <div className="bg-[#211E1C] text-white border border-[#FFC300] px-4 py-2 rounded shadow-lg flex items-center gap-2 max-w-xl animate-in fade-in">
            <span className="w-2.5 h-2.5 rounded-full bg-[#FFC300] animate-ping shrink-0" />
            <span className="text-xs sm:text-sm font-semibold truncate">
              {interimTranscript || transcript || 'Listening for speech in cab...'}
            </span>
          </div>
        )}

        {/* Main Docked Mic Bar */}
        <div className="w-full max-w-2xl bg-surface/95 backdrop-blur-none border-2 border-border p-2 sm:p-2.5 rounded shadow-2xl flex items-center justify-between gap-2">
          {/* Quick Intent Query Chips */}
          <div className="hidden sm:flex items-center gap-1.5 overflow-x-auto py-0.5 text-xs text-text-secondary">
            <button
              onClick={() => handleQuickPrompt("What's on my plate today?")}
              className="px-2.5 py-1 rounded bg-bg hover:bg-stone-200 dark:hover:bg-stone-800 border border-border text-[11px] font-semibold whitespace-nowrap transition"
            >
              &ldquo;What&apos;s on my plate?&rdquo;
            </button>
            <button
              onClick={() => handleQuickPrompt('How do I check hydraulic fluid level?')}
              className="px-2.5 py-1 rounded bg-bg hover:bg-stone-200 dark:hover:bg-stone-800 border border-border text-[11px] font-semibold whitespace-nowrap transition"
            >
              &ldquo;Check hydraulic fluid?&rdquo;
            </button>
            <button
              onClick={() => handleQuickPrompt('Check machine status')}
              className="px-2.5 py-1 rounded bg-bg hover:bg-stone-200 dark:hover:bg-stone-800 border border-border text-[11px] font-semibold whitespace-nowrap transition"
            >
              &ldquo;Machine status&rdquo;
            </button>
          </div>

          <div className="sm:hidden text-xs font-industrial uppercase font-bold text-text-secondary pl-2">
            Voice Assistant
          </div>

          {/* Right Controls: Keyboard fallback + Primary Voice Button */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowTextModal(!showTextModal)}
              title="Type query instead of voice"
              className="btn-touch p-2.5 rounded border border-border bg-bg hover:border-[#FFC300] text-text-secondary hover:text-text-primary transition flex items-center justify-center"
            >
              <MessageSquare className="w-5 h-5" />
            </button>

            {/* Tactile Big Mic Button */}
            <button
              onClick={toggleListening}
              aria-label={isListening ? 'Stop listening' : 'Start voice command'}
              className={`btn-touch px-4 sm:px-6 py-2.5 rounded font-industrial font-black uppercase tracking-wider text-sm sm:text-base flex items-center gap-2 transition ${
                isListening
                  ? 'bg-red-600 hover:bg-red-700 text-white listening-pulse'
                  : 'bg-[#FFC300] hover:bg-[#E5AF00] text-[#211E1C]'
              }`}
            >
              {isListening ? (
                <>
                  <MicOff className="w-5 h-5" />
                  <span>Listening...</span>
                </>
              ) : (
                <>
                  <Mic className="w-5 h-5" />
                  <span>Voice / Ask</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Text Prompt Drawer / Fallback Modal */}
        {showTextModal && (
          <form
            onSubmit={handleSubmitText}
            className="w-full max-w-xl bg-surface border-2 border-border p-3 rounded shadow-2xl flex items-center gap-2 animate-in fade-in"
          >
            <input
              type="text"
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              placeholder="Type question or command (e.g. 'what is my next task?')"
              className="flex-1 bg-bg border border-border px-3 py-2 rounded text-sm text-text-primary font-medium focus:outline-none focus:border-[#FFC300]"
              autoFocus
            />
            <button
              type="submit"
              className="btn-touch px-4 py-2 rounded bg-[#FFC300] hover:bg-[#E5AF00] text-[#211E1C] font-bold text-xs uppercase flex items-center gap-1.5 transition"
            >
              <Send className="w-4 h-4" />
              <span>Send</span>
            </button>
            <button
              type="button"
              onClick={() => setShowTextModal(false)}
              className="p-2 text-text-secondary hover:text-text-primary"
            >
              <X className="w-4 h-4" />
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
