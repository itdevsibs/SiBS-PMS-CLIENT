// Country-first Task Order management; ledger-backed options, audited transactions.
import { Fragment, useCallback, useEffect, useMemo, useState } from 'react';
import {
  AlertCircle, ArrowRightLeft, ChevronDown, ChevronRight, ClipboardList, History,
  Layers, Loader2, Pencil, Plus, RefreshCw, Search, ShieldCheck, X,
} from 'lucide-react';
import AdminSidebar from '@/components/common/layout/AdminSidebar';
import AppHeader from '@/components/common/layout/AppHeader';
import ConfirmationModal from '@/components/common/ui/ConfirmationModal';
import LoadingModal from '@/components/common/ui/LoadingModal';
import TablePagination from '@/components/common/tables/TablePagination';
import useDashboardPage from '@/hooks/useDashboardPage';
import { getUserAdminAccess } from '@/config/accessControl';
import { getAuthDisplayName } from '@/lib/auth';
import {
  fetchTaskOrderManagement, fetchTaskOrderHistory, transferTaskOrderCountry, createTaskOrderCountry,
  createTaskOrderSkill, updateTaskOrderSkill, createTaskOrderProfile,
  updateTaskOrderProfile,
} from '@/lib/axios/task-order-ledger';
import TaskOrderEditDialog from '../../components/modules/taskorder-ledger/TaskOrderEditDialog';

const TABS = [
  { key: 'countries', title: 'Country Assignments', Icon: Layers },
  { key: 'skills', title: 'Skills', Icon: ClipboardList },
  { key: 'profiles', title: 'Task Orders', Icon: ShieldCheck },
  { key: 'history', title: 'Change History', Icon: History },
];
const PAGE_SIZE = 15;
const control = 'h-9 rounded-lg border border-slate-200 bg-slate-50 px-3 text-xs font-semibold text-slate-700 outline-none transition hover:border-slate-300 focus:border-[#0b3b68]';
const header = 'sticky top-0 z-10 bg-[#052e53] px-4 py-3 text-left text-[11px] font-bold uppercase tracking-wide text-white';
const cell = 'border-b border-slate-100 px-4 py-3 text-xs text-slate-700';
const button = 'inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-[11px] font-bold text-[#0b3b68] transition hover:bg-blue-50';
function formatHistoryDate(input, epochSeconds) {
  if (!input && epochSeconds == null) return '—';
  const parsed = epochSeconds != null ? new Date(Number(epochSeconds) * 1000) :
    new Date(String(input).includes('T') ? input : `${String(input).replace(' ', 'T')}Z`);
  if (Number.isNaN(parsed.getTime())) return String(input);
  return new Intl.DateTimeFormat('en-PH', { timeZone: 'Asia/Manila', month: 'short', day: 'numeric', year: 'numeric',
    hour: 'numeric', minute: '2-digit' }).format(parsed);
}
function parseSnapshot(value) {
  if (value && typeof value === 'object') return value;
  try { return JSON.parse(value || '{}'); } catch { return {}; }
}
function changeSummary(row) {
  const before = parseSnapshot(row.previous_values);
  const after = parseSnapshot(row.new_values);
  if (row.change_type === 'COUNTRY_ADDED') return `New country assigned to ${after.taskOrderName || '—'} (${after.activeSkills || 0} initial Skills)`;
  if (row.change_type === 'COUNTRY_TRANSFER') return `${(before.previousTaskOrders || []).join(' / ') || 'Conflicting / Unmapped'} → ${after.taskOrderName || '—'} (${after.affectedSkills || 0} Skills)`;
  if (row.change_type === 'TASK_ORDER_UPDATED') {
    const changes = Object.keys(after).filter((key) => String(before[key]) !== String(after[key]));
    return changes.map((key) => `${key.replace(/_/g, ' ')}: ${String(before[key] ?? '—')} → ${String(after[key] ?? '—')}`).join(' · ') || 'Profile updated';
  }
  if (row.change_type === 'TASK_ORDER_ADDED') return `New profile: ${after.task_order_name || '—'}`;
  return `${before.skill || '—'} (${before.status || '—'}) → ${after.skill || '—'} (${after.status || '—'})`;
}
function badge(text, tone = 'blue') {
  const colors = { blue: 'border-blue-200 bg-blue-50 text-blue-700', green: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    amber: 'border-amber-200 bg-amber-50 text-amber-700', grey: 'border-slate-200 bg-slate-100 text-slate-600',
    red: 'border-rose-200 bg-rose-50 text-rose-700' };
  return <span className={`inline-flex max-w-full rounded-lg border px-2 py-1 text-[10px] font-bold ${colors[tone]}`}>{text}</span>;
}
function StatCard({ label, value, Icon }) {
  return <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-xs">
    <div className="flex items-center justify-between text-[11px] font-semibold text-slate-500"><span>{label}</span><Icon size={16} className="text-slate-400"/></div>
    <div className="mt-1 text-xl font-extrabold tabular-nums text-[#063b68]">{value}</div>
  </div>;
}

export default function TaskOrderLedger() {
  const dashboard = useDashboardPage();
  const userName = dashboard.userName || getAuthDisplayName(dashboard.authUser);
  const canEdit = [7, 9].includes(Number(getUserAdminAccess(dashboard.authUser)));
  const [activeTab, setActiveTab] = useState('countries');
  const [data, setData] = useState({ countries: [], skills: [], profiles: [] });
  const [history, setHistory] = useState({ rows: [], total: 0, page: 1, pageSize: PAGE_SIZE });
  const [loading, setLoading] = useState(true);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [search, setSearch] = useState('');
  const [selectedProfile, setSelectedProfile] = useState('ALL');
  const [selectedCountry, setSelectedCountry] = useState('ALL');
  const [expanded, setExpanded] = useState({});
  const [page, setPage] = useState(1);
  const [historyPage, setHistoryPage] = useState(1);
  const [action, setAction] = useState(null);
  const [saveError, setSaveError] = useState('');
  const [saving, setSaving] = useState(false);

  const loadManagement = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const response = await fetchTaskOrderManagement();
      if (!response?.success) throw new Error(response?.message || 'Unable to load Task Orders.');
      setData(response.data || { countries: [], skills: [], profiles: [] });
    } catch (err) { setError(err?.response?.data?.message || err?.message || 'Failed to load Task Order management.'); }
    finally { setLoading(false); }
  }, []);
  const loadHistory = useCallback(async (target = 1) => {
    setHistoryLoading(true);
    try {
      const response = await fetchTaskOrderHistory(target);
      if (!response?.success) throw new Error(response?.message || 'Unable to load history.');
      setHistory(response.data || { rows: [], total: 0, page: target, pageSize: PAGE_SIZE });
    } catch (err) { setError(err?.response?.data?.message || err?.message || 'Failed to load change history.'); }
    finally { setHistoryLoading(false); }
  }, []);
  useEffect(() => { void loadManagement(); }, [loadManagement]);
  useEffect(() => { if (activeTab === 'history') void loadHistory(historyPage); }, [activeTab, historyPage, loadHistory]);
  useEffect(() => { setPage(1); }, [activeTab, search, selectedProfile, selectedCountry]);
  const profiles = data.profiles || [];
  const countries = data.countries || [];
  const skills = data.skills || [];
  // Country options follow the selected Task Order, using the current ledger assignment.
  const countryNames = useMemo(() => [...new Set(countries
    .filter((c) => selectedProfile === 'ALL' || String(c.profileId) === selectedProfile)
    .map((c) => c.country)
    .filter(Boolean))].sort((a, b) => a.localeCompare(b)), [countries, selectedProfile]);
  // A transfer or refresh may move the selected country out of the active Task Order.
  useEffect(() => {
    if (selectedCountry !== 'ALL' && !countryNames.includes(selectedCountry)) setSelectedCountry('ALL');
  }, [countryNames, selectedCountry]);
  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (activeTab === 'countries') return countries.filter((c) => {
      return (selectedCountry === 'ALL' || c.country === selectedCountry) &&
        (selectedProfile === 'ALL' || String(c.profileId) === selectedProfile) &&
        (!query || [c.country, c.taskOrder, c.taskOrderCode, ...(c.aliases || []),
          ...skills.filter((s) => c.skillIds?.includes(Number(s.id))).map((s) => s.skill)]
          .some((x) => String(x || '').toLowerCase().includes(query)));
    });
    if (activeTab === 'skills') return skills.filter((s) => {
      const owner = profiles.find((p) => Number(p.id) === Number(s.task_order_profile_id));
      return (selectedCountry === 'ALL' || s.country === selectedCountry ||
        countries.find((c) => c.country === selectedCountry)?.skillIds?.includes(Number(s.id))) &&
        (selectedProfile === 'ALL' || String(s.task_order_profile_id) === selectedProfile) &&
        (!query || [s.country, s.skill, owner?.task_order_name].some((x) => String(x || '').toLowerCase().includes(query)));
    });
    if (activeTab === 'profiles') return profiles.filter((p) =>
      (selectedProfile === 'ALL' || String(p.id) === selectedProfile) &&
      (!query || [p.task_order_name, p.task_order_code, p.region, p.description]
        .some((x) => String(x || '').toLowerCase().includes(query))));
    return [];
  }, [activeTab, search, selectedProfile, selectedCountry, countries, skills, profiles]);
  const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const visible = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const open = (type, item = {}) => { setSaveError(''); setNotice(''); setAction({ type, item }); };
  const close = () => { if (!saving) { setAction(null); setSaveError(''); } };
  const save = async (current, payload) => {
    setSaveError(''); setSaving(true);
    try {
      if (current.type === 'transfer') await transferTaskOrderCountry(payload);
      else if (current.type === 'countryAdd') await createTaskOrderCountry(payload);
      else if (current.type === 'skillAdd') await createTaskOrderSkill(payload);
      else if (current.type === 'skillEdit') await updateTaskOrderSkill(current.item.id, payload);
      else if (current.type === 'profileAdd') await createTaskOrderProfile(payload);
      else if (current.type === 'profileEdit') await updateTaskOrderProfile(current.item.id, payload);
      setAction(null);
      setNotice('Changes saved successfully and recorded in Change History.');
      await loadManagement();
      if (activeTab === 'history') await loadHistory(historyPage);
    } catch (err) { setSaveError(err?.response?.data?.message || err?.message || 'Unable to save changes.'); }
    finally { setSaving(false); }
  };
  const reset = () => { setSearch(''); setSelectedProfile('ALL'); setSelectedCountry('ALL'); setPage(1); };
  const headerTitle = activeTab === 'countries' ? ['Country', 'Current Task Order', 'Active Skills', 'Status', 'Action'] :
    activeTab === 'skills' ? ['Country', 'Skill', 'Task Order', 'Status', 'Action'] :
    ['Task Order', 'Code', 'Assigned Countries', 'Status', 'Action'];

  return <section className="font-jakarta flex h-screen max-h-[100dvh] min-h-screen overflow-hidden bg-[#eef3f7] text-sibs-primary-1">
    <AdminSidebar isMobileOpen={dashboard.isMobileSidebarOpen} modules={dashboard.modules}
      onLogoutClick={() => dashboard.setShowLogoutModal(true)} onMobileClose={() => dashboard.setIsMobileSidebarOpen(false)}
      userName={userName} userRole={dashboard.authUser?.email || dashboard.authUser?.roleLabel || 'Workforce Management'}/>
    <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
      <AppHeader title="Task Order Management" subtitle="Workforce Management System" userName={userName}
        onMenuClick={() => dashboard.setIsMobileSidebarOpen(true)} onLogoutClick={() => dashboard.setShowLogoutModal(true)}/>
      <main className="flex min-h-0 flex-1 flex-col gap-3 overflow-hidden p-2.5 sm:p-4 lg:p-5">
        <div className="shrink-0 flex flex-wrap items-start justify-between gap-2">
          <div><h1 className="text-base font-extrabold text-[#052e53]">Task Order Management</h1>
            <p className="text-xs text-slate-500">Country ownership, Skills, Task Order profiles, and change history</p></div>
          <button type="button" onClick={() => { void loadManagement(); if (activeTab === 'history') void loadHistory(historyPage); }}
            className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-[#0b3b68] shadow-xs hover:bg-slate-50"><RefreshCw size={14}/> Refresh</button>
        </div>
        <div className="grid shrink-0 grid-cols-3 gap-2 sm:gap-3">
          <StatCard label="Task Orders" value={profiles.filter((p) => Number(p.is_active) === 1).length} Icon={ShieldCheck}/>
          <StatCard label="Countries" value={countries.length} Icon={Layers}/>
          <StatCard label="Skill Mappings" value={skills.length} Icon={ClipboardList}/>
        </div>
        <div className="shrink-0 flex gap-1 overflow-x-auto rounded-xl border border-slate-200 bg-white p-1 shadow-xs">
          {TABS.map(({ key, title, Icon }) => <button type="button" key={key}
            onClick={() => { setActiveTab(key); setError(''); }} className={`flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-2 text-[11px] font-bold transition sm:text-xs ${activeTab === key ? 'bg-[#052e53] text-white' : 'text-slate-600 hover:bg-slate-50'}`}>
            <Icon size={14}/>{title}</button>)}
        </div>
        {notice && <div role="status" className="shrink-0 flex items-center justify-between rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-800">
          {notice}<button type="button" onClick={() => setNotice('')} aria-label="Dismiss message"><X size={14}/></button></div>}
        {error && <div role="alert" className="shrink-0 flex gap-2 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-800"><AlertCircle size={15}/>{error}</div>}
        <div className="shrink-0 flex flex-wrap items-center gap-2 rounded-xl border border-slate-200 bg-white p-3 shadow-xs">
          {activeTab !== 'history' && <>
            <select value={selectedProfile} onChange={(e) => { setSelectedProfile(e.target.value); setSelectedCountry('ALL'); }} className={`${control} max-w-full flex-1 sm:flex-none sm:w-56`} aria-label="Filter Task Order">
              <option value="ALL">All Task Orders</option>{profiles.map((p) => <option key={p.id} value={p.id}>{p.task_order_name}</option>)}
            </select>
            {activeTab !== 'profiles' && <select value={selectedCountry} onChange={(e) => setSelectedCountry(e.target.value)} className={`${control} max-w-full flex-1 sm:flex-none sm:w-48`} aria-label="Filter country">
              <option value="ALL">All Countries</option>{countryNames.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>}
            <div className="relative min-w-[180px] flex-1"><Search size={15} className="pointer-events-none absolute left-3 top-2.5 text-slate-400"/>
              <input className={`${control} w-full pl-9 font-medium`} value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search country, Skill, Task Order..."/></div>
            <button type="button" onClick={reset} className={button}>Reset</button>
            {canEdit && activeTab === 'countries' && <button type="button" onClick={() => open('countryAdd')} className="flex items-center gap-1 rounded-lg bg-[#073b67] px-3 py-2 text-xs font-bold text-white hover:bg-[#082c4c]"><Plus size={14}/> Add Country</button>}
            {canEdit && activeTab === 'skills' && <button type="button" onClick={() => open('skillAdd', { country: selectedCountry !== 'ALL' ? selectedCountry : '' })} className="flex items-center gap-1 rounded-lg bg-[#073b67] px-3 py-2 text-xs font-bold text-white hover:bg-[#082c4c]"><Plus size={14}/> Add Skill</button>}
            {canEdit && activeTab === 'profiles' && <button type="button" onClick={() => open('profileAdd')} className="flex items-center gap-1 rounded-lg bg-[#073b67] px-3 py-2 text-xs font-bold text-white hover:bg-[#082c4c]"><Plus size={14}/> Add Task Order</button>}
          </>}
          {activeTab === 'history' && <div className="text-xs text-slate-500">Immutable audit trail of country transfers, Skill changes, and Task Order edits. Time displayed in Philippine time.</div>}
        </div>
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xs">
          <div className="min-h-0 flex-1 overflow-auto sibs-scrollbar">
            {activeTab === 'history' ? <table className="w-full min-w-[820px] border-collapse text-left"><thead><tr>
              {['Date / Time', 'Change', 'Country / Skill', 'Previous → New', 'Changed By', 'Reason'].map((h) => <th key={h} className={header}>{h}</th>)}
              </tr></thead><tbody>{historyLoading ? <tr><td className={`${cell} py-16 text-center`} colSpan={6}><Loader2 size={20} className="mx-auto animate-spin"/></td></tr> :
              history.rows.length === 0 ? <tr><td className={`${cell} py-16 text-center text-slate-400`} colSpan={6}>No changes recorded yet.</td></tr> :
              history.rows.map((row) => <tr key={row.id} className="hover:bg-slate-50">
                <td className={`${cell} whitespace-nowrap`}>{formatHistoryDate(row.changed_at, row.changed_at_epoch)}<div className="text-[10px] text-slate-400">GMT+8</div></td>
                <td className={cell}>{badge(String(row.change_type || '').replace(/_/g, ' '), 'blue')}</td>
                <td className={cell}><span className="font-semibold">{row.country || 'Task Order profile'}</span><div className="max-w-40 truncate text-[10px] text-slate-500" title={row.skill || ''}>{row.skill || '—'}</div></td>
                <td className={cell}><div className="max-w-64 whitespace-normal break-words text-[11px]">{changeSummary(row)}</div>
                  {row.business_effective_date && <div className="mt-1 text-[10px] text-slate-500">Reference date: {String(row.business_effective_date).slice(0, 10)}</div>}
                </td><td className={cell}>{row.changed_by}</td><td className={`${cell} max-w-64 whitespace-normal break-words`} title={row.reason}>{row.reason}</td>
              </tr>)}</tbody></table> : <table className="w-full min-w-[680px] border-collapse text-left"><thead><tr>
                {headerTitle.map((h) => <th key={h} className={header}>{h}</th>)}
              </tr></thead><tbody>
                {loading ? <tr><td colSpan={5} className={`${cell} py-16 text-center`}><Loader2 className="mx-auto animate-spin"/></td></tr> :
                  visible.length === 0 ? <tr><td colSpan={5} className={`${cell} py-16 text-center text-slate-400`}>No records found for the selected filters.</td></tr> :
                  activeTab === 'countries' ? visible.map((c) => <Fragment key={c.key}>
                    <tr key={c.key} className="hover:bg-slate-50">
                      <td className={cell}><button type="button" onClick={() => setExpanded((old) => ({ ...old, [c.key]: !old[c.key] }))} className="flex items-center gap-2 text-left font-extrabold text-[#073b67]">
                        {expanded[c.key] ? <ChevronDown size={14}/> : <ChevronRight size={14}/>}{c.country}</button>
                        {c.aliases?.length > 1 && <span className="ml-5 text-[10px] text-slate-400">{c.aliases.length} country labels</span>}</td>
                      <td className={cell}>{c.taskOrder ? badge(c.taskOrder) : badge('Unmapped', 'red')}</td>
                      <td className={`${cell} tabular-nums`}>{c.activeSkills} <span className="text-slate-400">/ {c.totalSkills} total</span></td>
                      <td className={cell}>{badge(c.status === 'ACTIVE' ? 'Mapped' : c.status === 'CONFLICT' ? 'Conflicting' : c.status.replace(/_/g, ' '), c.status === 'ACTIVE' ? 'green' : 'red')}</td>
                      <td className={cell}>{canEdit && c.activeSkills > 0 && <button type="button" className={button} onClick={() => open('transfer', c)}><ArrowRightLeft size={13}/> Transfer</button>}</td>
                    </tr>
                    {expanded[c.key] && <tr key={`${c.key}-skills`}><td colSpan={5} className="border-b border-slate-100 bg-slate-50 px-6 py-3">
                      <div className="mb-2 text-[11px] font-bold text-slate-600">Associated Skills</div>
                      <div className="grid gap-1 sm:grid-cols-2 xl:grid-cols-3">{skills.filter((s) => c.skillIds.includes(Number(s.id))).map((s) =>
                        <div key={s.id} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-[11px] text-slate-700">{s.skill} <span className="ml-1 text-slate-400">({s.status})</span></div>)}</div>
                    </td></tr>}
                  </Fragment>) : activeTab === 'skills' ? visible.map((s) => <tr key={s.id} className="hover:bg-slate-50">
                    <td className={`${cell} font-bold text-slate-900`}>{s.country}</td><td className={`${cell} max-w-md break-words`}>{s.skill}</td>
                    <td className={cell}>{s.task_order ? badge(s.task_order) : badge('Unmapped', 'red')}</td>
                    <td className={cell}>{badge(s.status, String(s.status).toUpperCase() === 'ACTIVE' ? 'green' : 'grey')}</td>
                    <td className={cell}>{canEdit && <button type="button" className={button} onClick={() => open('skillEdit', s)}><Pencil size={13}/> Edit</button>}</td>
                  </tr>) : visible.map((p) => <tr key={p.id} className="hover:bg-slate-50">
                    <td className={`${cell} font-extrabold text-[#073b67]`}>{p.task_order_name}<div className="mt-0.5 text-[10px] font-normal text-slate-400">{p.region}</div></td>
                    <td className={`${cell} text-[11px]`}>{p.task_order_code}</td>
                    <td className={`${cell} tabular-nums`}>{countries.filter((c) => Number(c.profileId) === Number(p.id)).length}</td>
                    <td className={cell}>{badge(Number(p.is_active) === 1 ? 'Active' : 'Inactive', Number(p.is_active) === 1 ? 'green' : 'grey')}</td>
                    <td className={cell}>{canEdit && <button type="button" className={button} onClick={() => open('profileEdit', p)}><Pencil size={13}/> Edit</button>}</td>
                  </tr>)}
              </tbody></table>}
          </div>
          <div className="shrink-0 border-t border-slate-100 bg-white">
            {activeTab === 'history' ? <TablePagination currentPage={historyPage} totalPages={Math.max(1, Math.ceil(history.total / PAGE_SIZE))}
              totalItems={history.total} pageSize={PAGE_SIZE} onPageChange={setHistoryPage} itemLabel="changes"/>
              : <TablePagination currentPage={page} totalPages={pages} totalItems={filtered.length} pageSize={PAGE_SIZE}
                onPageChange={setPage} itemLabel="records"/>}
          </div>
        </div>
      </main>
    </div>
    <TaskOrderEditDialog action={action} profiles={profiles} countries={countries} onClose={close} onSave={save} saving={saving} error={saveError}/>
    <ConfirmationModal isOpen={dashboard.showLogoutModal} title="Confirm logout" message="Are you sure you want to logout?"
      cancelText="Cancel" confirmText="Logout" onCancel={() => dashboard.setShowLogoutModal(false)} onConfirm={dashboard.handleLogout} tone="neutral"/>
    <LoadingModal isOpen={dashboard.isLoggingOut} title="Logging out" message="Please wait while we end your session."/>
  </section>;
}
