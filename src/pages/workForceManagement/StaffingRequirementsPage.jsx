// Client-approved daily Required HC, one target per Task Order. No schedule or
// attendance records are edited here; scheduled Actual HC comes from Kronos.
import { useCallback, useEffect, useMemo, useState } from 'react';
import { CalendarDays, ChevronLeft, ChevronRight, ClipboardList, History, Loader2, RefreshCw, Save, Users } from 'lucide-react';
import AdminSidebar from '@/components/common/layout/AdminSidebar';
import AppHeader from '@/components/common/layout/AppHeader';
import ConfirmationModal from '@/components/common/ui/ConfirmationModal';
import LoadingModal from '@/components/common/ui/LoadingModal';
import useDashboardPage from '@/hooks/useDashboardPage';
import { PERMISSIONS } from '@/config/accessControl';

import { getStaffingRequirements, getStaffingRequirementHistory, getStaffingDailyCoverage, saveStaffingRequirements, getStaffingTaskOrders } from '@/lib/axios/staffing-requirements';

const weekdays = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
const dateOf = value => new Date(`${value}T00:00:00Z`);
const isoDate = date => date.toISOString().slice(0, 10);
const shift = (date, days) => isoDate(new Date(dateOf(date).getTime() + days * 86400000));
const todayManila = () => {
  const parts = new Intl.DateTimeFormat('en-US', { timeZone: 'Asia/Manila', year: 'numeric', month: '2-digit', day: '2-digit' })
    .formatToParts(new Date());
  const vals = Object.fromEntries(parts.map(item => [item.type, item.value]));
  return `${vals.year}-${vals.month}-${vals.day}`;
};
const thisMonth = () => `${todayManila().slice(0, 7)}-01`;
const changeMonth = (month, amount) => isoDate(new Date(Date.UTC(dateOf(month).getUTCFullYear(), dateOf(month).getUTCMonth() + amount, 1)));
function daysInMonth(month) {
  const year = dateOf(month).getUTCFullYear();
  const number = dateOf(month).getUTCMonth();
  const first = isoDate(new Date(Date.UTC(year, number, 1)));
  const last = isoDate(new Date(Date.UTC(year, number + 1, 0)));
  const weekStart = shift(first, -dateOf(first).getUTCDay());
  const total = Math.ceil((dateOf(last).getUTCDate() + dateOf(first).getUTCDay()) / 7) * 7;
  return { first, last, dates: Array.from({ length: total }, (_, index) => shift(weekStart, index)) };
}
function datesBetween(start, end) {
  const days = Math.floor((dateOf(end) - dateOf(start)) / 86400000) + 1;
  if (!Number.isFinite(days) || days <= 0 || days > 93) throw new Error('Select a valid date range of up to 93 days.');
  return Array.from({ length: days }, (_, index) => shift(start, index));
}
function toOption(row) {
  const id = String(row.taskOrderId || '');
  const profileId = Number(row.profileId);
  if (!/^TO\d+$/.test(id) || !Number.isSafeInteger(profileId) || profileId <= 0) return null;
  // Display the authoritative profile name, not a hardcoded account label.
  const label = String(row.name || '').trim();
  return { value: id, label: label || `${id} · ${row.region || row.taskOrderCode}`, profileId };
}
const field = 'h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-sibs-primary-1 outline-none focus:border-[#2367ab] focus:ring-2 focus:ring-blue-100';
const button = 'inline-flex items-center justify-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-bold transition disabled:cursor-not-allowed disabled:opacity-50';

export default function StaffingRequirementsPage() {
  const dashboard = useDashboardPage();
  const canEdit = dashboard.hasPermission(PERMISSIONS.WFM_EDIT_STAFFING);
  const [taskOrders, setTaskOrders] = useState([]);
  const [taskOrderId, setTaskOrderId] = useState('');
  const [month, setMonth] = useState(thisMonth);
  const [selected, setSelected] = useState(todayManila);
  const [view, setView] = useState('month');
  const [records, setRecords] = useState([]);
  const [coverage, setCoverage] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [value, setValue] = useState('');
  const [status, setStatus] = useState('PUBLISHED');
  const [sourceReference, setSourceReference] = useState('');
  const [remarks, setRemarks] = useState('');
  const [reason, setReason] = useState('');
  const [rangeFrom, setRangeFrom] = useState(todayManila);
  const [rangeTo, setRangeTo] = useState(todayManila);
  const [bulkValue, setBulkValue] = useState('');
  const [reload, setReload] = useState(0);
  const calendar = useMemo(() => daysInMonth(month), [month]);
  const recordMap = useMemo(() => new Map(records.map(row => [row.requirementDate, row])), [records]);
  const coverageMap = useMemo(() => new Map((coverage?.days || []).map(row => [row.date, row])), [coverage]);

  useEffect(() => {
    let active = true;
    getStaffingTaskOrders().then(rows => {
      if (!active) return;
      const map = new Map();
      rows.map(toOption).filter(Boolean).forEach(item => { if (!map.has(item.value)) map.set(item.value, item); });
      const options = [...map.values()].sort((a, b) => Number(a.value.slice(2)) - Number(b.value.slice(2)));
      setTaskOrders(options);
      setTaskOrderId(previous => options.some(option => option.value === previous) ? previous : (options[0]?.value || ''));
      if (!options.length) setError('No active Task Order profiles were found in the Task Order Ledger Profiles.');
    }).catch(e => { if (active) setError(e?.response?.data?.message || e.message); });
    return () => { active = false; };
  }, [reload]);

  useEffect(() => {
    if (!taskOrderId) return undefined;
    let active = true;
    setLoading(true); setError('');
    const filters = { taskOrderId, dateFrom: shift(calendar.first, -14), dateTo: calendar.dates[calendar.dates.length - 1] };
    Promise.all([
      getStaffingRequirements(filters),
      getStaffingRequirementHistory(filters),
    ]).then(([rows, changes]) => {
      if (!active) return;
      setRecords(rows); setHistory(changes);
    }).catch(e => { if (active) setError(e?.response?.data?.message || e.message); })
      .finally(() => { if (active) setLoading(false); });
    // Schedule-only query has a separate failure state: users can still edit
    // requirements even when Kronos is offline.
    getStaffingDailyCoverage({ taskOrderId, dateFrom: calendar.dates[0], dateTo: calendar.dates[calendar.dates.length - 1] })
      .then(data => { if (active) setCoverage(data); })
      .catch(() => { if (active) setCoverage({ days: [], scheduleError: 'Scheduled headcount is temporarily unavailable.' }); });
    return () => { active = false; };
  }, [taskOrderId, calendar, reload]);

  useEffect(() => {
    const row = recordMap.get(selected);
    setValue(row ? String(row.requiredHeadcount) : '');
    setStatus(row?.status || 'PUBLISHED');
    setSourceReference(row?.sourceReference || '');
    setRemarks(row?.remarks || '');
    setReason('');
  }, [selected, recordMap]);

  const executeSave = useCallback(async (entries, changeReason) => {
    if (!canEdit || saving) return;
    setSaving(true); setError(''); setNotice('');
    try {
      const result = await saveStaffingRequirements(entries, changeReason);
      setNotice(`Saved ${result.count} daily requirement${result.count === 1 ? '' : 's'} successfully.`);
      setReload(v => v + 1);
    } catch (e) { setError(e?.response?.data?.message || e.message || 'Unable to save staffing requirements.'); }
    finally { setSaving(false); }
  }, [canEdit, saving]);

  const saveDay = () => {
    if (value === '' || !/^\d+$/.test(value) || Number(value) > 100000) {
      setError('Enter a whole-number Required HC from 0 to 100,000.'); return;
    }
    void executeSave([{ taskOrderId, requirementDate: selected, requiredHeadcount: Number(value), status, sourceReference, remarks }], reason);
  };
  const applyRange = () => {
    try {
      const dates = datesBetween(rangeFrom, rangeTo);
      if (bulkValue === '' || !/^\d+$/.test(bulkValue) || Number(bulkValue) > 100000) throw new Error('Enter a valid nonnegative headcount.');
      if (!window.confirm(`Publish ${bulkValue} Required HC for ${taskOrderId} across ${dates.length} dates? Existing targets will be updated.`)) return;
      void executeSave(dates.map(requirementDate => ({ taskOrderId, requirementDate, requiredHeadcount: Number(bulkValue), status: 'PUBLISHED' })), `Bulk set: ${reason || 'Client staffing requirement'}`);
    } catch (e) { setError(e.message); }
  };
  const copyPreviousWeek = () => {
    const sunday = shift(selected, -dateOf(selected).getUTCDay());
    const current = Array.from({ length: 7 }, (_, index) => shift(sunday, index));
    const past = current.map(date => shift(date, -7));
    if (past.some(date => !recordMap.has(date))) { setError('Previous week is incomplete; enter the missing daily targets first.'); return; }
    if (!window.confirm(`Copy seven previous-week targets into ${current[0]} – ${current[6]}?`)) return;
    void executeSave(current.map((requirementDate, index) => {
      const source = recordMap.get(past[index]);
      return { taskOrderId, requirementDate, requiredHeadcount: Number(source.requiredHeadcount), status: source.status };
    }), 'Copied previous week');
  };
  const visibleDates = useMemo(() => view === 'month' ? calendar.dates : (() => {
    const sunday = shift(selected, -dateOf(selected).getUTCDay());
    return Array.from({ length: 7 }, (_, index) => shift(sunday, index));
  })(), [view, calendar, selected]);
  const publishedDays = calendar.dates.filter(date => date.slice(0, 7) === month.slice(0, 7) && recordMap.get(date)?.status === 'PUBLISHED').length;
  const monthTitle = dateOf(month).toLocaleDateString('en-US', { month: 'long', year: 'numeric', timeZone: 'UTC' });
  const selectedDay = coverageMap.get(selected);

  return (
    <section className="font-jakarta flex h-screen max-h-[100dvh] min-h-screen overflow-hidden bg-[#eef3f7] text-sibs-primary-1">
      <AdminSidebar isMobileOpen={dashboard.isMobileSidebarOpen} modules={dashboard.modules}
        onLogoutClick={() => dashboard.setShowLogoutModal(true)} onMobileClose={() => dashboard.setIsMobileSidebarOpen(false)}
        userName={dashboard.userName} userRole={dashboard.authUser?.roleLabel || 'Workforce Management'} />
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <AppHeader title="Staffing Requirements" subtitle="Workforce Management · Daily Client-Required Headcount"
          onMenuClick={() => dashboard.setIsMobileSidebarOpen(true)} />
        <main className="min-h-0 flex-1 overflow-auto px-3 pb-6 pt-3 sm:px-5">
          <div className="mx-auto flex max-w-[1500px] flex-col gap-3">
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-3 shadow-xs">
              <div className="flex items-center gap-2"><CalendarDays className="h-5 w-5 text-[#0b3b68]" /><div>
                <h1 className="text-sm font-black">Staffing Requirements Calendar</h1>
                <p className="text-[11px] text-slate-500">One client-required headcount per Task Order and date · Sunday–Saturday</p>
              </div></div>
              <div className="flex flex-wrap items-center gap-2">
                <label className="text-[11px] font-bold text-slate-600" htmlFor="staffing-to">Task Order</label>
                <select id="staffing-to" className={`${field} min-w-[200px]`} value={taskOrderId}
                  onChange={event => setTaskOrderId(event.target.value)} disabled={!taskOrders.length}>
                  {!taskOrders.length && <option value="">No Task Orders</option>}
                  {taskOrders.map(row => <option key={row.value} value={row.value}>{row.label}</option>)}
                </select>
                <button type="button" className={`${button} border-slate-200 bg-white hover:bg-slate-50`} aria-label="Refresh" onClick={() => setReload(v => v + 1)}><RefreshCw size={14} /></button>
              </div>
            </div>

            {(error || notice) && <div role="status" className={`rounded-lg border px-3 py-2 text-xs font-semibold ${error ? 'border-rose-200 bg-rose-50 text-rose-700' : 'border-emerald-200 bg-emerald-50 text-emerald-700'}`}>{error || notice}</div>}
            <div className="grid grid-cols-1 gap-3 xl:grid-cols-[minmax(0,1fr)_330px]">
              <div className="min-w-0 rounded-xl border border-slate-200 bg-white p-3 shadow-xs">
                <div className="flex flex-wrap items-center justify-between gap-3 pb-3">
                  <div><h2 className="text-base font-black">{monthTitle}</h2>
                    <p className="text-[11px] text-slate-500">{publishedDays} dates with published requirements</p></div>
                  <div className="flex items-center gap-2">
                    <div className="flex rounded-lg bg-slate-100 p-0.5 text-xs font-bold">
                      {['month', 'week'].map(item => <button type="button" key={item} onClick={() => setView(item)}
                        className={`rounded-md px-3 py-1.5 capitalize ${view === item ? 'bg-white text-[#0b3b68] shadow-xs' : 'text-slate-500'}`}>{item}</button>)}
                    </div>
                    <button className={`${button} border-slate-200`} type="button" onClick={() => { setMonth(changeMonth(month, -1)); setSelected(changeMonth(month, -1)); }} aria-label="Previous month"><ChevronLeft size={15}/></button>
                    <button className={`${button} border-slate-200`} type="button" onClick={() => { setMonth(changeMonth(month, 1)); setSelected(changeMonth(month, 1)); }} aria-label="Next month"><ChevronRight size={15}/></button>
                  </div>
                </div>
                <div className="grid grid-cols-7 gap-1.5 border-b border-slate-100 pb-1.5">
                  {weekdays.map(day => <div className="text-center text-[10px] font-black tracking-wider text-slate-500" key={day}>{day}</div>)}
                </div>
                <div className="mt-1.5 grid grid-cols-7 gap-1.5">
                  {visibleDates.map(date => {
                    const row = recordMap.get(date);
                    const actual = coverageMap.get(date);
                    const isCurrentMonth = date.slice(0, 7) === month.slice(0, 7);
                    const isSelected = selected === date;
                    return <button type="button" key={date} onClick={() => { setSelected(date); if (!isCurrentMonth) setMonth(`${date.slice(0,7)}-01`); }}
                      className={`min-h-[86px] rounded-lg border p-1.5 text-left transition sm:p-2 ${isSelected ? 'border-[#0b3b68] bg-blue-50 ring-1 ring-[#0b3b68]' : 'border-slate-200 hover:border-blue-300 hover:bg-blue-50/50'} ${isCurrentMonth ? '' : 'opacity-45'}`}>
                      <div className="flex items-center justify-between gap-1"><span className="text-[11px] font-extrabold">{dateOf(date).getUTCDate()}</span>{date === todayManila() && <span className="h-1.5 w-1.5 rounded-full bg-[#ff622d]"/>}</div>
                      <div className="mt-2 text-[10px] font-bold text-[#0b3b68]">{row ? `${row.requiredHeadcount} Required` : '—'}</div>
                      <div className="mt-0.5 text-[9px] text-slate-500">{actual?.actualHeadcount != null ? `${actual.actualHeadcount} Scheduled` : '— Scheduled'}</div>
                      {row?.status === 'DRAFT' && <span className="mt-1 inline-block rounded bg-amber-100 px-1 text-[8px] font-bold text-amber-800">Draft</span>}
                    </button>;
                  })}
                </div>
                <p className="mt-2 text-[10px] text-slate-500">Actual HC includes active agents scheduled to work, whether present or absent. Missing targets display —, not 0.</p>
              </div>
              <div className="space-y-3">
                <section className="rounded-xl border border-slate-200 bg-white p-3 shadow-xs">
                  <h3 className="flex items-center gap-2 border-b pb-2 text-xs font-black"><ClipboardList size={15} /> Daily Requirement · {selected}</h3>
                  <div className="grid grid-cols-2 gap-2 py-3">
                    <div className="rounded-lg bg-slate-50 p-2"><p className="text-[10px] text-slate-500">Required HC</p><p className="text-lg font-black">{recordMap.get(selected)?.status === 'PUBLISHED' ? recordMap.get(selected).requiredHeadcount : '—'}</p></div>
                    <div className="rounded-lg bg-slate-50 p-2"><p className="text-[10px] text-slate-500">Scheduled HC</p><p className="text-lg font-black">{selectedDay?.actualHeadcount ?? '—'}</p></div>
                  </div>
                  {coverage?.scheduleError && <p className="mb-2 text-[10px] text-amber-700">{coverage.scheduleError}</p>}
                  {canEdit ? <div className="space-y-2">
                    <label className="block text-[11px] font-bold">Client Required Headcount<input type="number" min="0" max="100000" step="1" className={`${field} mt-1`} value={value} onChange={e => setValue(e.target.value)} placeholder="Enter required HC" /></label>
                    <label className="block text-[11px] font-bold">Status<select className={`${field} mt-1`} value={status} onChange={e => setStatus(e.target.value)}><option value="PUBLISHED">Published</option><option value="DRAFT">Draft</option></select></label>
                    <label className="block text-[11px] font-bold">Client Reference (optional)<input className={`${field} mt-1`} maxLength={191} value={sourceReference} onChange={e => setSourceReference(e.target.value)} placeholder="Client request / email reference" /></label>
                    <label className="block text-[11px] font-bold">Remarks (optional)<textarea rows={2} maxLength={1000} className={`${field} mt-1 h-auto py-2`} value={remarks} onChange={e => setRemarks(e.target.value)} /></label>
                    <label className="block text-[11px] font-bold">Change Reason (optional)<input className={`${field} mt-1`} maxLength={500} value={reason} onChange={e => setReason(e.target.value)} /></label>
                    <button type="button" disabled={saving || loading || !taskOrderId} className={`${button} w-full border-[#0b3b68] bg-[#0b3b68] text-white hover:bg-[#15558a]`} onClick={saveDay}>{saving ? <Loader2 size={14} className="animate-spin"/> : <Save size={14}/>} Save Daily Requirement</button>
                  </div> : <p className="text-[11px] text-slate-500">Read-only view. WFM users manage client staffing targets.</p>}
                </section>
                {canEdit && <section className="rounded-xl border border-slate-200 bg-white p-3 shadow-xs">
                  <h3 className="mb-2 text-xs font-black">Bulk Date-Range Entry</h3>
                  <div className="grid grid-cols-2 gap-2">
                    <label className="text-[10px] font-bold">Date From<input type="date" className={`${field} mt-1`} value={rangeFrom} onChange={e => setRangeFrom(e.target.value)} /></label>
                    <label className="text-[10px] font-bold">Date To<input type="date" className={`${field} mt-1`} value={rangeTo} onChange={e => setRangeTo(e.target.value)} /></label>
                  </div>
                  <label className="mt-2 block text-[10px] font-bold">Required HC<input type="number" min="0" max="100000" className={`${field} mt-1`} value={bulkValue} onChange={e => setBulkValue(e.target.value)} /></label>
                  <button type="button" disabled={saving || !taskOrderId} onClick={applyRange} className={`${button} mt-2 w-full border-slate-200 bg-slate-50 hover:bg-slate-100`}>Apply to Date Range</button>
                  <button type="button" disabled={saving || !taskOrderId} onClick={copyPreviousWeek} className={`${button} mt-2 w-full border-slate-200 bg-white hover:bg-slate-50`}>Copy Previous Week</button>
                </section>}
              </div>
            </div>
            <section className="rounded-xl border border-slate-200 bg-white p-3 shadow-xs">
              <h3 className="mb-2 flex items-center gap-1.5 text-xs font-black"><History size={15}/> Recent Requirement Changes</h3>
              <div className="overflow-x-auto"><table className="w-full text-left text-[11px]"><thead className="border-b bg-slate-50 text-slate-600"><tr>{['Date', 'Previous', 'Updated', 'Status', 'Edited By', 'Reason'].map(label => <th key={label} className="px-2 py-2 font-black">{label}</th>)}</tr></thead>
              <tbody>{history.slice(0, 15).map(item => <tr key={item.id} className="border-b border-slate-100"><td className="px-2 py-2">{item.requirementDate}</td><td className="px-2 py-2">{item.oldRequiredHeadcount ?? '—'}</td><td className="px-2 py-2 font-bold">{item.newRequiredHeadcount}</td><td className="px-2 py-2">{item.newStatus}</td><td className="px-2 py-2">{item.changedBy}</td><td className="px-2 py-2">{item.changeReason || '—'}</td></tr>)}
              {!history.length && <tr><td colSpan={6} className="px-3 py-5 text-center text-slate-400">No changes recorded for this date range.</td></tr>}</tbody></table></div>
            </section>
          </div>
        </main>
      </div>
      <ConfirmationModal isOpen={dashboard.showLogoutModal} title="Log out?" message="You will be signed out of SiBS PMS." onCancel={() => dashboard.setShowLogoutModal(false)} onConfirm={dashboard.handleLogout} />
      <LoadingModal isOpen={dashboard.isLoggingOut} message="Signing out..." />
    </section>
  );
}
