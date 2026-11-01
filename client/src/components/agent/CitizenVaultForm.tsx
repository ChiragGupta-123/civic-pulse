import { useState, useEffect } from 'react';
import { Lock, Save, ShieldCheck } from 'lucide-react';
import { identityApi } from '../../api/identity.api';
import { showToast } from '../feedback/ToastContainer';
import type { CitizenVaultUpsertRequest } from '../../types/identity.types';

export function CitizenVaultForm() {
  const [isSaving, setIsSaving] = useState(false);

  // PII Confidential Secret State
  const [nationalId, setNationalId] = useState('9876-5432-1098');
  const [dob, setDob] = useState('1995-08-15');
  const [bankIban, setBankIban] = useState('SBIN000123456789');
  const [phoneNumber, setPhoneNumber] = useState('+919876543210');
  const [portalPin, setPortalPin] = useState('889900');

  // Public Profile State
  const [stateName, setStateName] = useState('Delhi');
  const [annualIncome, setAnnualIncome] = useState(240000);
  const [occupation, setOccupation] = useState('Student / Junior Researcher');
  const [category, setCategory] = useState('OBC');
  const [isMsme, setIsMsme] = useState(false);
  const [educationLevel, setEducationLevel] = useState('Post-Graduate');

  useEffect(() => {
    async function loadVault() {
      try {
        const res = await identityApi.getVault();
        if (res.data) {
          const v = res.data;
          if (v.pii_secret) {
            setNationalId(v.pii_secret.national_id || '');
            setDob(v.pii_secret.dob || '');
            setBankIban(v.pii_secret.bank_iban || '');
            setPhoneNumber(v.pii_secret.phone_number || '');
            setPortalPin(v.pii_secret.portal_pin || '');
          }
          if (v.public_profile) {
            setStateName(v.public_profile.state || 'Delhi');
            setAnnualIncome(v.public_profile.annual_income || 240000);
            setOccupation(v.public_profile.occupation || '');
            setCategory(v.public_profile.category || 'General');
            setIsMsme(Boolean(v.public_profile.is_msme));
            setEducationLevel(v.public_profile.education_level || '');
          }
        }
      } catch {
        // Defaults preserved if vault is not created yet
      }
    }
    loadVault();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    const payload: CitizenVaultUpsertRequest = {
      pii_secret: {
        national_id: nationalId,
        dob,
        bank_iban: bankIban,
        phone_number: phoneNumber,
        portal_pin: portalPin,
      },
      public_profile: {
        state: stateName,
        annual_income: Number(annualIncome),
        occupation,
        category,
        is_msme: isMsme,
        education_level: educationLevel,
      },
      document_urls: [],
    };

    try {
      await identityApi.upsertVault(payload);
      showToast('Citizen vault encrypted and saved with AES-256-GCM', 'success');
    } catch (err: any) {
      const msg = err.response?.data?.error?.message || err.message || 'Failed to update vault';
      showToast(msg, 'error');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="surface p-5 sm:p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-rule pb-3.5">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-pill bg-paper-3 text-ink">
            <Lock className="h-4 w-4" aria-hidden="true" />
          </div>
          <div>
            <h3 className="font-display text-base font-semibold text-ink">Encrypted citizen vault</h3>
            <p className="font-body text-xs text-muted">Hardware-isolated AES-256-GCM credentials</p>
          </div>
        </div>
        <span className="badge-settled">
          <ShieldCheck className="h-3 w-3" aria-hidden="true" />
          <span>Active vault</span>
        </span>
      </div>

      <form onSubmit={handleSave} className="space-y-4">
        {/* Confidential PII Secrets */}
        <div className="space-y-3">
          <div className="flex items-center justify-between border-b border-rule pb-1 text-xs">
            <span className="font-medium text-ink">Confidential secrets</span>
            <span className="font-mono text-[11px] text-muted">AES-256-GCM</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="block text-xs font-medium text-muted">Aadhaar / National ID</label>
              <input
                type="text"
                required
                value={nationalId}
                onChange={(e) => setNationalId(e.target.value)}
                className="input-modern font-mono"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-medium text-muted">Date of birth</label>
              <input
                type="date"
                required
                value={dob}
                onChange={(e) => setDob(e.target.value)}
                className="input-modern font-mono"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-medium text-muted">Bank account / IBAN</label>
              <input
                type="text"
                required
                value={bankIban}
                onChange={(e) => setBankIban(e.target.value)}
                className="input-modern font-mono"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-medium text-muted">Portal security PIN</label>
              <input
                type="password"
                required
                value={portalPin}
                onChange={(e) => setPortalPin(e.target.value)}
                className="input-modern font-mono"
              />
            </div>
          </div>
        </div>

        {/* Public Demographics Profile */}
        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between border-b border-rule pb-1 text-xs">
            <span className="font-medium text-ink">Demographic eligibility profile</span>
            <span className="font-body text-[11px] text-muted">Used for scheme matching</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="block text-xs font-medium text-muted">State of domicile</label>
              <input
                type="text"
                value={stateName}
                onChange={(e) => setStateName(e.target.value)}
                className="input-modern"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-medium text-muted">Annual income (₹)</label>
              <input
                type="number"
                value={annualIncome}
                onChange={(e) => setAnnualIncome(Number(e.target.value))}
                className="input-modern font-mono"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-medium text-muted">Occupation</label>
              <input
                type="text"
                value={occupation}
                onChange={(e) => setOccupation(e.target.value)}
                className="input-modern"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-medium text-muted">Social category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="input-modern"
              >
                <option value="General">General</option>
                <option value="OBC">OBC</option>
                <option value="SC">SC</option>
                <option value="ST">ST</option>
                <option value="EWS">EWS</option>
              </select>
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-2 border-t border-rule">
          <button
            type="submit"
            disabled={isSaving}
            className="btn-primary w-full sm:w-auto"
          >
            <Save className="h-3.5 w-3.5" aria-hidden="true" />
            <span>{isSaving ? 'Encrypting and saving…' : 'Save encrypted vault'}</span>
          </button>
        </div>
      </form>
    </div>
  );
}

export default CitizenVaultForm;
