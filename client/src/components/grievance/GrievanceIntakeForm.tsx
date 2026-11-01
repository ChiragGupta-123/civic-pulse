import { useState, useEffect } from 'react';
import {
  Mic,
  Square,
  CheckCircle2,
  RotateCcw,
  Sparkles,
  Camera,
  Flame,
  Clock,
  Layers,
  Compass,
} from 'lucide-react';
import { useAudioRecorder } from '../../hooks/useAudioRecorder';
import { useGeolocation } from '../../hooks/useGeolocation';
import { grievanceApi } from '../../api/grievance.api';
import { showToast } from '../feedback/ToastContainer';
import type { GrievanceCategory, GrievanceTicketDto } from '../../types/grievance.types';

const CATEGORIES: Array<{ code: GrievanceCategory; label: string; desc: string }> = [
  { code: 'ROAD_BRIDGE_DAMAGE', label: 'Roads & bridges', desc: 'Potholes, broken asphalt, damaged flyovers' },
  { code: 'WATER_LEAK', label: 'Water supply', desc: 'Pipe bursts, contamination, sewage leaks' },
  { code: 'POLLUTION', label: 'Pollution & smog', desc: 'Illegal dumping, toxic effluent, burning waste' },
  { code: 'ELECTRICAL_GRID', label: 'Electrical grid', desc: 'Fallen live wires, sparking transformers' },
  { code: 'SANITATION_WASTE', label: 'Public sanitation', desc: 'Uncollected garbage, overflowing bins' },
];

interface GrievanceIntakeFormProps {
  onTicketCreated?: (ticket: GrievanceTicketDto) => void;
}

export function GrievanceIntakeForm({ onTicketCreated }: GrievanceIntakeFormProps) {
  const [category, setCategory] = useState<GrievanceCategory>('ROAD_BRIDGE_DAMAGE');
  const [description, setDescription] = useState('');
  const [addressLabel, setAddressLabel] = useState('');
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createdTicket, setCreatedTicket] = useState<GrievanceTicketDto | null>(null);

  // Audio recording
  const {
    isRecording,
    recordingDuration,
    audioBlob,
    audioUrl,
    startRecording,
    stopRecording,
    resetRecording,
  } = useAudioRecorder();

  // Geolocation
  const { latitude, longitude, loading: geoLoading, detectLocation } = useGeolocation();

  useEffect(() => {
    detectLocation();
  }, [detectLocation]);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setPhotoFile(file);
      setPhotoPreview(URL.createObjectURL(file));
    }
  };

  const handleReset = () => {
    setDescription('');
    setAddressLabel('');
    setPhotoFile(null);
    if (photoPreview) URL.revokeObjectURL(photoPreview);
    setPhotoPreview(null);
    resetRecording();
    setCreatedTicket(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim() && !audioBlob) {
      showToast('Please provide a written description or record a voice note.', 'error');
      return;
    }

    setIsSubmitting(true);
    const fd = new FormData();
    fd.append('category', category);
    fd.append('description', description.trim() || 'Civic hazard reported via multimodal voice note');
    fd.append('latitude', String(latitude ?? 28.6139));
    fd.append('longitude', String(longitude ?? 77.209));
    if (addressLabel.trim()) {
      fd.append('address_label', addressLabel.trim());
    }

    if (photoFile) {
      fd.append('media_file', photoFile);
    }

    if (audioBlob) {
      fd.append('voice_audio', audioBlob, 'voice_report.webm');
    }

    try {
      const res = await grievanceApi.submitGrievance(fd);
      if (res.data) {
        setCreatedTicket(res.data);
        onTicketCreated?.(res.data);
        showToast(`Grievance ticket #${res.data.ticket_number} created successfully`, 'success');
      }
    } catch (err: any) {
      const msg = err.response?.data?.error?.message || err.message || 'Failed to submit grievance';
      showToast(msg, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="surface p-6 sm:p-7 space-y-6">
      {/* Header */}
      <div className="border-b border-rule pb-4">
        <h2 className="font-display text-lg sm:text-xl font-semibold text-ink">
          Submit incident or civic hazard
        </h2>
        <p className="font-body text-xs text-muted mt-1">
          Reports are automatically analyzed for nearby duplicate reports within 50m and routed to municipal authorities with strict SLA timers.
        </p>
      </div>

      {createdTicket ? (
        /* Result / Triage Summary Docket */
        <div className="surface p-5 space-y-4 animate-fade-up border-l-4 border-l-green">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-pill bg-green text-paper-2">
                <CheckCircle2 className="h-5 w-5" aria-hidden="true" />
              </div>
              <div>
                <h3 className="font-display text-base font-semibold text-ink">
                  Grievance ticket #{createdTicket.ticket_number} ingested and routed
                </h3>
              </div>
            </div>

            <button
              type="button"
              onClick={handleReset}
              className="btn-secondary min-h-[36px] py-1 px-3 text-xs"
            >
              <RotateCcw className="h-3 w-3" aria-hidden="true" />
              <span>Report another</span>
            </button>
          </div>

          {/* PostGIS 50m Deduplication Banner */}
          {createdTicket.duplicate_of_id && (
            <div className="flex items-start gap-2.5 rounded-pill border border-rule bg-paper-3 p-3.5 text-xs text-ink">
              <Layers className="h-4 w-4 shrink-0 mt-0.5 text-muted" aria-hidden="true" />
              <div>
                <span className="font-semibold">50m spatial deduplication match:</span> An active incident was identified within 50 meters of your coordinates. Your submission was consolidated as an escalation endorsement ({createdTicket.upvote_count} reports).
              </div>
            </div>
          )}

          {/* Triage Ruled Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-3 bg-paper border border-rule rounded-pill space-y-1">
              <span className="font-body text-[11px] text-muted">Severity assessment</span>
              <div className="flex items-center gap-1.5 text-xs font-semibold text-ink">
                <Flame className="h-3.5 w-3.5 text-muted" aria-hidden="true" />
                <span>{createdTicket.severity.toLowerCase()} ({createdTicket.severity_score}/100)</span>
              </div>
            </div>

            <div className="p-3 bg-paper border border-rule rounded-pill space-y-1">
              <span className="font-body text-[11px] text-muted">Assigned department</span>
              <div className="text-xs font-semibold text-ink truncate">
                {createdTicket.routed_department.name}
              </div>
              <div className="font-mono text-[10px] text-muted">
                {createdTicket.routed_department.code}
              </div>
            </div>

            <div className="p-3 bg-paper border border-rule rounded-pill space-y-1">
              <span className="font-body text-[11px] text-muted">Enforced SLA deadline</span>
              <div className="flex items-center gap-1.5 text-xs font-semibold text-ink">
                <Clock className="h-3.5 w-3.5 text-muted" aria-hidden="true" />
                <span className="font-mono">{new Date(createdTicket.sla_deadline).toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* AI Triage Summary */}
          {createdTicket.ai_triage_summary && (
            <div className="surface-sheet p-3.5 space-y-1 border-l-2 border-l-ink">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-ink">
                <Sparkles className="h-3.5 w-3.5 text-muted" aria-hidden="true" />
                <span>Automated triage summary</span>
              </div>
              <p className="font-body text-xs text-muted leading-relaxed">
                {createdTicket.ai_triage_summary}
              </p>
            </div>
          )}
        </div>
      ) : (
        /* Intake Form */
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Category Selector */}
          <div className="space-y-2">
            <label className="block text-xs font-medium text-muted">1. Select hazard category *</label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.code}
                  type="button"
                  onClick={() => setCategory(cat.code)}
                  className={`flex flex-col text-left p-3 rounded-pill border transition-colors ${
                    category === cat.code
                      ? 'border-ink bg-paper-3 shadow-subtle'
                      : 'border-rule bg-paper-2 hover:bg-paper-3 hover:border-ink'
                  }`}
                >
                  <span className="font-body text-xs font-semibold text-ink">{cat.label}</span>
                  <span className="font-body text-[11px] text-muted leading-tight mt-0.5">
                    {cat.desc}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Description & Voice Note */}
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs">
              <label className="font-medium text-muted">2. Incident description and voice note</label>
              <span className="font-body text-[11px] text-muted">Type or record in vernacular</span>
            </div>

            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the hazard location, visible damage, or immediate risk…"
              className="input-modern"
            />

            {/* Voice Note Module */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-pill border border-rule bg-paper p-3">
              <div className="flex items-center gap-3">
                {isRecording ? (
                  <button
                    type="button"
                    onClick={stopRecording}
                    className="flex h-9 w-9 items-center justify-center rounded-pill bg-accent text-accent-ink"
                    aria-label="Stop recording voice note"
                  >
                    <Square className="h-4 w-4" aria-hidden="true" />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={startRecording}
                    className="flex h-9 w-9 items-center justify-center rounded-pill bg-ink text-paper-2 hover:bg-ink-2 transition-colors"
                    aria-label="Start recording voice note"
                  >
                    <Mic className="h-4 w-4" aria-hidden="true" />
                  </button>
                )}

                <div>
                  <div className="font-body text-xs font-semibold text-ink">
                    {isRecording ? 'Recording voice note…' : audioUrl ? 'Voice note attached' : 'Record voice note (optional)'}
                  </div>
                  <div className="font-body text-[11px] text-muted">
                    {isRecording ? (
                      <span className="font-mono text-ink font-semibold">{recordingDuration}s recording</span>
                    ) : audioUrl ? (
                      'AI4Bharat Conformer ASR will transcribe'
                    ) : (
                      'Hindi, Tamil, Marathi, Telugu and Bengali supported'
                    )}
                  </div>
                </div>
              </div>

              {audioUrl && (
                <div className="flex items-center gap-2">
                  <audio src={audioUrl} controls className="h-7 max-w-[200px]" />
                  <button
                    type="button"
                    onClick={resetRecording}
                    className="text-xs text-accent hover:underline font-body font-medium"
                  >
                    Discard
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Photo & GPS Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Photo Attachment */}
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-muted">3. Photo evidence</label>
              <div className="flex items-center justify-center rounded-pill border border-dashed border-rule bg-paper p-4 text-center hover:bg-paper-3 transition-colors">
                {photoPreview ? (
                  <div className="relative group">
                    <img
                      src={photoPreview}
                      alt="Hazard evidence"
                      className="max-h-24 rounded-pill object-cover border border-rule shadow-subtle"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setPhotoFile(null);
                        setPhotoPreview(null);
                      }}
                      className="mt-1.5 text-xs text-accent hover:underline block mx-auto font-body font-medium"
                    >
                      Remove photo
                    </button>
                  </div>
                ) : (
                  <label className="flex cursor-pointer flex-col items-center gap-1">
                    <Camera className="h-5 w-5 text-muted" aria-hidden="true" />
                    <span className="text-xs font-medium text-ink">Attach or capture photo</span>
                    <span className="font-body text-[10px] text-muted">JPG or PNG up to 10MB</span>
                    <input
                      type="file"
                      accept="image/*"
                      capture="environment"
                      className="hidden"
                      onChange={handlePhotoChange}
                    />
                  </label>
                )}
              </div>
            </div>

            {/* Geolocation */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <label className="font-medium text-muted">4. Location and GPS</label>
                <button
                  type="button"
                  onClick={detectLocation}
                  disabled={geoLoading}
                  className="font-body text-xs text-ink hover:underline flex items-center gap-1 font-medium"
                >
                  <Compass className="h-3 w-3" aria-hidden="true" />
                  {geoLoading ? 'Detecting…' : 'Re-detect GPS'}
                </button>
              </div>

              <div className="rounded-pill border border-rule bg-paper p-2.5 text-xs text-ink">
                <div className="flex items-center justify-between">
                  <span className="text-muted text-[11px]">Coordinates:</span>
                  <span className="font-mono font-semibold text-ink">
                    {latitude ? `${latitude.toFixed(4)}, ${longitude?.toFixed(4)}` : 'Detecting GPS…'}
                  </span>
                </div>
              </div>

              <input
                type="text"
                value={addressLabel}
                onChange={(e) => setAddressLabel(e.target.value)}
                placeholder="Landmark or street address (optional)…"
                className="input-modern"
              />
            </div>
          </div>

          {/* Submit Action */}
          <div className="flex justify-end pt-2 border-t border-rule">
            <button
              type="submit"
              disabled={isSubmitting}
              className="btn-primary w-full sm:w-auto"
            >
              {isSubmitting ? 'Routing and deduplicating…' : 'Submit incident report'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

export default GrievanceIntakeForm;
