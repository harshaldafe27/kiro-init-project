import { useState } from 'react';

const YEARS = ['1st Year', '2nd Year', '3rd Year', '4th Year'];

const emptyMember = () => ({ name: '', btId: '', branch: '', year: '' });

/**
 * Multi-step registration modal (Unstop-style).
 * Steps: 1 → Participant Details  2 → Team  3 → T&C + Payment
 *
 * Props:
 *   event: Event object
 *   onSubmit: (formData) => Promise<void>   — called on final confirm
 *   onClose: () => void
 *   isPending: boolean
 */
export default function RegistrationModal({ event, onSubmit, onClose, isPending }) {
  const [step, setStep] = useState(1);
  const [participant, setParticipant] = useState({ name: '', btId: '', branch: '', year: '' });
  const [isTeam, setIsTeam] = useState(false);
  const [teamName, setTeamName] = useState('');
  const [members, setMembers] = useState([emptyMember()]);
  const [agreed, setAgreed] = useState(false);
  const [errors, setErrors] = useState({});

  // ── Step 1 validation ──────────────────────────────────────────────────────
  const validateStep1 = () => {
    const e = {};
    if (!participant.name.trim()) e.name = 'Name is required';
    if (!participant.btId.trim()) e.btId = 'BT ID is required';
    if (!participant.branch.trim()) e.branch = 'Branch is required';
    if (!participant.year) e.year = 'Year is required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  // ── Step 2 validation ──────────────────────────────────────────────────────
  const validateStep2 = () => {
    if (!isTeam) return true;
    const e = {};
    if (!teamName.trim()) e.teamName = 'Team name is required';
    members.forEach((m, i) => {
      if (!m.name.trim()) e[`m${i}name`] = 'Required';
      if (!m.btId.trim()) e[`m${i}btId`] = 'Required';
      if (!m.branch.trim()) e[`m${i}branch`] = 'Required';
      if (!m.year) e[`m${i}year`] = 'Required';
    });
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleNext = () => {
    setErrors({});
    if (step === 1 && !validateStep1()) return;
    if (step === 2 && !validateStep2()) return;
    setStep((s) => s + 1);
  };

  const handleMemberChange = (i, field, val) => {
    setMembers((prev) => prev.map((m, idx) => idx === i ? { ...m, [field]: val } : m));
  };

  const handleConfirm = () => {
    if (!agreed) { setErrors({ agreed: 'You must accept the terms' }); return; }
    const formData = {
      participantDetails: participant,
      ...(isTeam ? { teamName, teamMembers: members } : {}),
    };
    onSubmit(formData);
  };

  const STEPS = ['Your Details', 'Team', 'Confirm & Pay'];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-4 flex items-center justify-between">
          <div>
            <p className="text-indigo-200 text-xs">Registering for</p>
            <h2 className="text-white font-bold text-base leading-tight">{event.title}</h2>
          </div>
          <button onClick={onClose} className="text-white/70 hover:text-white text-xl leading-none">✕</button>
        </div>

        {/* Step indicator */}
        <div className="flex border-b border-gray-100 dark:border-gray-800">
          {STEPS.map((label, i) => (
            <div key={i} className={`flex-1 py-3 text-center text-xs font-semibold transition-colors ${
              step === i + 1
                ? 'text-indigo-600 border-b-2 border-indigo-600'
                : step > i + 1
                ? 'text-green-600'
                : 'text-gray-400'
            }`}>
              {step > i + 1 ? '✓ ' : `${i + 1}. `}{label}
            </div>
          ))}
        </div>

        <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
          {/* ── STEP 1: Participant Details ── */}
          {step === 1 && (
            <>
              <p className="text-sm text-gray-500 dark:text-gray-400">Fill in your details as the primary participant.</p>
              <Field label="Full Name *" error={errors.name}>
                <input value={participant.name} onChange={(e) => setParticipant({ ...participant, name: e.target.value })}
                  placeholder="John Doe" className={inputCls(errors.name)} />
              </Field>
              <Field label="BT ID *" error={errors.btId}>
                <input value={participant.btId} onChange={(e) => setParticipant({ ...participant, btId: e.target.value })}
                  placeholder="BT22CSE001" className={inputCls(errors.btId)} />
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Branch *" error={errors.branch}>
                  <input value={participant.branch} onChange={(e) => setParticipant({ ...participant, branch: e.target.value })}
                    placeholder="CSE" className={inputCls(errors.branch)} />
                </Field>
                <Field label="Year *" error={errors.year}>
                  <select value={participant.year} onChange={(e) => setParticipant({ ...participant, year: e.target.value })}
                    className={inputCls(errors.year)}>
                    <option value="">Select</option>
                    {YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
                  </select>
                </Field>
              </div>
            </>
          )}

          {/* ── STEP 2: Team ── */}
          {step === 2 && (
            <>
              <p className="text-sm text-gray-500 dark:text-gray-400">Is this a team participation?</p>
              <div className="flex gap-3">
                <button onClick={() => setIsTeam(false)}
                  className={`flex-1 py-2.5 rounded-xl text-sm font-medium border transition-colors ${!isTeam ? 'bg-indigo-600 text-white border-indigo-600' : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300'}`}>
                  Solo
                </button>
                <button onClick={() => setIsTeam(true)}
                  className={`flex-1 py-2.5 rounded-xl text-sm font-medium border transition-colors ${isTeam ? 'bg-indigo-600 text-white border-indigo-600' : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300'}`}>
                  Team
                </button>
              </div>

              {isTeam && (
                <div className="space-y-4">
                  <Field label="Team Name *" error={errors.teamName}>
                    <input value={teamName} onChange={(e) => setTeamName(e.target.value)}
                      placeholder="Team Innovators" className={inputCls(errors.teamName)} />
                  </Field>

                  <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Team Members</p>
                  {members.map((m, i) => (
                    <div key={i} className="border border-gray-100 dark:border-gray-800 rounded-xl p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-gray-500">Member {i + 1}</span>
                        {members.length > 1 && (
                          <button onClick={() => setMembers((prev) => prev.filter((_, idx) => idx !== i))}
                            className="text-xs text-red-500 hover:text-red-700">Remove</button>
                        )}
                      </div>
                      <Field label="Name *" error={errors[`m${i}name`]}>
                        <input value={m.name} onChange={(e) => handleMemberChange(i, 'name', e.target.value)}
                          placeholder="Jane Doe" className={inputCls(errors[`m${i}name`])} />
                      </Field>
                      <Field label="BT ID *" error={errors[`m${i}btId`]}>
                        <input value={m.btId} onChange={(e) => handleMemberChange(i, 'btId', e.target.value)}
                          placeholder="BT22CSE002" className={inputCls(errors[`m${i}btId`])} />
                      </Field>
                      <div className="grid grid-cols-2 gap-3">
                        <Field label="Branch *" error={errors[`m${i}branch`]}>
                          <input value={m.branch} onChange={(e) => handleMemberChange(i, 'branch', e.target.value)}
                            placeholder="ECE" className={inputCls(errors[`m${i}branch`])} />
                        </Field>
                        <Field label="Year *" error={errors[`m${i}year`]}>
                          <select value={m.year} onChange={(e) => handleMemberChange(i, 'year', e.target.value)}
                            className={inputCls(errors[`m${i}year`])}>
                            <option value="">Select</option>
                            {YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
                          </select>
                        </Field>
                      </div>
                    </div>
                  ))}
                  <button onClick={() => setMembers((prev) => [...prev, emptyMember()])}
                    className="w-full py-2 rounded-xl border border-dashed border-indigo-300 dark:border-indigo-700 text-indigo-600 dark:text-indigo-400 text-sm hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors">
                    + Add Member
                  </button>
                </div>
              )}
            </>
          )}

          {/* ── STEP 3: T&C + Payment ── */}
          {step === 3 && (
            <>
              <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 space-y-2 text-sm">
                <p className="font-semibold text-gray-800 dark:text-white">Registration Summary</p>
                <SummaryRow label="Event" value={event.title} />
                <SummaryRow label="Participant" value={participant.name} />
                <SummaryRow label="BT ID" value={participant.btId} />
                <SummaryRow label="Branch / Year" value={`${participant.branch} · ${participant.year}`} />
                {isTeam && <SummaryRow label="Team" value={`${teamName} (${members.length + 1} members)`} />}
                <div className="border-t border-gray-200 dark:border-gray-700 pt-2 flex justify-between font-semibold">
                  <span className="text-gray-600 dark:text-gray-300">Amount</span>
                  <span className="text-gray-900 dark:text-white">{event.fee > 0 ? `₹${event.fee}` : 'Free'}</span>
                </div>
              </div>

              <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-xl p-4 text-xs text-amber-800 dark:text-amber-300 space-y-1">
                <p className="font-semibold">Terms & Conditions</p>
                <p>• Registration is non-refundable once confirmed.</p>
                <p>• You must carry this ticket (digital or printed) to the event.</p>
                <p>• The organizer reserves the right to cancel or reschedule the event.</p>
                <p>• Participants must follow the event code of conduct.</p>
              </div>

              <label className="flex items-start gap-3 cursor-pointer">
                <input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)}
                  className="mt-0.5 accent-indigo-600" />
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  I have read and agree to the Terms & Conditions
                </span>
              </label>
              {errors.agreed && <p className="text-xs text-red-500">{errors.agreed}</p>}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 dark:border-gray-800 flex gap-3">
          {step > 1 && (
            <button onClick={() => setStep((s) => s - 1)}
              className="px-5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
              ← Back
            </button>
          )}
          <div className="flex-1" />
          {step < 3 ? (
            <button onClick={handleNext}
              className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold transition-colors">
              Next →
            </button>
          ) : (
            <button onClick={handleConfirm} disabled={isPending}
              className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white text-sm font-semibold transition-colors">
              {isPending ? 'Processing...' : event.fee > 0 ? `Pay ₹${event.fee}` : 'Confirm Registration'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function Field({ label, error, children }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">{label}</label>
      {children}
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  );
}

function SummaryRow({ label, value }) {
  return (
    <div className="flex justify-between text-xs">
      <span className="text-gray-500 dark:text-gray-400">{label}</span>
      <span className="text-gray-800 dark:text-gray-200 font-medium">{value}</span>
    </div>
  );
}

const inputCls = (err) =>
  `w-full px-3 py-2 rounded-xl border text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors ${
    err ? 'border-red-400' : 'border-gray-200 dark:border-gray-700'
  }`;
