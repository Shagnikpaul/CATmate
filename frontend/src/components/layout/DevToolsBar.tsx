import React, { useState } from 'react';
import {
  Wrench,
  ShieldAlert,
  Radio,
  ChevronDown,
  ChevronUp,
  Server,
  Zap
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../api/apiService';
import { useNavigate } from 'react-router-dom';

export const DevToolsBar: React.FC = () => {
  const { role, switchQuickUser } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [isMock, setIsMock] = useState(() => api.isMockMode());
  const navigate = useNavigate();

  const handleToggleMock = () => {
    const next = !isMock;
    setIsMock(next);
    api.setMockMode(next);
  };

  const handleSimulateProximity = () => {
    api.simulateProximityHazard('EXC001');
  };

  const handleToggleSeatbelt = () => {
    api.toggleSeatbelt('EXC001');
  };

  const handleSimulateHardBraking = () => {
    api.addBehaviorFlag({
      operator_id: 'OP1001',
      operator_name: 'Rahul Singh',
      machine_id: 'EXC001',
      flag_type: 'Hard Braking',
      risk_level: 'High',
      details: 'Sudden deceleration recorded (>0.52g) during swing cycle'
    });
  };

  const handleSwitchRole = async (target: 'operator' | 'manager') => {
    await switchQuickUser(target);
    if (target === 'operator') {
      navigate('/operator');
    } else {
      navigate('/manager');
    }
  };

  return (
    <div className="w-full bg-[#211E1C] text-[#F2EFEA] border-b border-stone-800 text-xs">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 py-1 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="flex items-center gap-1.5 font-industrial font-bold uppercase tracking-wider text-[#FFC300] hover:text-white transition"
          >
            <Wrench className="w-3.5 h-3.5" />
            <span>Field Ops Simulator / Dev Tools</span>
            {isOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>

          <div className="hidden md:flex items-center gap-2 text-stone-400">
            <span>•</span>
            <span className="flex items-center gap-1">
              <Server className="w-3 h-3 text-[#3C8C4A]" />
              Mode: <strong className="text-white">{isMock ? 'Mock Store (Offline Ready)' : 'Live Backend (Port 8000)'}</strong>
            </span>
          </div>
        </div>

        {/* Quick Role Switch Buttons */}
        <div className="flex items-center gap-1.5">
          <span className="text-stone-400 text-[11px] hidden sm:inline">Role:</span>
          <button
            onClick={() => handleSwitchRole('operator')}
            className={`px-2 py-0.5 rounded text-[11px] font-bold uppercase transition ${
              role === 'operator'
                ? 'bg-[#FFC300] text-[#211E1C]'
                : 'bg-stone-800 text-stone-300 hover:text-white'
            }`}
          >
            Operator (Rahul)
          </button>
          <button
            onClick={() => handleSwitchRole('manager')}
            className={`px-2 py-0.5 rounded text-[11px] font-bold uppercase transition ${
              role === 'manager'
                ? 'bg-[#FFC300] text-[#211E1C]'
                : 'bg-stone-800 text-stone-300 hover:text-white'
            }`}
          >
            Manager (Anita)
          </button>
        </div>
      </div>

      {/* Expanded Dev Panel */}
      {isOpen && (
        <div className="bg-stone-900 border-t border-stone-800 px-3 sm:px-6 py-2.5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4 animate-in fade-in">
          <div>
            <span className="text-stone-400 block font-industrial uppercase text-[10px] mb-1">
              Backend Connection
            </span>
            <button
              onClick={handleToggleMock}
              className="w-full btn-touch px-3 py-1.5 rounded bg-stone-800 hover:bg-stone-700 border border-stone-700 text-left flex items-center justify-between text-xs font-semibold"
            >
              <span>{isMock ? 'Switch to Live API' : 'Switch to Mock State'}</span>
              <span
                className={`w-2 h-2 rounded-full ${
                  isMock ? 'bg-[#FFC300]' : 'bg-[#3C8C4A]'
                }`}
              />
            </button>
          </div>

          <div>
            <span className="text-stone-400 block font-industrial uppercase text-[10px] mb-1">
              Safety Trigger 1: Proximity Sensor
            </span>
            <button
              onClick={handleSimulateProximity}
              className="w-full btn-touch px-3 py-1.5 rounded bg-[#D63C2E]/20 hover:bg-[#D63C2E]/30 border border-[#D63C2E]/40 text-[#E5564A] text-left flex items-center gap-1.5 text-xs font-bold uppercase"
            >
              <ShieldAlert className="w-4 h-4 shrink-0" />
              <span>Trigger Proximity Hazard</span>
            </button>
          </div>

          <div>
            <span className="text-stone-400 block font-industrial uppercase text-[10px] mb-1">
              Safety Trigger 2: Seatbelt Sensor
            </span>
            <button
              onClick={handleToggleSeatbelt}
              className="w-full btn-touch px-3 py-1.5 rounded bg-stone-800 hover:bg-stone-700 border border-stone-700 text-stone-200 text-left flex items-center gap-1.5 text-xs font-bold uppercase"
            >
              <Radio className="w-4 h-4 text-[#FFC300] shrink-0" />
              <span>Toggle Seatbelt Sensor</span>
            </button>
          </div>

          <div>
            <span className="text-stone-400 block font-industrial uppercase text-[10px] mb-1">
              Telemetry Event: Hard Braking
            </span>
            <button
              onClick={handleSimulateHardBraking}
              className="w-full btn-touch px-3 py-1.5 rounded bg-stone-800 hover:bg-stone-700 border border-stone-700 text-stone-200 text-left flex items-center gap-1.5 text-xs font-bold uppercase"
            >
              <Zap className="w-4 h-4 text-[#FFC300] shrink-0" />
              <span>Inject Hard-Brake Flag</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
