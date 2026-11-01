import { useState, type FormEvent } from 'react';
import { Crosshair, FileUp } from 'lucide-react';
import { Dialog } from '@/components/ui/Dialog';
import { Button } from '@/components/ui/Button';
import { TextAreaField, TextField } from '@/components/ui/Field';
import { Select } from '@/components/ui/Select';
import { ErrorNotice } from '@/components/feedback/States';
import { createGrievance } from '@/api/grievance.api';
import { toRequestError, type RequestError } from '@/api/httpClient';
import type { GrievanceTicketDto } from '@/types/grievance.types';

const CATEGORY_OPTIONS = [
  { value: 'WATER_LEAK', label: 'Water leak' },
  { value: 'ELECTRICAL', label: 'Electrical' },
  { value: 'ROADS', label: 'Roads and footpaths' },
  { value: 'SANITATION', label: 'Sanitation and waste' },
  { value: 'DRAINAGE', label: 'Drainage' },
  { value: 'OTHER', label: 'Other' },
];

interface GrievanceIntakeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: (ticket: GrievanceTicketDto) => void;
}

export function GrievanceIntakeDialog({ open, onOpenChange, onCreated }: GrievanceIntakeDialogProps) {
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('WATER_LEAK');
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [address, setAddress] = useState('');
  const [photo, setPhoto] = useState<File | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [requestError, setRequestError] = useState<RequestError | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [locating, setLocating] = useState(false);
  const [locationNote, setLocationNote] = useState<string | null>(null);

  function reset() {
    setDescription('');
    setCategory('WATER_LEAK');
    setLatitude('');
    setLongitude('');
    setAddress('');
    setPhoto(null);
    setErrors({});
    setRequestError(null);
    setLocationNote(null);
  }

  function useMyLocation() {
    if (!('geolocation' in navigator)) {
      setLocationNote('This browser does not expose a location.');
      return;
    }
    setLocating(true);
    setLocationNote(null);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLatitude(position.coords.latitude.toFixed(5));
        setLongitude(position.coords.longitude.toFixed(5));
        setLocating(false);
        setLocationNote('Coordinates taken from this device.');
      },
      () => {
        setLocating(false);
        setLocationNote('Location was refused. Enter the coordinates by hand.');
      },
      { enableHighAccuracy: true, timeout: 8000 },
    );
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextErrors: Record<string, string> = {};
    if (description.trim().length < 10) {
      nextErrors.description = 'Describe the problem in at least ten characters.';
    }
    const lat = Number(latitude);
    const lng = Number(longitude);
    if (!Number.isFinite(lat) || lat < -90 || lat > 90) {
      nextErrors.latitude = 'A latitude between -90 and 90 is required.';
    }
    if (!Number.isFinite(lng) || lng < -180 || lng > 180) {
      nextErrors.longitude = 'A longitude between -180 and 180 is required.';
    }
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setSubmitting(true);
    setRequestError(null);
    try {
      const ticket = await createGrievance({
        description: description.trim(),
        latitude: lat,
        longitude: lng,
        addressLabel: address.trim() || undefined,
        categoryHint: category,
        photo,
      });
      onCreated(ticket);
      reset();
      onOpenChange(false);
    } catch (error) {
      setRequestError(toRequestError(error));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) setRequestError(null);
        onOpenChange(next);
      }}
      title="File a report"
      description="The report is routed to a department by category and location. Its deadline starts as soon as the record is written."
      size="lg"
      footer={
        <div className="flex items-center justify-between gap-3">
          <p className="hidden text-2xs text-muted sm:block">
            Photographs are optional. Location is required.
          </p>
          <div className="flex items-center gap-2">
            <Button variant="quiet" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button variant="primary" form="grievance-intake" type="submit" disabled={submitting}>
              {submitting ? 'Filing…' : 'File report'}
            </Button>
          </div>
        </div>
      }
    >
      <form id="grievance-intake" onSubmit={handleSubmit} className="space-y-4" noValidate>
        {requestError ? <ErrorNotice error={requestError} compact /> : null}

        <TextAreaField
          label="What is wrong, and where exactly?"
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          error={errors.description}
          rows={4}
          maxLength={1200}
        />

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <p className="mb-1 text-xs text-muted">Category</p>
            <Select
              value={category}
              onValueChange={setCategory}
              options={CATEGORY_OPTIONS}
              label="Category"
              compact={false}
              className="w-full"
            />
          </div>
          <div>
            <p className="mb-1 text-xs text-muted">Address label</p>
            <TextField
              label="Street, sector or landmark"
              value={address}
              onChange={(event) => setAddress(event.target.value)}
              maxLength={180}
            />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <TextField
            label="Latitude"
            inputMode="decimal"
            value={latitude}
            onChange={(event) => setLatitude(event.target.value)}
            error={errors.latitude}
          />
          <TextField
            label="Longitude"
            inputMode="decimal"
            value={longitude}
            onChange={(event) => setLongitude(event.target.value)}
            error={errors.longitude}
          />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Button size="sm" onClick={useMyLocation} disabled={locating}>
            <Crosshair size={13} aria-hidden />
            {locating ? 'Locating…' : 'Use my location'}
          </Button>

          <label className="key key--sm cursor-pointer">
            <FileUp size={13} aria-hidden />
            {photo ? 'Replace photograph' : 'Attach photograph'}
            <input
              type="file"
              accept="image/*"
              className="sr-only"
              onChange={(event) => setPhoto(event.target.files?.[0] ?? null)}
            />
          </label>

          {photo ? <span className="truncate text-2xs text-muted">{photo.name}</span> : null}
        </div>

        {locationNote ? <p className="text-2xs text-muted">{locationNote}</p> : null}
      </form>
    </Dialog>
  );
}
