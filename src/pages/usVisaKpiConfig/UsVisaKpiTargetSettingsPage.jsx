// Admin-only US Visa Calls and Chat numeric KPI targets.
import { useCallback, useEffect, useMemo, useState } from 'react';
import { AlertCircle, ArrowRight, BarChart3, Calendar, CheckCircle2, History, Info, Loader2, Pencil, Search, Target, X } from 'lucide-react';
import AdminSidebar from '@/components/common/layout/AdminSidebar';
import AppHeader from '@/components/common/layout/AppHeader';
import ConfirmationModal from '@/components/common/ui/ConfirmationModal';
import LoadingModal from '@/components/common/ui/LoadingModal';
import useDashboardPage from '@/hooks/useDashboardPage';
import { fetchTaskOrderManagement } from '@/lib/axios/task-order-ledger';
import { fetchUsVisaKpiTargetSettings, fetchUsVisaKpiTargetHistory, saveUsVisaKpiTarget } from '@/lib/axios/us-visa-kpi-targets';

const inputStyle = 'min-h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-800 outline-none focus:border-[#0b3b68] focus:ring-2 focus:ring-blue-100';
const buttonStyle = 'inline-flex min-h-9 items-center justify-center gap-1.5 rounded-lg px-3 text-xs font-bold transition disabled:cursor-not-allowed disabled:opacity-50';
function manilaToday() {
  const parts = new Intl.DateTimeFormat('en-US', { timeZone: 'Asia/Manila', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(new Date());
  const get = (type) => parts.find((p) => p.type === type)?.value;
  return `${get('year')}-${get('month')}-${get('day')}`;
}
function displayTarget(metric) {
  const operator = metric.operator === 'GTE' ? '≥ ' : metric.operator === 'LTE' ? '≤ ' : '= ';
  return `${operator}${Number(metric.targetValue).toLocaleString(undefined, { maximumFractionDigits: 4 })}${metric.unit === 'PERCENT' ? '%' : ' sec'}`;
}
function getMessage(error) { return error?.response?.data?.message || error?.message || 'Unable to complete request.'; }

export default function UsVisaKpiTargetSettingsPage() {
  const dashboard = useDashboardPage();
  const [category, setCategory] = useState('CALLS');
  const [sourceSystem, setSourceSystem] = useState('');
  const [taskOrder, setTaskOrder] = useState('');
  const [taskOrders, setTaskOrders] = useState([]);
  const [search, setSearch] = useState('');
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [edit, setEdit] = useState(null);
  const [newValue, setNewValue] = useState('');
  const [effectiveFrom, setEffectiveFrom] = useState(manilaToday);
  const [reason, setReason] = useState('');
  const [saving, setSaving] = useState(false);
  const [history, setHistory] = useState(null);
  const [historyLoading, setHistoryLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const result = await fetchUsVisaKpiTargetSettings({ category, sourceSystem, taskOrder });
      if (!result?.success) throw new Error(result?.message || 'Unable to load KPI targets.');
      setSettings(result.data);
    } catch (err) { setSettings(null); setError(getMessage(err)); }
    finally { setLoading(false); }
  }, [category, sourceSystem, taskOrder]);
  useEffect(() => { void load(); }, [load]);
  useEffect(() => {
    let active = true;
    fetchTaskOrderManagement().then((response) => {
      if (active && response?.success) {
        const profiles = response.data?.profiles || [];
        const codes = [...new Set(profiles.map((profile) => String(profile.task_order_code || '').toUpperCase().replace(/\s+/g, '')).filter((code) => /^TO\d+$/.test(code)))];
        setTaskOrders(codes.sort((a, b) => Number(a.slice(2)) - Number(b.slice(2))));
      }
    }).catch(() => {});
    return () => { active = false; };
  }, []);
  const metrics = useMemo(() => (settings?.metrics || []).filter((metric) => `${metric.name} ${metric.code}`.toLowerCase().includes(search.trim().toLowerCase())), [settings, search]);
  function openEdit(metric) {
    setEdit(metric); setNewValue(String(metric.targetValue)); setEffectiveFrom(manilaToday());
    setReason(''); setError(''); setNotice('');
  }
  async function submit(event) {
    event.preventDefault();
    if (!edit) return;
    const value = Number(newValue);
    if (!newValue.trim() || !Number.isFinite(value) || value <= 0 || (edit.unit === 'PERCENT' && value > 100) || value > 1000000) {
      setError('Enter a valid positive number. Percentages must be at most 100.'); return;
    }
    if (effectiveFrom < manilaToday()) { setError('The effective date cannot be in the past.'); return; }
    setSaving(true); setError('');
    try {
      await saveUsVisaKpiTarget({
        kpiCode: edit.code, value, effectiveFrom, sourceSystem: sourceSystem || null,
        taskOrder: taskOrder || null, reason: reason.trim(), expectedCurrentId: edit.scopeLatestRecordId,
      });
      setEdit(null); setNotice(`${edit.name} target saved. Reports will apply it from ${effectiveFrom}.`);
      await load();
    } catch (err) { setError(getMessage(err)); }
    finally { setSaving(false); }
  }
  async function viewHistory(metric) {
    setHistory({ metric, rows: [] }); setHistoryLoading(true); setError('');
    try {
      const result = await fetchUsVisaKpiTargetHistory({ kpiCode: metric.code, sourceSystem, taskOrder });
      setHistory({ metric, rows: result?.data?.rows || [] });
    } catch (err) { setHistory(null); setError(getMessage(err)); }
    finally { setHistoryLoading(false); }
  }
  return <section className="font-jakarta flex min-h-screen h-screen max-h-[100dvh] overflow-hidden bg-[#eef3f7] text-sibs-primary-1">
    <AdminSidebar isMobileOpen={dashboard.isMobileSidebarOpen} modules={dashboard.modules}
      onLogoutClick={() => dashboard.setShowLogoutModal(true)} onMobileClose={() => dashboard.setIsMobileSidebarOpen(false)}
      userName={dashboard.userName} userRole={dashboard.authUser?.email || dashboard.authUser?.roleLabel || 'Administrator'} />
    <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
      <AppHeader title="US Visa KPI Configuration" subtitle="Editable performance targets · Calls & Chat" userName={dashboard.userName}
        onMenuClick={() => dashboard.setIsMobileSidebarOpen(true)} onLogoutClick={() => dashboard.setShowLogoutModal(true)} />
      <main className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto lg:overflow-hidden p-3 sm:p-4">
        <div className="shrink-0 rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
          <div className="flex flex-wrap items-end gap-3">
            <div className="shrink-0 text-[11px] font-semibold text-slate-600">
              <span className="block mb-1">Category</span>
              <div className="inline-flex rounded-lg bg-slate-100 p-0.5 border border-slate-200/80">
                {['CALLS','CHAT'].map((type) => <button key={type} type="button" onClick={() => { setCategory(type); setHistory(null); setEdit(null); }}
                  className={`h-8 rounded-md px-3.5 text-xs font-bold transition cursor-pointer ${category === type ? 'bg-[#052e53] text-white shadow-2xs' : 'text-slate-600 hover:text-slate-900'}`}>{type === 'CALLS' ? 'Calls' : 'Chat'}</button>)}
              </div>
            </div>
            <label className="flex-1 min-w-[220px] text-[11px] font-semibold text-slate-600">Search KPI
              <div className="relative mt-1"><Search size={14} className="absolute left-3 top-3 text-slate-400"/>
                <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search metric or KPI code..." className={`${inputStyle} pl-9`}/></div></label>
            <label className="w-full sm:w-48 text-[11px] font-semibold text-slate-600">Source system
              <select value={sourceSystem} onChange={(event) => { setSourceSystem(event.target.value); setHistory(null); }} className={`${inputStyle} mt-1`}>
                <option value="">All sources (default)</option><option value="FUSENET">FuseNet</option><option value="FUSECOM">FuseCom</option><option value="HERODASH">HeroDash</option>
              </select></label>
            <label className="w-full sm:w-56 text-[11px] font-semibold text-slate-600">Task Order
              <select value={taskOrder} onChange={(event) => { setTaskOrder(event.target.value); setHistory(null); }} className={`${inputStyle} mt-1`}>
                <option value="">All Task Orders (default)</option>{taskOrders.map((code) => <option key={code} value={code}>{code}</option>)}
              </select></label>
          </div>
        </div>
        {notice && <div role="status" className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs font-semibold text-emerald-800"><CheckCircle2 size={15}/>{notice}</div>}
        {error && <div role="alert" className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-semibold text-red-800"><AlertCircle size={15}/>{error}</div>}
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs">
          {/* Navy Table Heading */}
          <div className="shrink-0 flex items-center justify-between bg-[#052e53] px-5 py-3 text-white">
            <div className="flex items-center gap-2">
              <BarChart3 size={16} className="text-white/90" />
              <h2 className="text-sm font-bold tracking-wide">KPI Metrics</h2>
            </div>
          </div>

          <div className="flex-1 min-h-0 overflow-auto">
            <table className="w-full min-w-[760px] table-fixed border-collapse text-left">
              <thead className="sticky top-0 z-10 bg-slate-50 border-b border-slate-200">
                <tr className="text-[11px] font-bold uppercase tracking-wide text-slate-500">
                  <th className="w-12 px-5 py-3">#</th>
                  <th className="w-[28%] px-5 py-3">KPI metric</th>
                  <th className="w-[18%] px-5 py-3">Performance target</th>
                  <th className="w-[16%] px-5 py-3">Effective from</th>
                  <th className="w-[18%] px-5 py-3">Applied scope</th>
                  <th className="w-[20%] px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>{loading ? <tr><td colSpan={6} className="p-8 text-center text-xs text-slate-500"><Loader2 className="mr-2 inline animate-spin" size={16}/>Loading targets...</td></tr> : metrics.length ? metrics.map((metric, idx) => <tr key={metric.code} className="border-b border-slate-100 hover:bg-slate-50/80 transition-colors">
                <td className="px-5 py-3.5 text-xs font-semibold tabular-nums text-slate-400">{idx + 1}</td>
                <td className="px-5 py-3.5"><div className="text-xs font-bold text-slate-900">{metric.name}</div><div className="mt-0.5 font-mono text-[10px] text-slate-400">{metric.code}</div></td>
                <td className="px-5 py-3.5"><span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-bold tabular-nums text-emerald-700 border border-emerald-200/70"><Target size={12} />{displayTarget(metric)}</span></td>
                <td className="px-5 py-3.5 text-xs tabular-nums text-slate-600"><span className="inline-flex items-center gap-1.5"><Calendar size={13} className="text-slate-400" />{metric.effectiveFrom || 'Legacy baseline'}</span></td>
                <td className="px-5 py-3.5"><span className="inline-flex items-center rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1 text-[10px] font-semibold text-slate-600">{metric.effectiveScope === 'LEGACY_DEFAULT' ? 'System default' : metric.effectiveScope}</span>
                  {metric.scheduled?.length > 0 && <div className="mt-1 text-[10px] text-amber-700">{metric.scheduled.length} scheduled update(s)</div>}</td>
                <td className="px-5 py-3.5"><div className="flex justify-end gap-2">
                  <button type="button" onClick={() => openEdit(metric)} className={`${buttonStyle} border border-slate-200 bg-white text-[#052e53] hover:bg-blue-50`}><Pencil size={13}/>Configure</button>
                  <button type="button" onClick={() => viewHistory(metric)} className={`${buttonStyle} border border-slate-200 bg-white text-slate-700 hover:bg-slate-50`}><History size={13}/>History</button>
                </div></td>
              </tr>) : <tr><td colSpan={6} className="p-8 text-center text-xs text-slate-500">No KPI targets found.</td></tr>}</tbody>
            </table>
          </div>

          {/* Information Note anchored at bottom of table container */}
          <div className="shrink-0 mt-auto border-t border-slate-100 bg-slate-50/70 px-5 py-3">
            <p className="flex items-center gap-2 text-xs text-slate-500">
              <Info size={14} className="shrink-0 text-[#052e53]/70" />
              <span>Updates are effective-dated and scoped. When no override exists, the system uses the applicable US Visa default. Existing operational KPI calculations remain unchanged.</span>
            </p>
          </div>
        </div>
      </main>
    </div>
    {edit && <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/50 p-3 backdrop-blur-[1px]" onMouseDown={(e) => { if (e.target === e.currentTarget && !saving) setEdit(null); }}>
      <form onSubmit={submit} className="w-full max-w-lg overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl" role="dialog" aria-modal="true" aria-label={`Configure ${edit.name}`}>
        <div className="flex items-center justify-between bg-[#052e53] px-5 py-4 text-white">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10">
              <Target size={16} className="text-white" />
            </div>
            <div>
              <h2 className="text-sm font-bold tracking-wide">Configure KPI Target</h2>
              <p className="text-[11px] text-slate-300">{edit.name}</p>
            </div>
          </div>
          <button type="button" aria-label="Close" disabled={saving} onClick={() => { setEdit(null); setError(''); }} className="rounded-lg p-1 text-slate-300 hover:bg-white/10 hover:text-white transition"><X size={18}/></button>
        </div>
        <div className="space-y-4 px-5 py-4">
          {error && <p role="alert" className="rounded-lg border border-red-200 bg-red-50 p-2.5 text-xs font-semibold text-red-700">{error}</p>}
          <div className="grid grid-cols-2 gap-3 rounded-xl border border-slate-200/80 bg-slate-50/70 p-3.5">
            <div>
              <div className="text-[10.5px] font-semibold uppercase tracking-wider text-slate-400">Current Target</div>
              <p className="mt-1 text-base font-extrabold tabular-nums text-[#052e53]">{displayTarget(edit)}</p>
            </div>
            <div>
              <div className="text-[10.5px] font-semibold uppercase tracking-wider text-slate-400">Comparison Rule</div>
              <p className="mt-1.5 text-xs font-bold text-slate-700">{edit.operator === 'GTE' ? 'Greater than or equal to (≥)' : 'Less than or equal to (≤)'}</p>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <label className="text-[11px] font-semibold text-slate-600">New target ({edit.unit === 'PERCENT' ? '%' : 'seconds'})
              <input type="number" required min="0.0001" max={edit.unit === 'PERCENT' ? 100 : 1000000} step="0.0001" value={newValue} onChange={(e) => setNewValue(e.target.value)} className={`${inputStyle} mt-1`}/></label>
            <label className="text-[11px] font-semibold text-slate-600">Effective from (Manila)
              <input type="date" required min={manilaToday()} value={effectiveFrom} onChange={(e) => setEffectiveFrom(e.target.value)} className={`${inputStyle} mt-1`}/></label>
          </div>
          <div className="flex items-start gap-2.5 rounded-xl border border-blue-100 bg-blue-50/40 p-3 text-xs text-slate-600">
            <Info size={15} className="mt-0.5 shrink-0 text-[#052e53]/70" />
            <div className="space-y-1 text-[11px] leading-relaxed">
              <p><strong className="text-slate-800">Scope:</strong> {sourceSystem || 'All sources'} / {taskOrder || 'All Task Orders'}</p>
              <p>Changing this number does not change its KPI formula or historical operational data. Earlier revisions on the same date stay in History.</p>
            </div>
          </div>
          <label className="block text-[11px] font-semibold text-slate-600">Reason (optional)
            <textarea rows={2} maxLength={1000} value={reason} onChange={(e) => setReason(e.target.value)} className={`${inputStyle} mt-1 resize-none py-2`} placeholder="Reason for target adjustment"/></label>
        </div>
        <div className="flex justify-end gap-2 border-t border-slate-100 bg-slate-50/50 px-5 py-3.5"><button type="button" disabled={saving} onClick={() => { setEdit(null); setError(''); }} className={`${buttonStyle} border border-slate-200 bg-white text-slate-600 hover:bg-slate-50`}>Cancel</button>
          <button type="submit" disabled={saving || !newValue.trim()} className={`${buttonStyle} bg-[#052e53] text-white hover:bg-[#0b3b68]`}>{saving ? <Loader2 size={15} className="animate-spin"/> : <CheckCircle2 size={15}/>}Save target</button></div>
      </form></div>}
    {history && <div className="fixed inset-0 z-[90] flex items-center justify-center bg-slate-950/50 p-3 backdrop-blur-[1px]" onMouseDown={(e) => { if (e.target === e.currentTarget) setHistory(null); }}>
      <div className="w-full max-w-xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl" role="dialog" aria-modal="true" aria-label="KPI target history">
        <div className="flex items-center justify-between bg-[#052e53] px-5 py-4 text-white">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10">
              <History size={16} className="text-white" />
            </div>
            <div>
              <h2 className="text-sm font-bold tracking-wide">Target History</h2>
              <p className="text-[11px] text-slate-300">{history.metric.name} · current selected scope</p>
            </div>
          </div>
          <button type="button" aria-label="Close history" onClick={() => setHistory(null)} className="rounded-lg p-1 text-slate-300 hover:bg-white/10 hover:text-white transition"><X size={18}/></button>
        </div>
        <div className="max-h-[60vh] overflow-auto bg-slate-50/40 p-5">{historyLoading ? <p className="text-xs text-slate-500">Loading history...</p> : history.rows.length ? <div className="space-y-2.5">{history.rows.map((row) => <div key={row.id} className="rounded-xl border border-slate-200/90 bg-white p-3.5 text-xs shadow-2xs">
          <div className="flex items-center justify-between gap-2">
            <strong className="text-sm font-extrabold tabular-nums text-[#052e53]">{row.target_value} {history.metric.unit === 'PERCENT' ? '%' : 'seconds'}</strong>
            <span className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 text-[11px] font-medium tabular-nums text-slate-600"><Calendar size={11} className="text-slate-400"/>Effective {String(row.effective_from).slice(0,10)}</span>
          </div>
          <div className="mt-1.5 text-[11px] text-slate-500">Revision {row.revision_number || 1} · By <span className="font-semibold text-slate-700">{row.created_by}</span> · {row.change_reason || 'No reason provided'}</div></div>)}</div> : <p className="text-xs text-slate-500">No explicit history for this scope. The global default may be inherited.</p>}</div>
        <div className="flex justify-end border-t border-slate-100 bg-slate-50/50 px-5 py-3.5"><button type="button" onClick={() => setHistory(null)} className={`${buttonStyle} bg-[#052e53] text-white hover:bg-[#0b3b68]`}>Close</button></div>
      </div></div>}
    <ConfirmationModal isOpen={dashboard.showLogoutModal} onCancel={() => dashboard.setShowLogoutModal(false)} onConfirm={dashboard.handleLogout} title="Log out" message="Do you want to log out?" confirmText="Log out"/>
    <LoadingModal isOpen={dashboard.isLoggingOut} message="Signing out..."/>
  </section>;
}
