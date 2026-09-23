import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useVoice } from '../../context/VoiceContext';
import { api } from '../../api/apiService';
import type { Incident, StructuredIncident } from '../../types';
import { IncidentPreviewCard } from '../../components/ui/IncidentPreviewCard';
import { StatusBadge } from '../../components/ui/StatusBadge';
import {
  Mic,
  MicOff,
  AlertTriangle,
  CheckCircle,
  History,
  Calendar,
  Camera
} from 'lucide-react';

export const IncidentLog: React.FC = () => {
  const { user } = useAuth();
  const { isListening, transcript, interimTranscript, toggleListening } = useVoice();

  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [activeStructured, setActiveStructured] = useState<StructuredIncident | null>(null);
  const [activeTranscript, setActiveTranscript] = useState<string>('');
  const [successToast, setSuccessToast] = useState<string | null>(null);
  const [manualText, setManualText] = useState('');
  const [showManualInput, setShowManualInput] = useState(false);

  const loadIncidents = async () => {
    const list = await api.getIncidents(user?.user_id);
    setIncidents(list);
  };

  useEffect(() => {
    loadIncidents();
    const unsubscribe = api.subscribe(() => {
      loadIncidents();
    });
    return unsubscribe;
  }, [user]);

  // When speech recognition ends and we have captured transcript, parse and show preview
  useEffect(() => {
    if (!isListening && transcript) {
      handleParseTranscript(transcript);
    }
  }, [isListening, transcript]);

  const handleParseTranscript = (spoken: string) => {
    setActiveTranscript(spoken);
    const lower = spoken.toLowerCase();
    let type = 'Equipment Anomaly';
    let location = 'Machine Assembly';
    let severity: 'Low' | 'Medium' | 'High' | 'Critical' = 'Medium';

    if (lower.includes('leak') || lower.includes('hydraulic')) {
      type = 'Hydraulic Fluid Leak';
      location = lower.includes('bucket') ? 'Bucket Coupler Joint' : 'Boom Cylinder';
      severity = 'Medium';
    } else if (lower.includes('trench') || lower.includes('soil') || lower.includes('ground')) {
      type = 'Ground Slump / Cave-in Hazard';
      location = 'Trench Wall Edge';
      severity = 'High';
    } else if (lower.includes('brake') || lower.includes('steer')) {
      type = 'Hydrostatic Braking Failure';
      location = 'Travel Motor Circuit';
      severity = 'Critical';
    } else if (lower.includes('crack') || lower.includes('weld')) {
      type = 'Structural Weld Fracture';
      location = 'Boom Pivot Pin';
      severity = 'Medium';
    }

    setActiveStructured({ type, location, severity });
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualText.trim()) return;
    handleParseTranscript(manualText);
    setManualText('');
    setShowManualInput(false);
  };

  const handleConfirmIncident = async (
    structured: StructuredIncident,
    photoBase64: string | null
  ) => {
    const opId = user?.user_id || 'OP1001';
    const mId = user?.assigned_machine_id || 'EXC001';

    await api.logIncident(opId, mId, activeTranscript || 'Manual hazard report', photoBase64, structured);

    setActiveStructured(null);
    setActiveTranscript('');
    setSuccessToast(`Incident record filed successfully. Assigned safety ID.`);
    setTimeout(() => setSuccessToast(null), 4000);
    loadIncidents();
  };

  const handleSimulateVoicePrompt = (text: string) => {
    handleParseTranscript(text);
  };

  return (
    <div className="space-y-6 pb-24 max-w-4xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-border pb-3">
        <div>
          <span className="text-xs uppercase font-industrial tracking-wider text-text-secondary font-bold">
            Field Safety Protocol
          </span>
          <h1 className="font-industrial text-2xl sm:text-3xl font-black uppercase tracking-tight text-text-primary">
            Hands-Free Incident Logger
          </h1>
          <p className="text-xs sm:text-sm text-text-secondary mt-0.5">
            Spoken in-cab reports are parsed via LLM into structured safety records with photo attachments.
          </p>
        </div>

        <button
          onClick={() => setShowManualInput(!showManualInput)}
          className="btn-touch px-3 py-1.5 rounded border border-border bg-surface hover:border-[#FFC300] text-xs uppercase font-bold text-text-secondary transition"
        >
          {showManualInput ? 'Close Manual Input' : 'Type Report Instead'}
        </button>
      </div>

      {/* Success Notification Toast */}
      {successToast && (
        <div
          role="status"
          className="bg-[#3C8C4A] text-white p-3.5 rounded flex items-center justify-between text-sm font-bold shadow-md animate-in fade-in"
        >
          <div className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 shrink-0" />
            <span>{successToast}</span>
          </div>
          <button
            onClick={() => setSuccessToast(null)}
            className="text-xs uppercase font-mono px-2 py-0.5 bg-black/20 rounded"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Manual Input Fallback Drawer */}
      {showManualInput && (
        <form
          onSubmit={handleManualSubmit}
          className="bg-surface border-2 border-border p-4 rounded flex flex-col gap-2.5 animate-in fade-in"
        >
          <label className="text-xs uppercase font-industrial font-bold text-text-secondary">
            Type Spoken Incident Description
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={manualText}
              onChange={(e) => setManualText(e.target.value)}
              placeholder="e.g. 'hydraulic leak near the bucket' or 'loose soil near trench wall'"
              className="flex-1 bg-bg border border-border p-2 rounded text-sm text-text-primary font-medium focus:outline-none focus:border-[#FFC300]"
              autoFocus
            />
            <button
              type="submit"
              className="btn-touch px-4 py-2 rounded bg-[#FFC300] hover:bg-[#E5AF00] text-[#211E1C] font-bold text-xs uppercase"
            >
              Parse
            </button>
          </div>
        </form>
      )}

      {/* Voice Trigger Station */}
      <div className="bg-surface border-2 border-border rounded p-6 sm:p-8 flex flex-col items-center justify-center text-center gap-4 relative overflow-hidden">
        {/* Visual equipment hazard stripes bar at top */}
        <div className="absolute top-0 left-0 right-0 h-1.5 cat-stripe-border" />

        <div className="max-w-md">
          <h2 className="font-industrial text-xl sm:text-2xl font-black uppercase text-text-primary">
            {isListening ? 'Streaming Speech to Safety Parser...' : 'Tap & Speak Incident Details'}
          </h2>
          <p className="text-xs sm:text-sm text-text-secondary mt-1">
            Clearly state the component, location, and hazard condition. No typing required.
          </p>
        </div>

        {/* Big tactile mic button */}
        <button
          onClick={toggleListening}
          aria-label={isListening ? 'Stop capturing speech' : 'Start voice incident log'}
          className={`btn-touch w-24 h-24 sm:w-28 sm:h-28 rounded-full flex flex-col items-center justify-center transition-all ${isListening
              ? 'bg-red-600 hover:bg-red-700 text-white listening-pulse'
              : 'bg-[#FFC300] hover:bg-[#E5AF00] text-[#211E1C] shadow-lg'
            }`}
        >
          {isListening ? (
            <>
              <MicOff className="w-8 h-8 sm:w-10 sm:h-10" />
              <span className="text-[11px] font-industrial font-extrabold uppercase mt-1">Stop</span>
            </>
          ) : (
            <>
              <Mic className="w-8 h-8 sm:w-10 sm:h-10" />
              <span className="text-[11px] font-industrial font-extrabold uppercase mt-1">Record</span>
            </>
          )}
        </button>

        {/* Live Audio Streaming Transcript Display */}
        {(isListening || interimTranscript || transcript) && (
          <div className="w-full max-w-lg bg-bg border border-border p-3.5 rounded text-left">
            <div className="flex items-center gap-2 text-[11px] font-industrial uppercase font-bold text-text-secondary">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              <span>Real-Time Streamed Audio Transcript:</span>
            </div>
            <p className="text-sm font-semibold text-text-primary mt-1 italic">
              &ldquo;{interimTranscript || transcript || 'Listening...'}&rdquo;
            </p>
          </div>
        )}

        {/* Preset Quick Simulations for Testing */}
        <div className="flex flex-wrap items-center justify-center gap-2 pt-2 text-xs">
          <span className="text-text-secondary text-[11px] font-industrial uppercase font-bold">
            Simulate Voice Transcripts:
          </span>
          <button
            onClick={() => handleSimulateVoicePrompt('hydraulic leak near the bucket')}
            className="px-2.5 py-1 rounded bg-bg hover:bg-stone-200 dark:hover:bg-stone-800 border border-border text-[11px] font-semibold text-text-secondary transition"
          >
            &ldquo;hydraulic leak near bucket&rdquo;
          </button>
          <button
            onClick={() => handleSimulateVoicePrompt('ground slope cave-in near trench wall')}
            className="px-2.5 py-1 rounded bg-bg hover:bg-stone-200 dark:hover:bg-stone-800 border border-border text-[11px] font-semibold text-text-secondary transition"
          >
            &ldquo;ground slope cave-in&rdquo;
          </button>
          <button
            onClick={() => handleSimulateVoicePrompt('hard hydrostatic brake lock on travel motor')}
            className="px-2.5 py-1 rounded bg-bg hover:bg-stone-200 dark:hover:bg-stone-800 border border-border text-[11px] font-semibold text-text-secondary transition"
          >
            &ldquo;brake lock on travel motor&rdquo;
          </button>
        </div>
      </div>

      {/* Structured Preview Card with Confirm / Edit & Photo */}
      {activeStructured && (
        <IncidentPreviewCard
          rawTranscript={activeTranscript}
          initialStructured={activeStructured}
          onConfirm={handleConfirmIncident}
          onCancel={() => {
            setActiveStructured(null);
            setActiveTranscript('');
          }}
        />
      )}

      {/* Past Operator Incident Logs */}
      <div className="space-y-3 pt-4">
        <div className="flex items-center gap-2 border-b border-border pb-2">
          <History className="w-5 h-5 text-[#FFC300]" />
          <h2 className="font-industrial text-xl sm:text-2xl font-black uppercase tracking-tight text-text-primary">
            Past Shift Incident Logs
          </h2>
        </div>

        {incidents.length === 0 ? (
          <div className="p-6 text-center bg-surface border border-border rounded text-text-secondary text-sm">
            No incidents reported for this shift. Clear safety record.
          </div>
        ) : (
          <div className="space-y-2.5">
            {incidents.map((inc) => (
              <div
                key={inc.incident_id}
                className="bg-surface border border-border p-4 rounded flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
              >
                <div className="flex items-start gap-3">
                  <div className="p-2.5 rounded bg-stone-100 dark:bg-stone-800 text-[#D63C2E]">
                    <AlertTriangle className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-industrial text-xs font-bold uppercase text-text-secondary">
                        {inc.incident_id}
                      </span>
                      <span className="text-text-secondary text-xs">•</span>
                      <span className="text-xs text-text-secondary font-semibold flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {new Date(inc.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      <span className="text-text-secondary text-xs">•</span>
                      <span className="text-xs font-semibold text-text-secondary">
                        Unit: {inc.machine_id}
                      </span>
                    </div>

                    <h3 className="text-base sm:text-lg font-bold font-industrial uppercase tracking-tight text-text-primary mt-0.5">
                      {inc.incident_type} —{' '}
                      <span className="font-normal text-sm text-text-secondary">
                        {inc.location}
                      </span>
                    </h3>

                    <p className="text-xs text-text-secondary italic mt-1 max-w-xl">
                      &ldquo;{inc.raw_voice_text}&rdquo;
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center">
                  {inc.photo_url &&  (
                    <span className="flex items-center gap-1 px-2 py-1 rounded bg-stone-200 dark:bg-stone-800 text-[11px] font-semibold text-text-secondary">
                      <Camera className="w-3.5 h-3.5 text-[#FFC300]" />
                      <span>Photo</span>
                    </span>
                  )}
                  <StatusBadge status={inc.severity} size="md" />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
