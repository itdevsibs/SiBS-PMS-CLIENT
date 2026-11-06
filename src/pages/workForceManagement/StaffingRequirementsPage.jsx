// Client-approved daily Required HC, one target per Task Order. No schedule or
// attendance records are edited here; scheduled Actual HC comes from Kronos.
import { useCallback, useEffect, useMemo, useState } from 'react';
import { CalendarDays, X, Layers, Copy, ChevronLeft, ChevronRight, ClipboardList, History, Loader2, RefreshCw, Save, Users, CheckCircle2, AlertCircle, Edit3, Trash2 } from 'lucide-react';
import AdminSidebar from '@/components/common/layout/AdminSidebar';
import AppHeader from '@/components/common/layout/AppHeader';
import SingleSelectDropdown from '@/components/common/filters/SingleSelectDropdown';
import DatePicker from '@/components/common/filters/DatePicker';
import AppModal from '@/components/common/ui/AppModal';
import ConfirmationModal from '@/components/common/ui/ConfirmationModal';
import LoadingModal from '@/components/common/ui/LoadingModal';
import useDashboardPage from '@/hooks/useDashboardPage';
import { PERMISSIONS } from '@/config/accessControl';

import { getStaffingRequirements, getStaffingRequirementHistory, getStaffingDailyCoverage, saveStaffingRequirements, deleteStaffingRequirements, getStaffingTaskOrders } from '@/lib/axios/staffing-requirements';

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
const field = 'h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-800 placeholder:text-slate-400 outline-none transition focus:border-[#0b3b68] focus:ring-2 focus:ring-[#0b3b68]/10 hover:border-slate-300';
const button = 'inline-flex items-center justify-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-bold transition disabled:cursor-not-allowed disabled:opacity-50';

export default function StaffingRequirementsPage() {
  const dashboard = useDashboardPage();
  const canEdit = dashboard.hasPermission(PERMISSIONS.WFM_EDIT_STAFFING);
  const [taskOrders, setTaskOrders] = useState([]);
  const [taskOrderId, setTaskOrderId] = useState('');
  const [month, setMonth] = useState(thisMonth);
  const [selected, setSelected] = useState(null);
  const [view, setView] = useState('month');
  const [entryMode, setEntryMode] = useState('single');
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
  const [isEditingExisting, setIsEditingExisting] = useState(false);
  const [isEditingBulk, setIsEditingBulk] = useState(false);
  const [showAuditModal, setShowAuditModal] = useState(false);
  const [auditFilter, setAuditFilter] = useState('latest');
  const [confirmConfig, setConfirmConfig] = useState(null);
  const [reload, setReload] = useState(0);
  const calendar = useMemo(() => daysInMonth(month), [month]);
  const recordMap = useMemo(() => new Map(records.map(row => [row.requirementDate, row])), [records]);
  const coverageMap = useMemo(() => new Map((coverage?.days || []).map(row => [row.date, row])), [coverage]);

  const filteredHistory = useMemo(() => {
    if (!history || !history.length) return [];
    if (auditFilter === 'published') {
      return history.filter(item => item.newStatus === 'PUBLISHED');
    }
    if (auditFilter === 'deleted') {
      return history.filter(item => item.newStatus === 'DELETED');
    }
    if (auditFilter === 'day') {
      // Filter for target date matching selected day, or today Manila
      const targetDay = selected || todayManila();
      return history.filter(item => item.requirementDate === targetDay);
    }
    // 'latest' or default: return all sorted by latest first
    return history;
  }, [history, auditFilter, selected]);

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
    setIsEditingExisting(false);
    setIsEditingBulk(false);
  }, [selected, recordMap]);

  const executeSave = useCallback(async (entries, changeReason) => {
    if (!canEdit || saving) return;
    setSaving(true); setError(''); setNotice('');
    try {
      const result = await saveStaffingRequirements(entries, changeReason);
      // Brief minimum spinner display so the button loading state is visible and smooth
      await new Promise(resolve => setTimeout(resolve, 500));
      setNotice(`Saved ${result.count} daily requirement${result.count === 1 ? '' : 's'} successfully.`);
      setReload(v => v + 1);
    } catch (e) { setError(e?.response?.data?.message || e.message || 'Unable to save staffing requirements.'); }
    finally { setSaving(false); }
  }, [canEdit, saving]);

  const [deleting, setDeleting] = useState(false);

  const executeDelete = useCallback(async (entries, changeReason) => {
    if (!canEdit || deleting || saving) return;
    setDeleting(true); setError(''); setNotice('');
    try {
      const result = await deleteStaffingRequirements(entries, changeReason);
      await new Promise(resolve => setTimeout(resolve, 500));
      setNotice(`Deleted ${result.count} requirement${result.count === 1 ? '' : 's'} successfully.`);
      setSelected(null);
      setReload(v => v + 1);
    } catch (e) { setError(e?.response?.data?.message || e.message || 'Unable to delete staffing requirement.'); }
    finally { setDeleting(false); }
  }, [canEdit, deleting, saving]);

  const deleteDay = () => {
    if (!selected || !taskOrderId) return;
    setConfirmConfig({
      title: 'Delete Headcount Requirement?',
      message: `Are you sure you want to delete the required headcount for ${selected}? This will remove the requirement target.`,
      confirmText: 'Delete',
      tone: 'danger',
      onConfirm: () => {
        setConfirmConfig(null);
        void executeDelete([{ taskOrderId, requirementDate: selected }], reason || 'Deleted requirement');
      }
    });
  };

  const deleteRange = () => {
    try {
      const dates = datesBetween(rangeFrom, rangeTo);
      setConfirmConfig({
        title: 'Delete Headcount Requirements in Range?',
        message: `Are you sure you want to delete requirements for ${dates.length} date${dates.length === 1 ? '' : 's'} (${rangeFrom} to ${rangeTo})?`,
        confirmText: 'Delete',
        tone: 'danger',
        onConfirm: () => {
          setConfirmConfig(null);
          void executeDelete(dates.map(requirementDate => ({ taskOrderId, requirementDate })), reason || 'Bulk deleted requirements');
        }
      });
    } catch (e) { setError(e.message); }
  };

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
      setConfirmConfig({
        title: 'Publish Target Requirements?',
        message: `Publish ${bulkValue} Required HC for ${taskOrderId} across ${dates.length} date${dates.length === 1 ? '' : 's'}? Existing targets will be updated.`,
        onConfirm: () => {
          setConfirmConfig(null);
          void executeSave(dates.map(requirementDate => ({ taskOrderId, requirementDate, requiredHeadcount: Number(bulkValue), status: 'PUBLISHED' })), `Bulk set: ${reason || 'Client staffing requirement'}`);
        }
      });
    } catch (e) { setError(e.message); }
  };
  const copyPreviousWeek = () => {
    const sunday = shift(selected, -dateOf(selected).getUTCDay());
    const current = Array.from({ length: 7 }, (_, index) => shift(sunday, index));
    const past = current.map(date => shift(date, -7));
    if (past.some(date => !recordMap.has(date))) { setError('Previous week is incomplete; enter the missing daily targets first.'); return; }
    setConfirmConfig({
      title: 'Copy Previous Week Targets?',
      message: `Copy seven previous-week targets into ${current[0]} – ${current[6]}? Existing targets will be overwritten.`,
      onConfirm: () => {
        setConfirmConfig(null);
        void executeSave(current.map((requirementDate, index) => {
          const source = recordMap.get(past[index]);
          return { taskOrderId, requirementDate, requiredHeadcount: Number(source.requiredHeadcount), status: source.status };
        }), 'Copied previous week');
      }
    });
  };
  const visibleDates = useMemo(() => view === 'month' ? calendar.dates : (() => {
    const sunday = shift(selected, -dateOf(selected).getUTCDay());
    return Array.from({ length: 7 }, (_, index) => shift(sunday, index));
  })(), [view, calendar, selected]);
  const publishedDays = calendar.dates.filter(date => date.slice(0, 7) === month.slice(0, 7) && recordMap.get(date)?.status === 'PUBLISHED').length;
  const existingRow = selected ? recordMap.get(selected) : null;
  const hasExistingRequirement = Boolean(existingRow && existingRow.requiredHeadcount != null);
  const isFieldsDisabled = hasExistingRequirement && !isEditingExisting;

  // Check if any date in bulk range already has requirement
  const bulkDates = useMemo(() => {
    try {
      return datesBetween(rangeFrom, rangeTo);
    } catch {
      return [];
    }
  }, [rangeFrom, rangeTo]);
  const hasBulkExistingRequirement = useMemo(() => {
    return bulkDates.some(date => {
      const r = recordMap.get(date);
      return r && r.requiredHeadcount != null;
    });
  }, [bulkDates, recordMap]);
  const isBulkFieldsDisabled = hasBulkExistingRequirement && !isEditingBulk;

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
        <main className="min-h-0 flex-1 overflow-y-auto px-3 pb-10 pt-3 sm:px-5">
          <div className="mx-auto flex w-full flex-col gap-4">
            {/* Responsive Layout with Smooth Drawer Transitions */}
            <div className="flex flex-col xl:flex-row items-stretch gap-3 min-h-[calc(100vh-140px)] w-full">
              {/* Calendar Container - smoothly shrinks and expands */}
              <div className="flex-1 min-w-0 flex flex-col rounded-2xl border border-slate-200/90 bg-white shadow-[0_8px_28px_rgba(15,47,77,0.06)] overflow-hidden transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 p-4 sm:p-5 pb-3 shrink-0">
                  <div>
                    <h2 className="text-base font-black">{monthTitle}</h2>
                    <p className="text-[11px] text-slate-500">{publishedDays} dates with published requirements</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="w-56 sm:w-64">
                      <SingleSelectDropdown
                        value={taskOrderId}
                        onChange={(e) => setTaskOrderId(e.target.value)}
                        options={taskOrders.map((to) => ({ value: to.value, label: to.label }))}
                        placeholder={taskOrders.length ? "Select Task Order" : "No Task Orders"}
                        disabled={!taskOrders.length}
                        buttonClassName="h-8 rounded-lg border-slate-200 px-2.5 text-xs font-bold text-sibs-primary-1 hover:border-[#0b3b68] shadow-xs"
                      />
                    </div>
                    <button
                      type="button"
                      title="Refresh Requirements"
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 shadow-xs transition hover:border-[#0b3b68] hover:bg-slate-50 hover:text-[#0b3b68] active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
                      aria-label="Refresh"
                      onClick={() => setReload(v => v + 1)}
                    >
                      <RefreshCw size={13} className={loading ? "animate-spin text-[#0b3b68]" : ""} />
                    </button>
                    <div className="flex items-center gap-1">
                      <button className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 shadow-xs hover:border-[#0b3b68] hover:bg-slate-50 hover:text-[#0b3b68] transition active:scale-95" type="button" onClick={() => { setMonth(changeMonth(month, -1)); }} aria-label="Previous month"><ChevronLeft size={18} strokeWidth={2.5} /></button>
                      <button
                        type="button"
                        onClick={() => {
                          const today = todayManila();
                          setMonth(`${today.slice(0, 7)}-01`);
                          setSelected(today);
                          setRangeFrom(today);
                          setRangeTo(today);
                        }}
                        className="h-8 rounded-lg border border-slate-200 bg-white px-3 text-xs font-bold text-slate-700 shadow-xs hover:border-[#0b3b68] hover:bg-slate-50 hover:text-[#0b3b68] transition active:scale-95"
                      >
                        Today
                      </button>
                      <button className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 shadow-xs hover:border-[#0b3b68] hover:bg-slate-50 hover:text-[#0b3b68] transition active:scale-95" type="button" onClick={() => { setMonth(changeMonth(month, 1)); }} aria-label="Next month"><ChevronRight size={18} strokeWidth={2.5} /></button>
                      <button
                        type="button"
                        onClick={() => setShowAuditModal(true)}
                        className="flex h-8 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 text-xs font-bold text-slate-700 shadow-xs hover:border-[#0b3b68] hover:bg-slate-50 hover:text-[#0b3b68] transition active:scale-95 ml-1"
                        title="View Requirement Audit History"
                      >
                        <History size={14} className="text-[#0b3b68]" />
                        <span>Audit Logs</span>
                      </button>
                    </div>
                  </div>
                </div>
                {/* Unified Calendar: Full edge-to-edge shared grid lines seamlessly spanning from border to border */}
                <div className="flex-1 flex flex-col min-h-0 bg-slate-200">
                  {/* Flat dark navy header with vertical column divider lines */}
                  <div className="grid grid-cols-7 bg-[#042c51] text-white shrink-0 border-b border-[#032240] divide-x divide-blue-900/60">
                    {weekdays.map(day => (
                      <div key={day} className="py-2.5 text-center text-[10px] sm:text-[11px] font-extrabold tracking-[0.14em] text-white/95">
                        {day}
                      </div>
                    ))}
                  </div>

                  {/* Dates grid sharing direct column & row border dividers (gap-px over bg-slate-200) */}
                  <div className="flex-1 grid grid-cols-7 auto-rows-fr gap-px bg-slate-200 min-h-0 h-full">
                    {visibleDates.map(date => {
                      const row = recordMap.get(date);
                      const actual = coverageMap.get(date);
                      const isCurrentMonth = date.slice(0, 7) === month.slice(0, 7);
                      const isSelected = selected === date;
                      const isToday = date === todayManila();
                      const dayNumber = dateOf(date).getUTCDate();
                      const dayLabel = dateOf(date).toLocaleDateString('en-US', { month: 'short', timeZone: 'UTC' }).toUpperCase();
                      return <button type="button" key={date} onClick={() => {
                        if (isSelected) {
                          setSelected(null);
                        } else {
                          setSelected(date);
                          setRangeFrom(date);
                          setRangeTo(date);
                          if (!isCurrentMonth) setMonth(`${date.slice(0, 7)}-01`);
                        }
                      }}
                        aria-label={`${date}: ${row ? `${row.requiredHeadcount} required` : 'no requirement'}, ${actual?.actualHeadcount != null ? `${actual.actualHeadcount} scheduled` : 'schedule unavailable'}${row?.status === 'DRAFT' ? ', draft' : ''}`}
                        aria-pressed={isSelected}
                        className={`group flex h-full min-h-[92px] flex-col p-2 text-left transition duration-150 sm:p-2.5 ${
                          isSelected
                            ? 'bg-blue-50/90 ring-2 ring-inset ring-blue-500 z-10'
                            : isCurrentMonth
                            ? 'bg-white hover:bg-blue-50/30'
                            : 'bg-slate-50/80 hover:bg-slate-100/70'
                        }`}>
                        <div className="flex w-full items-center justify-between gap-1">
                          <span className={`flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-[11px] font-bold ${isSelected ? 'bg-blue-600 text-white' : isCurrentMonth ? 'text-slate-800' : 'text-slate-400'}`}>{dayNumber}</span>
                          <span className="flex items-center gap-1">
                            {!isCurrentMonth && <span className="text-[8px] font-semibold text-slate-400">{dayLabel}</span>}
                            {row?.status === 'DRAFT' && <span className="rounded-full bg-amber-50 px-1.5 py-0.5 text-[8px] font-bold text-amber-700 border border-amber-200">Draft</span>}
                            {isToday && <span className="rounded-full bg-blue-100 px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-wide text-blue-700">Today</span>}
                          </span>
                        </div>
                        <div className="mt-auto w-full pt-2">
                          <div className={`inline-flex rounded-md px-1.5 py-0.5 text-[9px] leading-none font-bold ${
                            row
                              ? (isSelected ? 'bg-blue-600 text-white shadow-xs' : 'bg-blue-600 text-white shadow-xs')
                              : 'border-transparent px-0 text-slate-400 font-semibold'
                          }`}>
                            {row ? `${row.requiredHeadcount} Required` : '—'}
                          </div>
                          <div className="mt-1 flex items-center gap-1 text-[9px] leading-none text-slate-500">
                            <span className={`h-1 w-1 shrink-0 rounded-full ${actual?.actualHeadcount != null ? 'bg-slate-300' : 'bg-slate-200'}`} />
                            <span>{actual?.actualHeadcount != null ? `${actual.actualHeadcount} Scheduled` : '— Scheduled'}</span>
                          </div>
                        </div>
                      </button>;
                    })}
                  </div>
                </div>
              </div>
              {/* Side Drawer Panel - smoothly slides from right */}
              <div
                className={`overflow-hidden transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] shrink-0 ${
                  selected
                    ? "w-full xl:w-[360px] max-w-full opacity-100 translate-x-0"
                    : "w-0 xl:w-0 max-w-0 opacity-0 translate-x-12 pointer-events-none"
                }`}
              >
                <div className="w-full xl:w-[360px] h-full flex flex-col">
                  <section className="flex flex-col flex-1 rounded-2xl border border-slate-200/90 bg-white shadow-[0_8px_28px_rgba(15,47,77,0.06)] overflow-hidden">
                    {/* Header with Mode Switcher (Single Date vs Bulk Range) */}
                    <div className="shrink-0 border-b border-slate-100 bg-slate-50/50 p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2.5">
                          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#0b3b68]/10 text-[#0b3b68]">
                            <ClipboardList size={16} />
                          </div>
                          <div>
                            <h3 className="text-[13px] font-bold text-slate-900 tracking-tight">Staffing Target Entry</h3>
                            <p className="text-[11px] text-slate-500 font-medium">Selected date: <span className="font-bold text-[#0b3b68]">{selected}</span></p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => setSelected(null)}
                          className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-400 hover:border-slate-300 hover:bg-slate-50 hover:text-slate-700 transition"
                          title="Close panel"
                          aria-label="Close panel"
                        >
                          <X size={14} />
                        </button>
                      </div>
                      {canEdit && (
                        <div className="grid grid-cols-2 p-1 rounded-xl bg-slate-200/60 text-xs font-semibold gap-1">
                          <button
                            type="button"
                            onClick={() => setEntryMode('single')}
                            className={`py-1.5 rounded-lg text-[11px] font-bold transition ${entryMode === 'single' ? 'bg-[#042c51] text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}
                          >
                            Single Day
                          </button>
                          <button
                            type="button"
                            onClick={() => setEntryMode('bulk')}
                            className={`py-1.5 rounded-lg text-[11px] font-bold transition ${entryMode === 'bulk' ? 'bg-[#042c51] text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}
                          >
                            Bulk Date Range
                          </button>
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col flex-1 p-4 overflow-y-auto">
                      {/* Headcount KPI summary tiles */}
                      <div className="shrink-0 grid grid-cols-2 gap-3 mb-3.5">
                        <div className="rounded-xl border border-blue-100 bg-gradient-to-b from-blue-50/60 to-white p-3 transition shadow-xs">
                          <p className="text-[10px] font-bold tracking-wider text-slate-500 uppercase">Required HC</p>
                          <p className="mt-1 text-2xl font-black text-[#0b3b68]">
                            {recordMap.get(selected)?.status === 'PUBLISHED' ? recordMap.get(selected).requiredHeadcount : '—'}
                          </p>
                        </div>
                        <div className="rounded-xl border border-slate-200/80 bg-gradient-to-b from-slate-50/60 to-white p-3 transition shadow-xs">
                          <p className="text-[10px] font-bold tracking-wider text-slate-500 uppercase">Scheduled HC</p>
                          <p className="mt-1 text-2xl font-black text-slate-700">
                            {selectedDay?.actualHeadcount ?? '—'}
                          </p>
                        </div>
                      </div>

                      {coverage?.scheduleError && (
                        <div className="shrink-0 mb-3.5 rounded-xl border border-amber-200 bg-amber-50/60 p-2.5 text-[11px] font-medium text-amber-800 leading-snug">
                          {coverage.scheduleError}
                        </div>
                      )}

                      {canEdit ? (
                        entryMode === 'single' ? (
                          <div className="flex flex-col flex-1 justify-between gap-3">
                            <div className="space-y-3">
                              <div>
                                <label className="block text-xs font-bold text-slate-700">Client Required Headcount</label>
                              </div>
                              <input
                                type="number"
                                min="0"
                                max="100000"
                                step="1"
                                disabled={isFieldsDisabled}
                                className={`${field} mt-1 ${isFieldsDisabled ? 'bg-slate-100 text-slate-500 cursor-not-allowed border-slate-200' : ''}`}
                                value={value}
                                onChange={e => setValue(e.target.value)}
                                placeholder="e.g. 5"
                              />
                              <div className="grid grid-cols-2 gap-2.5">
                                <div>
                                  <label className="block text-xs font-bold text-slate-700">Status</label>
                                  <select
                                    disabled={isFieldsDisabled}
                                    className={`${field} mt-1 ${isFieldsDisabled ? 'bg-slate-100 text-slate-500 cursor-not-allowed border-slate-200' : ''}`}
                                    value={status}
                                    onChange={e => setStatus(e.target.value)}
                                  >
                                    <option value="PUBLISHED">Published</option>
                                    <option value="DRAFT">Draft</option>
                                  </select>
                                </div>
                                <div>
                                  <label className="block text-xs font-bold text-slate-700 truncate" title="Client Reference (optional)">Client Reference</label>
                                  <input
                                    disabled={isFieldsDisabled}
                                    className={`${field} mt-1 ${isFieldsDisabled ? 'bg-slate-100 text-slate-500 cursor-not-allowed border-slate-200' : ''}`}
                                    maxLength={191}
                                    value={sourceReference}
                                    onChange={e => setSourceReference(e.target.value)}
                                    placeholder="Ref / email"
                                  />
                                </div>
                              </div>
                              <div>
                                <label className="block text-xs font-bold text-slate-700">Remarks <span className="text-slate-400 font-normal">(optional)</span></label>
                                <textarea
                                  rows={2}
                                  maxLength={1000}
                                  disabled={isFieldsDisabled}
                                  className={`${field} mt-1 h-auto py-2 ${isFieldsDisabled ? 'bg-slate-100 text-slate-500 cursor-not-allowed border-slate-200' : ''}`}
                                  value={remarks}
                                  onChange={e => setRemarks(e.target.value)}
                                  placeholder="Notes about this day..."
                                />
                              </div>
                              <div>
                                <label className="block text-xs font-bold text-slate-700">Change Reason <span className="text-slate-400 font-normal">(optional)</span></label>
                                <input
                                  disabled={isFieldsDisabled}
                                  className={`${field} mt-1 ${isFieldsDisabled ? 'bg-slate-100 text-slate-500 cursor-not-allowed border-slate-200' : ''}`}
                                  maxLength={500}
                                  value={reason}
                                  onChange={e => setReason(e.target.value)}
                                  placeholder="Reason for headcount update"
                                />
                              </div>
                            </div>
                            <div className="pt-2 mt-auto flex flex-col items-center gap-2">
                              {hasExistingRequirement && !isEditingExisting && (
                                <button
                                  type="button"
                                  onClick={() => setIsEditingExisting(true)}
                                  className="w-full flex items-center justify-center gap-2 rounded-xl border border-blue-500 bg-white py-2 px-4 text-xs font-bold text-blue-600 shadow-xs hover:bg-blue-50/70 hover:border-blue-600 transition active:scale-[0.99]"
                                >
                                  <Edit3 size={14} />
                                  <span>Edit</span>
                                </button>
                              )}
                              <button
                                type="button"
                                disabled={saving || loading || deleting || !taskOrderId || isFieldsDisabled}
                                className="w-full flex items-center justify-center gap-2 rounded-xl bg-[#042c51] py-2.5 px-4 text-xs font-bold text-white shadow-sm hover:bg-[#063d70] transition active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed"
                                onClick={saveDay}
                              >
                                {saving ? (
                                  <>
                                    <Loader2 size={14} className="animate-spin text-white" />
                                    <span>{hasExistingRequirement ? 'Updating Changes...' : 'Saving Requirement...'}</span>
                                  </>
                                ) : (
                                  <>
                                    <Save size={14} />
                                    <span>{hasExistingRequirement ? 'Update Changes' : 'Save Daily Requirement'}</span>
                                  </>
                                )}
                              </button>
                              {hasExistingRequirement && (
                                <button
                                  type="button"
                                  disabled={deleting || saving || loading || !taskOrderId || isFieldsDisabled}
                                  onClick={deleteDay}
                                  className="w-full flex items-center justify-center gap-2 rounded-xl border border-rose-200 bg-white py-2.5 px-4 text-xs font-bold text-rose-600 shadow-xs hover:bg-rose-50 hover:border-rose-300 transition active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                  {deleting ? (
                                    <>
                                      <Loader2 size={14} className="animate-spin text-rose-600" />
                                      <span>Deleting Headcount...</span>
                                    </>
                                  ) : (
                                    <>
                                      <Trash2 size={14} />
                                      <span>Delete Headcount</span>
                                    </>
                                  )}
                                </button>
                              )}
                            </div>
                          </div>
                        ) : (
                          <div className="flex flex-col flex-1 justify-between gap-3">
                            <div className="space-y-3">
                              <div className="grid grid-cols-2 gap-2.5">
                                <div>
                                  <label className="block text-xs font-bold text-slate-700 mb-1">Date From</label>
                                  <DatePicker
                                    value={rangeFrom}
                                    disabled={isBulkFieldsDisabled}
                                    onChange={(newVal) => setRangeFrom(newVal || '')}
                                    buttonClassName={`h-9 w-full rounded-lg border-slate-200 text-xs font-semibold hover:border-[#0b3b68] ${isBulkFieldsDisabled ? 'bg-slate-100 text-slate-500 cursor-not-allowed opacity-80' : ''}`}
                                  />
                                </div>
                                <div>
                                  <label className="block text-xs font-bold text-slate-700 mb-1">Date To</label>
                                  <DatePicker
                                    value={rangeTo}
                                    disabled={isBulkFieldsDisabled}
                                    onChange={(newVal) => setRangeTo(newVal || '')}
                                    buttonClassName={`h-9 w-full rounded-lg border-slate-200 text-xs font-semibold hover:border-[#0b3b68] ${isBulkFieldsDisabled ? 'bg-slate-100 text-slate-500 cursor-not-allowed opacity-80' : ''}`}
                                  />
                                </div>
                              </div>
                              <div>
                                <label className="block text-xs font-bold text-slate-700">Required HC</label>
                                <input
                                  type="number"
                                  min="0"
                                  max="100000"
                                  disabled={isBulkFieldsDisabled}
                                  className={`${field} mt-1 ${isBulkFieldsDisabled ? 'bg-slate-100 text-slate-500 cursor-not-allowed border-slate-200' : ''}`}
                                  value={bulkValue}
                                  onChange={e => setBulkValue(e.target.value)}
                                  placeholder="Target headcount"
                                />
                              </div>
                              <div>
                                <label className="block text-xs font-bold text-slate-700">Change Reason <span className="text-slate-400 font-normal">(optional)</span></label>
                                <input
                                  disabled={isBulkFieldsDisabled}
                                  className={`${field} mt-1 ${isBulkFieldsDisabled ? 'bg-slate-100 text-slate-500 cursor-not-allowed border-slate-200' : ''}`}
                                  maxLength={500}
                                  value={reason}
                                  onChange={e => setReason(e.target.value)}
                                  placeholder="Reason for bulk update"
                                />
                              </div>
                            </div>
                            <div className="pt-2 mt-auto flex flex-col items-center gap-2">
                              {hasBulkExistingRequirement && !isEditingBulk && (
                                <button
                                  type="button"
                                  onClick={() => setIsEditingBulk(true)}
                                  className="w-full flex items-center justify-center gap-2 rounded-xl border border-blue-500 bg-white py-2 px-4 text-xs font-bold text-blue-600 shadow-xs hover:bg-blue-50/70 hover:border-blue-600 transition active:scale-[0.99]"
                                >
                                  <Edit3 size={14} />
                                  <span>Edit</span>
                                </button>
                              )}
                              <button
                                type="button"
                                disabled={saving || deleting || !taskOrderId || isBulkFieldsDisabled}
                                onClick={applyRange}
                                className="w-full flex items-center justify-center gap-2 rounded-xl bg-[#042c51] py-2.5 px-4 text-xs font-bold text-white shadow-sm hover:bg-[#063d70] transition active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                {saving ? (
                                  <>
                                    <Loader2 size={14} className="animate-spin text-white" />
                                    <span>{hasBulkExistingRequirement ? 'Updating Changes...' : 'Applying Targets...'}</span>
                                  </>
                                ) : (
                                  <>
                                    <Save size={14} />
                                    <span>{hasBulkExistingRequirement ? 'Update Changes' : 'Apply to Date Range'}</span>
                                  </>
                                )}
                              </button>
                              {hasBulkExistingRequirement && (
                                <button
                                  type="button"
                                  disabled={deleting || saving || !taskOrderId || isBulkFieldsDisabled}
                                  onClick={deleteRange}
                                  className="w-full flex items-center justify-center gap-2 rounded-xl border border-rose-200 bg-white py-2.5 px-4 text-xs font-bold text-rose-600 shadow-xs hover:bg-rose-50 hover:border-rose-300 transition active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                  {deleting ? (
                                    <>
                                      <Loader2 size={14} className="animate-spin text-rose-600" />
                                      <span>Deleting Headcounts...</span>
                                    </>
                                  ) : (
                                    <>
                                      <Trash2 size={14} />
                                      <span>Delete Headcount</span>
                                    </>
                                  )}
                                </button>
                              )}
                            </div>
                          </div>
                        )
                      ) : (
                        <p className="text-[11px] text-slate-500">Read-only view. WFM users manage client staffing targets.</p>
                      )}
                    </div>
                  </section>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Audit Logs Modal */}
      <AppModal isOpen={showAuditModal} className="w-[90vw] max-w-5xl h-[85vh] p-0 overflow-hidden flex flex-col">
        <div className="flex flex-col h-full">
          <div className="flex shrink-0 items-center justify-between border-b border-slate-100 px-6 py-4 bg-white">
            <div className="flex items-center gap-2">
              <History size={16} className="text-slate-800" />
              <h3 className="text-sm font-bold text-slate-800">Recent Requirement Changes</h3>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] font-semibold text-slate-500">Filter:</span>
                <div className="w-36">
                  <SingleSelectDropdown
                    value={auditFilter}
                    onChange={e => setAuditFilter(e.target.value)}
                    options={[
                      { value: 'latest', label: 'Latest' },
                      { value: 'day', label: 'Day' },
                      { value: 'published', label: 'Published' },
                      { value: 'deleted', label: 'Deleted' },
                    ]}
                    placeholder="Select Filter"
                    buttonClassName="h-8 rounded-lg border-slate-200 px-2.5 text-xs font-semibold text-slate-700 hover:border-[#0b3b68] shadow-xs"
                  />
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowAuditModal(false)}
                className="h-8 rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-600 hover:border-slate-300 hover:bg-slate-50 hover:text-slate-800 transition"
              >
                Close
              </button>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto px-6 py-4">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-[11px]">
                <thead className="border-b border-slate-100 text-slate-600 font-bold">
                  <tr>
                    {['Timestamp', 'Target Date', 'Previous', 'Updated', 'Status', 'Edited By', 'Reason'].map(label => (
                      <th key={label} className="py-2.5 px-3 font-semibold text-slate-600">{label}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredHistory.map(item => (
                    <tr key={item.id} className="hover:bg-slate-50/50 transition">
                      <td className="py-2.5 px-3 font-medium text-slate-700 whitespace-nowrap">
                        {item.formattedTimestamp || (item.changedAt ? item.changedAt.slice(0, 19).replace('T', ' ') : '—')}
                      </td>
                      <td className="py-2.5 px-3 text-slate-600">{item.requirementDate}</td>
                      <td className="py-2.5 px-3 text-slate-600">{item.oldRequiredHeadcount ?? '—'}</td>
                      <td className="py-2.5 px-3 font-bold text-slate-800">{item.newRequiredHeadcount ?? '—'}</td>
                      <td className="py-2.5 px-3">
                        <span className={`inline-block px-1.5 py-0.5 rounded text-[9px] font-bold ${
                          item.newStatus === 'PUBLISHED'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : item.newStatus === 'DELETED'
                            ? 'bg-rose-50 text-rose-700 border border-rose-200'
                            : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}>
                          {item.newStatus}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-slate-600">{item.changedBy}</td>
                      <td className="py-2.5 px-3 text-slate-500">{item.changeReason || '—'}</td>
                    </tr>
                  ))}
                  {!filteredHistory.length && (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-slate-400">
                        No changes recorded for this filter option.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </AppModal>
      {/* Error Alert Modal */}
      <AppModal isOpen={Boolean(error)} textAlign="center" className="max-w-sm">
        <div className="flex flex-col items-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-rose-100 text-rose-600 mb-3 shadow-inner">
            <AlertCircle size={26} strokeWidth={2.5} />
          </div>
          <h3 className="text-base font-bold text-slate-900">Notice</h3>
          <p className="mt-1.5 text-xs text-slate-600 font-medium leading-relaxed">
            {error}
          </p>
          <button
            type="button"
            onClick={() => setError('')}
            className="mt-5 w-full rounded-xl bg-[#042c51] py-2.5 px-4 text-xs font-bold text-white shadow-xs hover:bg-[#063d70] transition active:scale-[0.99]"
          >
            Close
          </button>
        </div>
      </AppModal>

      {/* Success Notification Modal */}
      <AppModal isOpen={Boolean(notice)} textAlign="center" className="max-w-sm">
        <div className="flex flex-col items-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 mb-3 shadow-inner">
            <CheckCircle2 size={26} strokeWidth={2.5} />
          </div>
          <h3 className="text-base font-bold text-slate-900">Success!</h3>
          <p className="mt-1.5 text-xs text-slate-600 font-medium leading-relaxed">
            {notice}
          </p>
          <button
            type="button"
            onClick={() => setNotice('')}
            className="mt-5 w-full rounded-xl bg-[#042c51] py-2.5 px-4 text-xs font-bold text-white shadow-xs hover:bg-[#063d70] transition active:scale-[0.99]"
          >
            Got it
          </button>
        </div>
      </AppModal>

      {/* Action Confirmation Modal */}
      <ConfirmationModal
        isOpen={Boolean(confirmConfig)}
        title={confirmConfig?.title || 'Confirm Action'}
        message={confirmConfig?.message || ''}
        confirmText="Publish"
        cancelText="Cancel"
        onConfirm={confirmConfig?.onConfirm}
        onCancel={() => setConfirmConfig(null)}
      />

      <ConfirmationModal isOpen={dashboard.showLogoutModal} title="Log out?" message="You will be signed out of SiBS PMS." onCancel={() => dashboard.setShowLogoutModal(false)} onConfirm={dashboard.handleLogout} />
      <LoadingModal isOpen={dashboard.isLoggingOut} message="Signing out..." />
    </section>
  );
}
