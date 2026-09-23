import { useState, useEffect, useRef, useCallback } from 'react';
import type { MachineStatus, ProximityAlert } from '../types';
import { api } from '../api/apiService';
import { useVoice } from '../context/VoiceContext';

export function useMachineTelemetry(machineId: string = 'EXC001', pollIntervalMs: number = 4000) {
  const [telemetry, setTelemetry] = useState<MachineStatus>({
    machine_id: machineId,
    model: 'CAT 320 Hydraulic Excavator',
    engine_hours: 1524.8,
    fuel_level_pct: 62,
    seatbelt_status: 'Fastened',
    proximity_alert: null,
    timestamp: new Date().toISOString()
  });

  const { speakText } = useVoice();
  const lastSeatbeltRef = useRef<'Fastened' | 'Unfastened'>('Fastened');
  const lastProximityRef = useRef<boolean>(false);

  const fetchStatus = useCallback(async () => {
    try {
      const data = await api.getMachineStatus(machineId);
      setTelemetry(data);

      // Audio safety triggers as specified in PRD
      if (data.seatbelt_status === 'Unfastened' && lastSeatbeltRef.current === 'Fastened') {
        speakText('Safety warning: Your seatbelt is unfastened. Buckle up.');
      }
      lastSeatbeltRef.current = data.seatbelt_status;

      const hasProx = Boolean(data.proximity_alert && data.proximity_alert.object_detected);
      if (hasProx && !lastProximityRef.current) {
        speakText(
          `Caution! Proximity hazard: Object detected ${data.proximity_alert?.distance_m || 2} meters on ${data.proximity_alert?.direction || 'left'}.`
        );
      }
      lastProximityRef.current = hasProx;
    } catch (e) {
      console.warn('Telemetry fetch error:', e);
    }
  }, [machineId, speakText]);

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, pollIntervalMs);
    const unsubscribe = api.subscribe(() => {
      fetchStatus();
    });

    return () => {
      clearInterval(interval);
      unsubscribe();
    };
  }, [fetchStatus, pollIntervalMs]);

  const toggleSeatbelt = () => {
    const next = api.toggleSeatbelt(machineId);
    fetchStatus();
    return next;
  };

  const simulateProximity = (alert?: ProximityAlert | null) => {
    const next = api.simulateProximityHazard(machineId, alert);
    fetchStatus();
    return next;
  };

  return {
    telemetry,
    toggleSeatbelt,
    simulateProximity,
    refetch: fetchStatus
  };
}
