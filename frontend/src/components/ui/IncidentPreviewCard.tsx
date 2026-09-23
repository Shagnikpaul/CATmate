import React, { useState } from 'react';
import {
  AlertTriangle,
  Camera,
  CheckCircle,
  Edit2,
  Trash2,
  Upload,
  Check
} from 'lucide-react';
import type { StructuredIncident, SeverityLevel } from '../../types';
import { StatusBadge } from './StatusBadge';

interface IncidentPreviewCardProps {
  rawTranscript: string;
  initialStructured: StructuredIncident;
  onConfirm: (finalStructured: StructuredIncident, photoBase64: string | null) => void;
  onCancel?: () => void;
  className?: string;
}

export const IncidentPreviewCard: React.FC<IncidentPreviewCardProps> = ({
  rawTranscript,
  initialStructured,
  onConfirm,
  onCancel,
  className = ''
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [type, setType] = useState(initialStructured.type);
  const [location, setLocation] = useState(initialStructured.location);
  const [severity, setSeverity] = useState<SeverityLevel>(initialStructured.severity);
  const [photoBase64, setPhotoBase64] = useState<string | null>(null);

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoBase64(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleConfirm = () => {
    onConfirm({ type, location, severity }, photoBase64);
  };

  return (
    <div
      role="dialog"
      aria-label="Structured Incident Review"
      className={`bg-surface border-2 border-[#FFC300] rounded p-4 sm:p-5 flex flex-col gap-4 shadow-lg ${className}`}
    >
      <div className="flex items-center justify-between border-b border-border pb-3">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-[#E88C1F]" />
          <h3 className="font-industrial text-lg sm:text-xl font-bold uppercase tracking-tight text-text-primary">
            Structured Incident Preview
          </h3>
        </div>
        <StatusBadge status={severity} size="sm" />
      </div>

      {/* Raw voice transcript quotation */}
      <div className="bg-bg border border-border p-3 rounded">
        <div className="text-[11px] font-industrial uppercase font-bold text-text-secondary tracking-wider">
          Voice Transcript Captured
        </div>
        <p className="text-sm italic font-medium text-text-primary mt-1">
          &ldquo;{rawTranscript || 'No speech recorded yet...'}&rdquo;
        </p>
      </div>

      {/* Structured Fields */}
      {!isEditing ? (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="bg-bg border border-border p-3 rounded">
            <div className="text-[11px] font-industrial uppercase text-text-secondary font-semibold">
              Incident Type
            </div>
            <div className="text-base font-bold text-text-primary mt-0.5">{type}</div>
          </div>

          <div className="bg-bg border border-border p-3 rounded">
            <div className="text-[11px] font-industrial uppercase text-text-secondary font-semibold">
              Location / Component
            </div>
            <div className="text-base font-bold text-text-primary mt-0.5">{location}</div>
          </div>

          <div className="bg-bg border border-border p-3 rounded">
            <div className="text-[11px] font-industrial uppercase text-text-secondary font-semibold">
              Assessed Severity
            </div>
            <div className="text-base font-bold text-text-primary mt-0.5 uppercase">{severity}</div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="text-xs uppercase font-industrial font-bold text-text-secondary block mb-1">
              Incident Type
            </label>
            <input
              type="text"
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="w-full bg-bg border border-border p-2 rounded text-sm text-text-primary font-semibold focus:outline-none focus:border-[#FFC300]"
            />
          </div>

          <div>
            <label className="text-xs uppercase font-industrial font-bold text-text-secondary block mb-1">
              Location / Component
            </label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="w-full bg-bg border border-border p-2 rounded text-sm text-text-primary font-semibold focus:outline-none focus:border-[#FFC300]"
            />
          </div>

          <div>
            <label className="text-xs uppercase font-industrial font-bold text-text-secondary block mb-1">
              Severity Level
            </label>
            <select
              value={severity}
              onChange={(e) => setSeverity(e.target.value as SeverityLevel)}
              className="w-full bg-bg border border-border p-2 rounded text-sm text-text-primary font-semibold focus:outline-none focus:border-[#FFC300]"
            >
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
              <option value="Critical">Critical</option>
            </select>
          </div>
        </div>
      )}

      {/* Photo Capture Attachment Control */}
      <div className="border border-dashed border-border p-3 rounded flex flex-col sm:flex-row items-center justify-between gap-3 bg-bg/50">
        <div className="flex items-center gap-3">
          {photoBase64 ? (
            <img
              src={photoBase64}
              alt="Hazard capture"
              className="w-16 h-16 object-cover rounded border border-border"
            />
          ) : (
            <div className="w-12 h-12 rounded bg-stone-200 dark:bg-stone-800 flex items-center justify-center text-text-secondary">
              <Camera className="w-6 h-6" />
            </div>
          )}
          <div>
            <div className="text-sm font-bold text-text-primary">
              {photoBase64 ? 'Site Photo Attached' : 'Add Photo Evidence (Optional)'}
            </div>
            <div className="text-xs text-text-secondary">
              Snap via cab tablet camera or upload image
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <label className="btn-touch flex items-center gap-1.5 px-3 py-2 rounded bg-surface border border-border hover:border-[#FFC300] text-xs font-bold uppercase cursor-pointer transition">
            <Upload className="w-4 h-4 text-[#FFC300]" />
            <span>{photoBase64 ? 'Retake Photo' : 'Snap / Upload'}</span>
            <input
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handlePhotoUpload}
              className="hidden"
            />
          </label>

          {photoBase64 && (
            <button
              onClick={() => setPhotoBase64(null)}
              className="p-2 rounded text-[#D63C2E] hover:bg-stone-200 dark:hover:bg-stone-800 transition"
              title="Remove photo"
            >
              <Trash2 className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* Action Buttons: Confirm and Edit */}
      <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-2 border-t border-border">
        {onCancel && (
          <button
            onClick={onCancel}
            className="w-full sm:w-auto btn-touch px-4 py-2 rounded border border-border text-xs uppercase font-bold text-text-secondary hover:bg-stone-200 dark:hover:bg-stone-800 transition"
          >
            Discard
          </button>
        )}

        <button
          onClick={() => setIsEditing(!isEditing)}
          className="w-full sm:w-auto btn-touch px-4 py-2 rounded border border-border bg-surface hover:border-[#FFC300] text-xs uppercase font-bold text-text-primary flex items-center justify-center gap-1.5 transition"
        >
          {isEditing ? <Check className="w-4 h-4" /> : <Edit2 className="w-4 h-4" />}
          <span>{isEditing ? 'Done Editing' : 'Edit Fields'}</span>
        </button>

        <button
          onClick={handleConfirm}
          className="w-full sm:w-auto btn-touch px-6 py-2.5 rounded bg-[#FFC300] hover:bg-[#E5AF00] text-[#211E1C] text-sm uppercase font-extrabold flex items-center justify-center gap-2 transition"
        >
          <CheckCircle className="w-5 h-5" />
          <span>Confirm &amp; Log Incident</span>
        </button>
      </div>
    </div>
  );
};
