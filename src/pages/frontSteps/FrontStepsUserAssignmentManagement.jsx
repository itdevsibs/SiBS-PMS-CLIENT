import React, { useEffect, useMemo, useState } from 'react';
import {
  CheckCircle2,
  Edit3,
  Loader2,
  Plus,
  Search,
  UserRoundSearch,
  X,
} from 'lucide-react';
import TablePagination from '../../components/common/tables/TablePagination';
import {
  getFrontStepsEmployeeAssignments,
  saveFrontStepsEmployeeAssignment,
  searchFrontStepsKronosEmployees,
  setFrontStepsEmployeeAssignmentStatus,
} from '../../lib/axios/frontsteps-imports';

const PAGE_SIZE = 10;
const inputClass = 'w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 outline-none transition focus:border-[#ff5c28] focus:ring-1 focus:ring-[#ff5c28]/20';

function StatusBadge({ active }) {
  return (
    <span className={`inline-flex rounded-md border px-2 py-0.5 text-[11px] font-bold ${active ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-slate-200 bg-slate-50 text-slate-500'}`}>
      {active ? 'Active' : 'Inactive'}
    </span>
  );
}

function AssignmentModal({ item, onClose, onSaved }) {
  const [draft, setDraft] = useState({
    sibsId: item?.sibsId || '',
    employeeName: item?.employeeName || '',
    employeeEmail: item?.employeeEmail || '',
    employeeAccount: item?.employeeAccount || '',
    salesforceName: item?.salesforceName || '',
    active: item?.active ?? true,
  });
  const [search, setSearch] = useState('');
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const runSearch = async () => {
    if (search.trim().length < 2) return;
    setSearching(true);
    setError('');
    try {
      const response = await searchFrontStepsKronosEmployees(search.trim());
      setResults(response?.items || []);
    } catch (err) {
      setError(err?.response?.data?.message || 'Unable to search Kronos employees.');
    } finally {
      setSearching(false);
    }
  };

  const save = async () => {
    if (!draft.sibsId || !draft.salesforceName.trim()) return;
    setSaving(true);
    setError('');
    try {
      await saveFrontStepsEmployeeAssignment({
        sibsId: draft.sibsId,
        salesforceName: draft.salesforceName.trim(),
        active: draft.active,
      });
      await onSaved();
      onClose();
    } catch (err) {
      setError(err?.response?.data?.message || 'Unable to save employee assignment.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-950/45 p-4" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="w-full max-w-2xl overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between bg-[#042c51] px-5 py-4 text-white">
          <div>
            <h3 className="text-base font-bold">{item ? 'Edit FrontSteps Assignment' : 'Add FrontSteps Assignment'}</h3>
            <p className="mt-0.5 text-xs text-slate-300">Salesforce alias is checked first; exact Kronos full name is the fallback during imports.</p>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg p-2 hover:bg-white/10"><X size={16} /></button>
        </div>

        <div className="space-y-4 p-5">
          {error && <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700">{error}</div>}

          {!item && (
            <div>
              <label className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-slate-500">Find Kronos Employee</label>
              <div className="flex gap-2">
                <input className={inputClass} value={search} onChange={(e) => setSearch(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && runSearch()} placeholder="Search SiBS ID, employee name, or email" />
                <button type="button" onClick={runSearch} className="inline-flex min-w-[92px] items-center justify-center gap-1.5 rounded-lg bg-[#042c51] px-3 text-xs font-bold text-white">
                  {searching ? <Loader2 size={14} className="animate-spin" /> : <Search size={14} />} Search
                </button>
              </div>
              {results.length > 0 && (
                <div className="mt-2 max-h-44 overflow-y-auto rounded-lg border border-slate-200">
                  {results.map((employee) => (
                    <button
                      type="button"
                      key={`${employee.sibsId}-${employee.employeeId}`}
                      onClick={() => {
                        setDraft((d) => ({ ...d, sibsId: employee.sibsId, employeeName: employee.employeeName || '', employeeEmail: employee.employeeEmail || '', employeeAccount: employee.employeeAccount || '' }));
                        setResults([]);
                      }}
                      className="flex w-full items-center justify-between border-b border-slate-100 px-3 py-2.5 text-left last:border-0 hover:bg-slate-50"
                    >
                      <span>
                        <span className="block text-xs font-bold text-slate-800">{employee.employeeName || 'Unnamed employee'}</span>
                        <span className="block text-[11px] text-slate-400">SiBS ID {employee.sibsId} · {employee.employeeEmail || 'No email'}</span>
                      </span>
                      <span className="text-[11px] font-semibold text-slate-500">{employee.employeeAccount || '-'}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-slate-500">SiBS ID</label>
              <input className={inputClass} value={draft.sibsId} disabled />
            </div>
            <div>
              <label className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-slate-500">Kronos Employee</label>
              <input className={inputClass} value={draft.employeeName} disabled />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-slate-500">Salesforce Name</label>
            <input className={inputClass} value={draft.salesforceName} onChange={(e) => setDraft((d) => ({ ...d, salesforceName: e.target.value }))} placeholder="Exact Salesforce display name" />
            <p className="mt-1 text-[11px] text-slate-400">Saved for both Cases and Calls imports. Do not use nicknames unless the Salesforce source actually uses them.</p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-slate-500">Email</label>
              <input className={inputClass} value={draft.employeeEmail} disabled />
            </div>
            <div>
              <label className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-slate-500">Kronos Account</label>
              <input className={inputClass} value={draft.employeeAccount} disabled />
            </div>
          </div>

          <label className="flex items-center justify-between rounded-xl border border-slate-200 p-3">
            <span>
              <span className="block text-xs font-bold text-slate-800">Mapping Active</span>
              <span className="block text-[11px] text-slate-400">Inactive mappings are ignored; imports will then try exact Kronos-name fallback.</span>
            </span>
            <input type="checkbox" checked={draft.active} onChange={(e) => setDraft((d) => ({ ...d, active: e.target.checked }))} className="h-4 w-4 accent-[#ff5c28]" />
          </label>
        </div>

        <div className="flex justify-end gap-2 border-t border-slate-100 bg-slate-50 px-5 py-3">
          <button type="button" onClick={onClose} className="rounded-lg border border-slate-200 px-4 py-2 text-xs font-bold text-slate-600">Cancel</button>
          <button type="button" onClick={save} disabled={saving || !draft.sibsId || !draft.salesforceName.trim()} className="inline-flex items-center gap-1.5 rounded-lg bg-[#ff5c28] px-4 py-2 text-xs font-bold text-white disabled:opacity-40">
            {saving && <Loader2 size={14} className="animate-spin" />} Save Assignment
          </button>
        </div>
      </div>
    </div>
  );
}

export default function FrontStepsUserAssignmentManagement() {
  const [items, setItems] = useState([]);
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [editing, setEditing] = useState(null);

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await getFrontStepsEmployeeAssignments({ page: 1, limit: 100 });
      setItems(response?.items || []);
    } catch (err) {
      setError(err?.response?.data?.message || 'Unable to load FrontSteps employee assignments.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter((item) => [item.sibsId, item.employeeName, item.employeeEmail, item.salesforceName, item.employeeAccount]
      .some((value) => String(value || '').toLowerCase().includes(q)));
  }, [items, query]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageItems = filtered.slice((Math.min(page, totalPages) - 1) * PAGE_SIZE, Math.min(page, totalPages) * PAGE_SIZE);

  const toggle = async (item) => {
    setError('');
    try {
      await setFrontStepsEmployeeAssignmentStatus(item.sibsId, !item.active);
      setNotice(`Mapping for ${item.employeeName || item.sibsId} ${item.active ? 'deactivated' : 'activated'}.`);
      await load();
    } catch (err) {
      setError(err?.response?.data?.message || 'Unable to update assignment status.');
    }
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3">
      {notice && (
        <div className="flex items-center justify-between rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700">
          <span className="flex items-center gap-2"><CheckCircle2 size={14} />{notice}</span>
          <button type="button" onClick={() => setNotice('')}><X size={14} /></button>
        </div>
      )}
      {error && <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700">{error}</div>}

      <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 text-sm font-extrabold text-slate-800"><UserRoundSearch size={16} className="text-[#ff5c28]" />FrontSteps Employee Mapping</div>
            <p className="mt-0.5 text-[11px] text-slate-500">Salesforce alias first → exact Kronos full-name fallback → unresolved if no exact match.</p>
          </div>
          <button type="button" onClick={() => setEditing({})} className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-[#ff5c28] px-3.5 text-xs font-bold text-white hover:bg-[#e04816]">
            <Plus size={14} /> Add Assignment
          </button>
        </div>
        <div className="relative mt-3 max-w-xl">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input className="h-9 w-full rounded-lg border border-slate-200 pl-9 pr-3 text-xs outline-none focus:border-[#ff5c28]" value={query} onChange={(e) => { setQuery(e.target.value); setPage(1); }} placeholder="Search employee, SiBS ID, Salesforce name, or Kronos account" />
        </div>
      </div>

      <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xs">
        <div className="min-h-0 flex-1 overflow-auto">
          <table className="w-full table-fixed text-left text-xs">
            <thead className="sticky top-0 z-10 bg-[#042c51] text-[11px] font-bold uppercase tracking-wider text-white">
              <tr>
                <th className="w-[25%] px-4 py-3">Employee</th>
                <th className="w-[12%] px-4 py-3">SiBS ID</th>
                <th className="w-[23%] px-4 py-3">Salesforce Name</th>
                <th className="w-[18%] px-4 py-3">Import Mapping</th>
                <th className="w-[10%] px-4 py-3 text-center">Status</th>
                <th className="w-[12%] px-4 py-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr><td colSpan={6} className="py-14 text-center text-slate-500"><Loader2 size={18} className="mx-auto mb-2 animate-spin" />Loading assignments…</td></tr>
              ) : pageItems.length ? pageItems.map((item) => (
                <tr key={item.sibsId} className="hover:bg-slate-50/70">
                  <td className="px-4 py-3"><span className="block font-bold text-slate-900">{item.employeeName || 'Kronos employee not found'}</span><span className="block text-[11px] text-slate-400">{item.employeeEmail || item.employeeAccount || '-'}</span></td>
                  <td className="px-4 py-3 font-mono font-bold text-slate-600">{item.sibsId}</td>
                  <td className="px-4 py-3"><span className="font-semibold text-slate-800">{item.salesforceName || '-'}</span><span className="mt-0.5 block text-[10px] text-slate-400">Cases + Calls</span></td>
                  <td className="px-4 py-3"><span className="block font-semibold text-emerald-700">Salesforce Alias</span><span className="block text-[10px] text-slate-400">Kronos exact-name fallback enabled</span></td>
                  <td className="px-4 py-3 text-center"><StatusBadge active={item.active} /></td>
                  <td className="px-4 py-3"><div className="flex justify-center gap-1.5"><button type="button" onClick={() => setEditing(item)} className="rounded-md border border-slate-200 p-1.5 text-[#042c51] hover:bg-slate-50"><Edit3 size={13} /></button><button type="button" onClick={() => toggle(item)} className={`rounded-md border px-2 py-1 text-[10px] font-bold ${item.active ? 'border-rose-200 bg-rose-50 text-rose-700' : 'border-emerald-200 bg-emerald-50 text-emerald-700'}`}>{item.active ? 'Deactivate' : 'Activate'}</button></div></td>
                </tr>
              )) : (
                <tr><td colSpan={6} className="py-14 text-center text-xs text-slate-400">No FrontSteps employee assignments found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
        <TablePagination currentPage={Math.min(page, totalPages)} totalPages={totalPages} totalItems={filtered.length} pageSize={PAGE_SIZE} onPageChange={setPage} itemLabel="assignments" className="shrink-0" />
      </div>

      {editing !== null && (
        <AssignmentModal
          item={editing?.sibsId ? editing : null}
          onClose={() => setEditing(null)}
          onSaved={async () => { setNotice('FrontSteps employee assignment saved.'); await load(); }}
        />
      )}
    </div>
  );
}
