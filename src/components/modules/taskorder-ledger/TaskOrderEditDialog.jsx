import { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, ArrowRight, CheckCircle2, Loader2, X } from 'lucide-react';

const LABELS = {
  transfer: 'Transfer Country',
  countryAdd: 'Add Country',
  skillAdd: 'Add Skill',
  skillEdit: 'Edit Skill',
  profileAdd: 'Add Task Order',
  profileEdit: 'Edit Task Order',
};
const field = 'w-full h-10 rounded-lg border border-slate-200 bg-white px-3 text-xs text-slate-800 focus:outline-none focus:border-[#0b3b68] focus:ring-2 focus:ring-[#0b3b68]/10';
const label = 'mb-1 block text-[11px] font-bold text-slate-700';

export default function TaskOrderEditDialog({ action, countries, profiles, onClose, onSave, saving, error }) {
  // Provide controlled defaults on the first render. The action-specific values are
  // populated by the effect below, which runs only after the dialog first renders.
  const [form, setForm] = useState({
    country: '', profileId: '', skillsText: '', skill: '', status: 'ACTIVE',
    taskOrderCode: '', taskOrderName: '', region: '', description: '',
    isActive: false, reason: '', businessEffectiveDate: '',
  });
  const [reviewing, setReviewing] = useState(false);
  const isTransfer = action?.type === 'transfer';
  const isCountryAdd = action?.type === 'countryAdd';
  const isSkill = action?.type === 'skillAdd' || action?.type === 'skillEdit';
  const isProfile = action?.type === 'profileAdd' || action?.type === 'profileEdit';
  const row = action?.item || {};
  useEffect(() => {
    if (!action) return;
    setReviewing(false);
    setForm({
      country: action.type === 'skillAdd' ? (row.country || countries[0]?.country || '') : row.country || '',
      profileId: '', skillsText: '', skill: row.skill || '', status: row.status || 'ACTIVE',
      taskOrderCode: '', taskOrderName: row.task_order_name || '', region: row.region || '',
      description: row.description || '', isActive: Number(row.is_active) === 1,
      reason: '', businessEffectiveDate: '',
    });
  }, [action, countries]);
  const activeProfiles = useMemo(() => profiles.filter((p) => Number(p.is_active) === 1), [profiles]);
  if (!action) return null;
  const change = (name, value) => { setForm((old) => ({ ...old, [name]: value })); setReviewing(false); };
  const selected = profiles.find((p) => Number(p.id) === Number(form.profileId));
  const current = profiles.find((p) => Number(p.id) === Number(row.profileId));
  const initialSkills = form.skillsText.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  const canReview = form.reason.trim().length >= 5 && form.reason.trim().length <= 1000 &&
    (!isCountryAdd || (form.country.trim() && form.country.length <= 150 && form.profileId &&
      initialSkills.length >= 1 && initialSkills.length <= 50 && initialSkills.every((skill) => skill.length <= 255))) &&
    (!isTransfer || (form.profileId && Number(form.profileId) !== Number(row.profileId))) &&
    (!isSkill || form.skill?.trim()) &&
    (!isProfile || (form.taskOrderName?.trim() && form.region?.trim() &&
      (action.type !== 'profileAdd' || form.taskOrderCode?.trim()))) &&
    (action.type !== 'skillAdd' || form.country);
  const submit = () => {
    if (!canReview) return;
    const common = { reason: form.reason.trim(), businessEffectiveDate: form.businessEffectiveDate || null };
    let payload;
    if (isCountryAdd) payload = { ...common, country: form.country.trim(), profileId: Number(form.profileId), skills: initialSkills };
    else if (isTransfer) payload = { ...common, country: row.country, profileId: Number(form.profileId),
      expectedProfileId: row.profileId ?? null };
    else if (isSkill) payload = { ...common, country: form.country, skill: form.skill.trim(),
      status: form.status, expectedUpdatedAt: row.updated_at || null };
    else payload = { ...common, taskOrderCode: form.taskOrderCode.trim(), taskOrderName: form.taskOrderName.trim(),
      region: form.region.trim(), description: form.description.trim(), isActive: form.isActive,
      expectedName: action.type === 'profileEdit' ? row.task_order_name : undefined };
    onSave(action, payload);
  };
  return (
    <div className="fixed inset-0 z-[100] flex justify-center items-center bg-slate-950/45 p-3 sm:p-6" onMouseDown={(e) => {
      if (e.target === e.currentTarget && !saving) onClose();
    }}>
      <div className="w-full max-w-lg max-h-[94dvh] overflow-y-auto rounded-2xl border border-slate-200 bg-white shadow-2xl" role="dialog" aria-modal="true" aria-labelledby="task-order-dialog-heading">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-100 bg-white px-5 py-4">
          <div><h2 id="task-order-dialog-heading" className="text-base font-extrabold text-[#052d51]">{LABELS[action.type]}</h2>
            <p className="text-[11px] text-slate-500">Changes are validated and recorded in Change History.</p></div>
          <button type="button" onClick={onClose} disabled={saving} aria-label="Close dialog" className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"><X size={18}/></button>
        </div>
        <div className="space-y-4 p-5">
          {isCountryAdd && <>
            <div><label className={label} htmlFor="new-country-name">Country name *</label>
              <input id="new-country-name" className={field} maxLength={150} autoComplete="off"
                value={form.country} onChange={(e) => change('country', e.target.value)}
                placeholder="e.g. Armenia" />
              <p className="mt-1 text-[10px] text-slate-500">Use a recognized country name. Existing countries and aliases cannot be added twice.</p>
            </div>
            <div><label className={label} htmlFor="new-country-profile">Assign to Task Order *</label>
              <select id="new-country-profile" className={field} value={form.profileId} onChange={(e) => change('profileId', e.target.value)}>
                <option value="">Select active Task Order</option>
                {activeProfiles.map((p) => <option key={p.id} value={p.id}>{p.task_order_name}</option>)}
              </select>
            </div>
            <div><label className={label} htmlFor="new-country-skills">Initial raw Skill names * (one per line)</label>
              <textarea id="new-country-skills" className={`${field} min-h-28 py-2 font-mono text-[11px]`} maxLength={13000}
                value={form.skillsText} onChange={(e) => change('skillsText', e.target.value)}
                placeholder={'GSS 2.0 :: Armenia - English IV\nGSS 2.0 :: Armenia - English NIV'} />
              <p className="mt-1 text-[10px] text-slate-500">{initialSkills.length}/50 Skills. Each raw Skill must identify the new country and must be unique.</p>
            </div>
            <p className="rounded-lg bg-blue-50 px-3 py-2 text-xs text-blue-800">The country and all initial Skills are saved together. Future source imports will use the country for dynamic Task Order reporting.</p>
          </>}
          {isTransfer && <>
            <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
              <p className="text-[11px] text-slate-500">Country</p><p className="text-sm font-bold">{row.country}</p>
              <p className="mt-2 text-[11px] text-slate-500">Current Task Order</p>
              <p className="text-sm font-semibold">{current?.task_order_name || 'Unmapped / conflicting ownership'}</p>
              <p className="mt-2 text-[11px] text-slate-500">{row.activeSkills} active Skills will transfer together.</p>
            </div>
            <div><label className={label} htmlFor="transfer-profile">Transfer to *</label>
              <select id="transfer-profile" className={field} value={form.profileId} onChange={(e) => change('profileId', e.target.value)}>
                <option value="">Select active Task Order</option>
                {activeProfiles.filter((p) => Number(p.id) !== Number(row.profileId)).map((p) => <option key={p.id} value={p.id}>{p.task_order_name}</option>)}
              </select></div>
          </>}
          {isSkill && <>
            <div><label className={label} htmlFor="skill-country">Country</label>
              {action.type === 'skillAdd' ? <select id="skill-country" className={field} value={form.country} onChange={(e) => change('country', e.target.value)}>
                {countries.filter((c) => c.status === 'ACTIVE').map((c) => <option key={c.key} value={c.country}>{c.country} — {c.taskOrder}</option>)}
              </select> : <input id="skill-country" className={`${field} bg-slate-50`} readOnly value={row.country || ''}/>}</div>
            <div><label className={label} htmlFor="skill-name">Raw Skill name *</label><input id="skill-name" className={field} maxLength={255} value={form.skill} onChange={(e) => change('skill', e.target.value)} placeholder="e.g. GSS 2.0 :: Israel - English IV"/></div>
            {action.type === 'skillEdit' && <div><label className={label} htmlFor="skill-status">Status</label>
              <select id="skill-status" className={field} value={form.status} onChange={(e) => change('status', e.target.value)}>
                <option value="ACTIVE">Active</option><option value="INACTIVE">Inactive</option>
              </select></div>}
            <p className="rounded-lg bg-blue-50 px-3 py-2 text-xs text-blue-800">Skill records inherit the country's Task Order. Task Order cannot be edited per Skill.</p>
          </>}
          {isProfile && <>
            {action.type === 'profileAdd' && <div><label className={label} htmlFor="profile-code">Task Order code *</label>
              <input id="profile-code" className={field} maxLength={100} value={form.taskOrderCode} onChange={(e) => change('taskOrderCode', e.target.value)} placeholder="GSS_2.0_TO18_REGION"/></div>}
            {action.type === 'profileEdit' && <div><label className={label}>Immutable code</label><div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs">{row.task_order_code}</div></div>}
            <div><label className={label} htmlFor="profile-name">Task Order name *</label><input id="profile-name" className={field} maxLength={150} value={form.taskOrderName} onChange={(e) => change('taskOrderName', e.target.value)} placeholder="GSS 2.0 TO12 - NICE"/></div>
            <div><label className={label} htmlFor="profile-region">Region *</label><input id="profile-region" className={field} maxLength={100} value={form.region} onChange={(e) => change('region', e.target.value)} placeholder="NICE"/></div>
            <div><label className={label} htmlFor="profile-description">Description</label><textarea id="profile-description" className={`${field} min-h-20 py-2`} maxLength={1000} value={form.description} onChange={(e) => change('description', e.target.value)}/></div>
            {action.type === 'profileEdit' && <label className="flex cursor-pointer items-center gap-2 text-xs font-semibold text-slate-700">
              <input type="checkbox" checked={form.isActive} onChange={(e) => change('isActive', e.target.checked)}/> Active Task Order
            </label>}
            <p className="text-[11px] text-slate-500">Codes cannot be renamed after creation. A profile with active Skill assignments cannot be deactivated.</p>
          </>}
          <div><label className={label} htmlFor="change-reason">Reason for change *</label>
            <textarea id="change-reason" className={`${field} min-h-[76px] py-2`} maxLength={1000} value={form.reason} onChange={(e) => change('reason', e.target.value)} placeholder="Required for audit history (minimum 5 characters)"/>
            <p className="mt-1 text-[10px] text-slate-400">{form.reason.length}/1000 characters</p>
          </div>
          <div><label className={label} htmlFor="business-date">Business effective date (optional, audit reference only)</label>
            <input id="business-date" type="date" className={field} value={form.businessEffectiveDate} onChange={(e) => change('businessEffectiveDate', e.target.value)}/>
          </div>
          {isTransfer && <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-3 text-xs text-amber-900">
            <AlertTriangle size={17} className="shrink-0"/><p>Country-based historical reports will use the new ownership immediately. Imported records and KPI formulas stay unchanged.</p>
          </div>}
          {reviewing && <div className="space-y-2 rounded-xl border border-blue-200 bg-blue-50 p-3 text-xs text-slate-700">
            <div className="flex items-center gap-2 font-bold text-[#052d51]"><CheckCircle2 size={15}/> Review before saving</div>
            {isCountryAdd ? <div><p><strong>{form.country}</strong> → {selected?.task_order_name} ({initialSkills.length} initial Skills)</p><ul className="mt-1 max-h-32 list-inside list-disc overflow-y-auto">{initialSkills.map((skill, index) => <li key={index}>{skill}</li>)}</ul></div> : isTransfer ? <p>{row.country}: {current?.task_order_name || 'Unmapped'} <ArrowRight size={13} className="inline"/> {selected?.task_order_name} — {row.activeSkills} active Skills</p> :
              <p>{isSkill ? form.skill : form.taskOrderName} {action.type === 'skillEdit' ? `(${form.status})` : ''}</p>}
            <p>Reason: {form.reason}</p>
            <p>Effective date: {form.businessEffectiveDate || 'Not specified (current mapping applies immediately)'}</p>
          </div>}
          {error && <p role="alert" className="rounded-lg bg-rose-50 p-3 text-xs font-semibold text-rose-700">{error}</p>}
        </div>
        <div className="sticky bottom-0 flex items-center justify-end gap-2 border-t border-slate-100 bg-white px-5 py-4">
          <button type="button" onClick={reviewing ? () => setReviewing(false) : onClose} disabled={saving} className="rounded-lg border border-slate-200 px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-50">{reviewing ? 'Back' : 'Cancel'}</button>
          {!reviewing ? <button type="button" disabled={!canReview || saving} onClick={() => setReviewing(true)} className="rounded-lg bg-[#063b68] px-4 py-2.5 text-xs font-bold text-white disabled:cursor-not-allowed disabled:opacity-40">Review Changes</button>
            : <button type="button" disabled={!canReview || saving} onClick={submit} className="flex items-center gap-2 rounded-lg bg-[#063b68] px-4 py-2.5 text-xs font-bold text-white disabled:opacity-40">
              {saving && <Loader2 size={14} className="animate-spin"/>} Confirm & Save</button>}
        </div>
      </div>
    </div>
  );
}
