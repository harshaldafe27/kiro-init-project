import { useState, useCallback, useRef, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Upload, X, Bold, List, Link2, MapPin, Calendar, Users,
  DollarSign, FileText, ChevronDown, Eye, Save, Send,
  ImageIcon, Clock, AlertCircle, CheckCircle2, Loader2,
} from 'lucide-react';
import { createEventApi, updateEventApi, getEventApi } from '../../api/event.api';
import { submitApprovalRequestApi } from '../../api/approval.api';
import { useToast } from '../../hooks/useToast';

// ── Zod schema ────────────────────────────────────────────────────────────────
const schema = z.object({
  title:        z.string().min(3, 'Title must be at least 3 characters'),
  category:     z.string().min(1, 'Category is required'),
  mode:         z.enum(['Online', 'Offline', 'Hybrid']),
  shortDesc:    z.string().max(200, 'Max 200 characters').optional(),
  description:  z.string().min(10, 'Description must be at least 10 characters'),
  date:         z.string().min(1, 'Start date is required'),
  endDate:      z.string().optional(),
  deadline:     z.string().optional(),
  capacity:     z.coerce.number().min(1, 'Capacity must be at least 1'),
  venue:        z.string().min(1, 'Venue is required'),
  address:      z.string().optional(),
  rules:        z.string().optional(),
  isPaid:       z.boolean(),
  fee:          z.coerce.number().min(0).optional(),
  isTeam:       z.boolean(),
  maxTeamSize:  z.coerce.number().min(2).optional(),
  tags:         z.string().optional(),
  banner:       z.string().optional(),
});

const CATEGORIES = ['Cultural', 'Technical', 'Workshop', 'Sports', 'Academic', 'Hackathon', 'Other'];
const MODES = ['Online', 'Offline', 'Hybrid'];

// ── Main component ────────────────────────────────────────────────────────────
export default function CreateEventPage() {
  const navigate = useNavigate();
  const { id } = useParams(); // present when editing
  const isEdit = !!id;
  const toast = useToast();
  const qc = useQueryClient();
  const [bannerPreview, setBannerPreview] = useState(null);
  const [showPreview, setShowPreview] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);
  const autoSaveRef = useRef(null);

  // Fetch event data when editing
  const { data: eventData } = useQuery({
    queryKey: ['event', id],
    queryFn: () => getEventApi(id).then((r) => r.data.data),
    enabled: isEdit,
  });
  const existing = eventData?.event || eventData;

  const { register, handleSubmit, control, watch, setValue, reset, formState: { errors, isDirty } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      title: '', category: 'Cultural', mode: 'Offline', shortDesc: '',
      description: '', date: '', endDate: '', deadline: '', capacity: 100,
      venue: '', address: '', rules: '', isPaid: false, fee: 0,
      isTeam: false, maxTeamSize: 4, tags: '', banner: '',
    },
  });

  // Populate form when editing
  useEffect(() => {
    if (existing) {
      reset({
        title: existing.title || '',
        category: existing.category || 'Cultural',
        mode: existing.mode || 'Offline',
        shortDesc: existing.shortDesc || '',
        description: existing.description || '',
        date: existing.date ? existing.date.slice(0, 16) : '',
        endDate: existing.endDate ? existing.endDate.slice(0, 16) : '',
        deadline: existing.deadline ? existing.deadline.slice(0, 16) : '',
        capacity: existing.capacity || 100,
        venue: existing.venue || '',
        address: existing.address || '',
        rules: existing.rules || '',
        isPaid: (existing.fee || 0) > 0,
        fee: existing.fee || 0,
        isTeam: existing.isTeam || false,
        maxTeamSize: existing.maxTeamSize || 4,
        tags: existing.tags?.join(', ') || '',
        banner: existing.banner || '',
      });
      if (existing.banner) setBannerPreview(existing.banner);
    }
  }, [existing, reset]);

  const isPaid = watch('isPaid');
  const isTeam = watch('isTeam');
  const watchedValues = watch();

  // Auto-save draft every 30s
  useEffect(() => {
    autoSaveRef.current = setInterval(() => {
      if (isDirty) {
        const draft = watch();
        localStorage.setItem('eventflex_draft', JSON.stringify(draft));
      }
    }, 30000);
    return () => clearInterval(autoSaveRef.current);
  }, [isDirty, watch]);

  const mutation = useMutation({
    mutationFn: (payload) => isEdit ? updateEventApi(id, payload) : createEventApi(payload),
    onSuccess: (res, vars) => {
      toast.success('Draft saved!');
      qc.invalidateQueries({ queryKey: ['admin-events'] });
      qc.invalidateQueries({ queryKey: ['events'] });
      localStorage.removeItem('eventflex_draft');
      navigate('/admin/events');
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to save event'),
  });

  const approvalMutation = useMutation({
    mutationFn: (savedId) => submitApprovalRequestApi(savedId),
    onSuccess: () => {
      toast.success('Approval request sent to principal!');
      qc.invalidateQueries({ queryKey: ['admin-events'] });
      navigate('/admin/events');
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to submit request'),
  });

  const buildPayload = (data) => ({
    title: data.title,
    category: data.category,
    mode: data.mode,
    shortDesc: data.shortDesc,
    description: data.description,
    date: data.date,
    endDate: data.endDate || undefined,
    deadline: data.deadline || undefined,
    capacity: Number(data.capacity),
    venue: data.venue,
    address: data.address,
    rules: data.rules,
    fee: data.isPaid ? Number(data.fee) : 0,
    isTeam: data.isTeam,
    maxTeamSize: data.isTeam ? Number(data.maxTeamSize) : undefined,
    tags: data.tags ? data.tags.split(',').map((t) => t.trim()).filter(Boolean) : [],
    banner: data.banner || bannerPreview || '',
    isPublished: false,
  });

  const onDraft = handleSubmit((data) => mutation.mutate(buildPayload(data)));

  const onRequestApproval = handleSubmit(async (data) => {
    try {
      const payload = buildPayload(data);
      let savedId = id;
      if (isEdit) {
        await updateEventApi(id, payload);
      } else {
        const res = await createEventApi(payload);
        savedId = res.data.data.event._id;
        localStorage.removeItem('eventflex_draft');
      }
      approvalMutation.mutate(savedId);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save event');
    }
  });

  // Banner: compress + resize to max 1200px wide, quality 0.75, then base64
  const fileToBase64 = (file) =>
    new Promise((resolve) => {
      const img = new Image();
      const objectUrl = URL.createObjectURL(file);
      img.onload = () => {
        const MAX_W = 1200;
        const scale = img.width > MAX_W ? MAX_W / img.width : 1;
        const canvas = document.createElement('canvas');
        canvas.width  = Math.round(img.width  * scale);
        canvas.height = Math.round(img.height * scale);
        canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
        URL.revokeObjectURL(objectUrl);
        resolve(canvas.toDataURL('image/jpeg', 0.75));
      };
      img.src = objectUrl;
    });

  const handleDrop = useCallback(async (e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      const base64 = await fileToBase64(file);
      setBannerPreview(base64);
      setValue('banner', base64);
    }
  }, [setValue]);

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      const base64 = await fileToBase64(file);
      setBannerPreview(base64);
      setValue('banner', base64);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Top bar */}
      <div className="sticky top-0 z-30 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-4 sm:px-6 py-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
            <X size={18} className="text-gray-500" />
          </button>
          <div>
            <h1 className="text-base font-bold text-gray-900 dark:text-white leading-tight">
              {isEdit ? 'Edit Event' : 'Create Event'}
            </h1>
            <p className="text-xs text-gray-400">Fill in the details below</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button type="button" onClick={() => setShowPreview(true)}
            className="hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
            <Eye size={15} /> Preview
          </button>
          <button type="button" onClick={onDraft} disabled={mutation.isPending || approvalMutation.isPending}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors disabled:opacity-50">
            <Save size={15} /> {mutation.isPending ? 'Saving...' : 'Save Draft'}
          </button>
          <button type="button" onClick={onRequestApproval} disabled={mutation.isPending || approvalMutation.isPending}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold transition-colors disabled:opacity-50">
            {approvalMutation.isPending ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
            {isEdit ? 'Resubmit for Approval' : 'Request Approval'}
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        <SectionCard icon={<FileText size={18} />} title="Basic Details">
          <div className="space-y-4">
            <FormField label="Event Title" required error={errors.title?.message}>
              <input {...register('title')} placeholder="e.g. Annual Cultural Fest 2026"
                className={inputCls(errors.title)} />
            </FormField>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField label="Category" required error={errors.category?.message}>
                <div className="relative">
                  <select {...register('category')} className={selectCls(errors.category)}>
                    {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                  <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                </div>
              </FormField>
              <FormField label="Mode" required error={errors.mode?.message}>
                <div className="flex gap-2">
                  {MODES.map((m) => (
                    <Controller key={m} name="mode" control={control} render={({ field }) => (
                      <button type="button" onClick={() => field.onChange(m)}
                        className={`flex-1 py-2 rounded-lg text-xs font-semibold border transition-colors ${field.value === m ? 'bg-indigo-600 text-white border-indigo-600' : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'}`}>
                        {m}
                      </button>
                    )} />
                  ))}
                </div>
              </FormField>
            </div>
            {/* Banner upload */}
            <FormField label="Event Banner">
              <div
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`relative cursor-pointer rounded-xl border-2 border-dashed transition-colors overflow-hidden ${isDragging ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20' : 'border-gray-200 dark:border-gray-700 hover:border-indigo-400'}`}
              >
                {bannerPreview ? (
                  <div className="relative">
                    <img src={bannerPreview} alt="Banner preview" className="w-full h-48 object-cover" />
                    <button type="button" onClick={(e) => { e.stopPropagation(); setBannerPreview(null); setValue('banner', ''); }}
                      className="absolute top-2 right-2 p-1.5 bg-black/50 hover:bg-black/70 rounded-full text-white transition-colors">
                      <X size={14} />
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-10 gap-2">
                    <div className="p-3 bg-gray-100 dark:bg-gray-800 rounded-full">
                      <Upload size={20} className="text-gray-400" />
                    </div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Drag & drop or <span className="text-indigo-600 font-medium">browse</span></p>
                    <p className="text-xs text-gray-400">PNG, JPG up to 5MB · Recommended 1200×600px</p>
                  </div>
                )}
              </div>
              <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
            </FormField>
          </div>
        </SectionCard>

        <SectionCard icon={<FileText size={18} />} title="Description">
          <div className="space-y-4">
            <FormField label="Full Description" required error={errors.description?.message}>
              <SimpleRichEditor name="description" register={register} watch={watch} setValue={setValue} error={errors.description} />
            </FormField>
            <FormField label="Short Description" error={errors.shortDesc?.message} hint="Shown on event cards (max 200 chars)">
              <textarea {...register('shortDesc')} rows={2} placeholder="Brief summary of the event..."
                className={inputCls(errors.shortDesc)} />
            </FormField>
          </div>
        </SectionCard>

        <SectionCard icon={<Calendar size={18} />} title="Event Details">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField label="Start Date & Time" required error={errors.date?.message}>
              <input type="datetime-local" {...register('date')} className={inputCls(errors.date)} />
            </FormField>
            <FormField label="End Date & Time" error={errors.endDate?.message}>
              <input type="datetime-local" {...register('endDate')} className={inputCls(errors.endDate)} />
            </FormField>
            <FormField label="Registration Deadline" error={errors.deadline?.message}>
              <input type="datetime-local" {...register('deadline')} className={inputCls(errors.deadline)} />
            </FormField>
            <FormField label="Max Participants" required error={errors.capacity?.message}>
              <input type="number" min={1} {...register('capacity')} placeholder="100" className={inputCls(errors.capacity)} />
            </FormField>
          </div>
        </SectionCard>

        <SectionCard icon={<MapPin size={18} />} title="Location">
          <div className="space-y-4">
            <FormField label="Venue Name" required error={errors.venue?.message}>
              <input {...register('venue')} placeholder="e.g. Main Auditorium, Block A" className={inputCls(errors.venue)} />
            </FormField>
            <FormField label="Address" error={errors.address?.message}>
              <input {...register('address')} placeholder="Full address..." className={inputCls(errors.address)} />
            </FormField>
            {/* Map placeholder */}
            <div className="rounded-xl bg-gray-100 dark:bg-gray-800 h-32 flex items-center justify-center border border-gray-200 dark:border-gray-700">
              <div className="text-center">
                <MapPin size={24} className="text-gray-300 mx-auto mb-1" />
                <p className="text-xs text-gray-400">Map preview (optional integration)</p>
              </div>
            </div>
          </div>
        </SectionCard>

        <SectionCard icon={<FileText size={18} />} title="Rules & Guidelines">
          <FormField label="Rules" error={errors.rules?.message} hint="One rule per line">
            <textarea {...register('rules')} rows={5} placeholder={"1. Participants must carry their ID cards.\n2. Late entries will not be allowed.\n3. Decision of judges will be final."}
              className={inputCls(errors.rules)} />
          </FormField>
        </SectionCard>

        <SectionCard icon={<DollarSign size={18} />} title="Fees">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Registration Fee</p>
                <p className="text-xs text-gray-400 mt-0.5">Toggle to enable paid registration</p>
              </div>
              <Controller name="isPaid" control={control} render={({ field }) => (
                <button type="button" onClick={() => field.onChange(!field.value)}
                  className={`relative w-12 h-6 rounded-full transition-colors ${field.value ? 'bg-indigo-600' : 'bg-gray-200 dark:bg-gray-700'}`}>
                  <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${field.value ? 'translate-x-6' : ''}`} />
                </button>
              )} />
            </div>
            {isPaid && (
              <FormField label="Fee Amount (₹)" required error={errors.fee?.message}>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">₹</span>
                  <input type="number" min={0} {...register('fee')} placeholder="500" className={`${inputCls(errors.fee)} pl-7`} />
                </div>
              </FormField>
            )}
          </div>
        </SectionCard>

        <SectionCard icon={<Users size={18} />} title="Team Settings">
          <div className="space-y-4">
            <div className="flex gap-3">
              <Controller name="isTeam" control={control} render={({ field }) => (
                <>
                  <button type="button" onClick={() => field.onChange(false)}
                    className={`flex-1 py-2.5 rounded-xl text-sm font-semibold border transition-colors ${!field.value ? 'bg-indigo-600 text-white border-indigo-600' : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'}`}>
                    Individual
                  </button>
                  <button type="button" onClick={() => field.onChange(true)}
                    className={`flex-1 py-2.5 rounded-xl text-sm font-semibold border transition-colors ${field.value ? 'bg-indigo-600 text-white border-indigo-600' : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'}`}>
                    Team
                  </button>
                </>
              )} />
            </div>
            {isTeam && (
              <FormField label="Max Team Size" error={errors.maxTeamSize?.message}>
                <input type="number" min={2} max={20} {...register('maxTeamSize')} placeholder="4" className={inputCls(errors.maxTeamSize)} />
              </FormField>
            )}
          </div>
        </SectionCard>

        <SectionCard icon={<FileText size={18} />} title="Tags">
          <FormField label="Tags" hint="Comma separated — e.g. dance, music, cultural">
            <input {...register('tags')} placeholder="dance, music, cultural, fest" className={inputCls()} />
          </FormField>
        </SectionCard>

        {/* Sticky bottom actions (mobile) */}
        <div className="sm:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 p-4 flex gap-3 z-30">
          <button type="button" onClick={onDraft} disabled={mutation.isPending || approvalMutation.isPending}
            className="flex-1 py-3 rounded-xl border border-gray-200 dark:border-gray-700 text-sm font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-50 transition-colors disabled:opacity-50">
            Save Draft
          </button>
          <button type="button" onClick={onRequestApproval} disabled={mutation.isPending || approvalMutation.isPending}
            className="flex-1 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold transition-colors disabled:opacity-50">
            {approvalMutation.isPending ? 'Submitting...' : 'Request Approval'}
          </button>
        </div>
        <div className="h-20 sm:h-0" /> {/* spacer for sticky bar */}
      </div>

      {/* Preview overlay */}
      {showPreview && (
        <EventPreview data={watchedValues} banner={bannerPreview} onClose={() => setShowPreview(false)} />
      )}
    </div>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function SectionCard({ icon, title, children }) {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden">
      <div className="flex items-center gap-2 px-5 py-4 border-b border-gray-100 dark:border-gray-800">
        <span className="text-indigo-600 dark:text-indigo-400">{icon}</span>
        <h2 className="text-sm font-bold text-gray-800 dark:text-white uppercase tracking-wide">{title}</h2>
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

function FormField({ label, required, error, hint, children }) {
  return (
    <div className="space-y-1">
      {label && (
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          {label}{required && <span className="text-red-500 ml-0.5">*</span>}
        </label>
      )}
      {children}
      {hint && !error && <p className="text-xs text-gray-400">{hint}</p>}
      {error && (
        <p className="flex items-center gap-1 text-xs text-red-500">
          <AlertCircle size={11} /> {error}
        </p>
      )}
    </div>
  );
}

/** Minimal rich-text toolbar — bold, bullets, link — using contentEditable */
function SimpleRichEditor({ name, register, watch, setValue, error }) {
  const ref = useRef(null);
  const exec = (cmd, val) => { document.execCommand(cmd, false, val); ref.current?.focus(); };

  return (
    <div className={`rounded-xl border overflow-hidden ${error ? 'border-red-400' : 'border-gray-200 dark:border-gray-700'}`}>
      {/* Toolbar */}
      <div className="flex items-center gap-1 px-3 py-2 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <ToolbarBtn onClick={() => exec('bold')} title="Bold"><Bold size={14} /></ToolbarBtn>
        <ToolbarBtn onClick={() => exec('insertUnorderedList')} title="Bullet list"><List size={14} /></ToolbarBtn>
        <ToolbarBtn onClick={() => { const url = prompt('Enter URL'); if (url) exec('createLink', url); }} title="Insert link">
          <Link2 size={14} />
        </ToolbarBtn>
      </div>
      {/* Editable area */}
      <div
        ref={ref}
        contentEditable
        suppressContentEditableWarning
        onInput={(e) => setValue(name, e.currentTarget.innerHTML)}
        className="min-h-[120px] px-3 py-2.5 text-sm text-gray-800 dark:text-gray-200 bg-white dark:bg-gray-900 focus:outline-none"
        style={{ lineHeight: '1.6' }}
      />
      {/* Hidden input for RHF */}
      <input type="hidden" {...register(name)} />
    </div>
  );
}

function ToolbarBtn({ onClick, title, children }) {
  return (
    <button type="button" onClick={onClick} title={title}
      className="p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 transition-colors">
      {children}
    </button>
  );
}

function EventPreview({ data, banner, onClose }) {
  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-start justify-center overflow-y-auto p-4">
      <div className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-2xl my-8 overflow-hidden shadow-2xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-800">
          <div className="flex items-center gap-2">
            <Eye size={16} className="text-indigo-600" />
            <span className="font-semibold text-gray-800 dark:text-white text-sm">Event Preview</span>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
            <X size={16} className="text-gray-500" />
          </button>
        </div>
        {/* Banner */}
        <div className="w-full h-48 bg-gradient-to-br from-indigo-500 to-purple-600 relative">
          {banner ? <img src={banner} alt="banner" className="w-full h-full object-cover" /> : (
            <div className="w-full h-full flex items-center justify-center">
              <ImageIcon size={40} className="text-white/40" />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          <div className="absolute bottom-0 left-0 p-5">
            {data.category && <span className="text-xs bg-indigo-600 text-white px-2 py-0.5 rounded-full mb-1 inline-block">{data.category}</span>}
            <h2 className="text-white font-bold text-xl">{data.title || 'Event Title'}</h2>
          </div>
        </div>
        {/* Details */}
        <div className="p-5 space-y-3 text-sm text-gray-600 dark:text-gray-300">
          <div className="flex flex-wrap gap-4">
            {data.date && <span className="flex items-center gap-1.5"><Calendar size={14} className="text-indigo-500" />{data.date.replace('T', ' ')}</span>}
            {data.venue && <span className="flex items-center gap-1.5"><MapPin size={14} className="text-indigo-500" />{data.venue}</span>}
            {data.capacity && <span className="flex items-center gap-1.5"><Users size={14} className="text-indigo-500" />Max {data.capacity}</span>}
            <span className="flex items-center gap-1.5"><DollarSign size={14} className="text-indigo-500" />{data.isPaid ? `₹${data.fee}` : 'Free'}</span>
          </div>
          {data.shortDesc && <p className="text-gray-500 dark:text-gray-400 text-xs">{data.shortDesc}</p>}
          {data.description && (
            <div className="prose prose-sm dark:prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: data.description }} />
          )}
          {data.tags && (
            <div className="flex flex-wrap gap-1.5 pt-1">
              {data.tags.split(',').map((t) => t.trim()).filter(Boolean).map((t) => (
                <span key={t} className="text-xs bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 px-2 py-0.5 rounded-full">#{t}</span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Tailwind helpers ──────────────────────────────────────────────────────────
const inputCls = (err) =>
  `w-full px-3 py-2.5 rounded-xl border text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors ${err ? 'border-red-400' : 'border-gray-200 dark:border-gray-700'}`;

const selectCls = (err) =>
  `w-full px-3 py-2.5 pr-8 rounded-xl border text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white appearance-none focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors ${err ? 'border-red-400' : 'border-gray-200 dark:border-gray-700'}`;
