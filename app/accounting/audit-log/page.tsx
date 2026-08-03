'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { RowanWordmark, BrandRibbon } from '@/components/RowanMark';
import { PresenceIndicator } from '@/components/PresenceIndicator';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { SearchableSelect } from '@/components/SearchableSelect';

type AuditRow = {
  id: string;
  user_name: string;
  action: string;
  entity_type: string;
  entity_id: string;
  entity_label: string;
  changes: Record<string, { old: string; new: string }> | null;
  created_at: string;
};

const ACTION_COLORS: Record<string, string> = {
  insert: 'bg-green-100 text-green-800',
  update: 'bg-amber-100 text-amber-800',
  delete: 'bg-red-100 text-red-800',
  post: 'bg-blue-100 text-blue-800',
  void: 'bg-gray-200 text-gray-700',
};

export default function AuditLogPage() {
  const [rows, setRows] = useState<AuditRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [entityFilter, setEntityFilter] = useState('all');
  const [actionFilter, setActionFilter] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [expanded, setExpanded] = useState<string | null>(null);

  const currentUser = { id: 'demo-user', name: 'Dinindu' };

  async function loadLogs() {
    setLoading(true);
    let query = supabase.from('audit_log').select('*').order('created_at', { ascending: false }).limit(500);

    if (entityFilter !== 'all') query = query.eq('entity_type', entityFilter);
    if (actionFilter !== 'all') query = query.eq('action', actionFilter);
    if (startDate) query = query.gte('created_at', startDate);
    if (endDate) query = query.lte('created_at', endDate + 'T23:59:59');

    const { data } = await query;
    setRows(data ?? []);
    setLoading(false);
  }

  useEffect(() => {
    loadLogs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entityFilter, actionFilter, startDate, endDate]);

  const entityTypes = useMemo(() => Array.from(new Set(rows.map((r) => r.entity_type))), [rows]);

  return (
    <div className="min-h-screen bg-rowan-bg p-6">
      <PresenceIndicator roomName="accounting-app" currentUser={currentUser} currentPage="Audit Log" />

      <div className="max-w-6xl mx-auto bg-white rounded-lg shadow-lg overflow-hidden">
        <BrandRibbon />
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <RowanWordmark />
            <h2 className="text-lg font-bold uppercase tracking-widest text-rowan-navy">Audit Log</h2>
          </div>

          <div className="grid grid-cols-4 gap-3 mb-4 text-xs">
            <div>
              <label className="block text-gray-500 font-bold mb-1">Entity</label>
              <SearchableSelect
                value={entityFilter}
                onChange={setEntityFilter}
                options={[{ value: 'all', label: 'All' }, ...entityTypes.map((t) => ({ value: t, label: t }))]}
              />
            </div>
            <div>
              <label className="block text-gray-500 font-bold mb-1">Action</label>
              <SearchableSelect
                value={actionFilter}
                onChange={setActionFilter}
                options={[
                  { value: 'all', label: 'All' },
                  { value: 'insert', label: 'Insert' },
                  { value: 'update', label: 'Update' },
                  { value: 'delete', label: 'Delete' },
                ]}
              />
            </div>
            <div>
              <label className="block text-gray-500 font-bold mb-1">From</label>
              <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="w-full border border-gray-300 rounded px-2 py-1.5" />
            </div>
            <div>
              <label className="block text-gray-500 font-bold mb-1">To</label>
              <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="w-full border border-gray-300 rounded px-2 py-1.5" />
            </div>
          </div>

          <table className="w-full text-xs border-collapse">
            <thead>
              <tr className="bg-rowan-navy text-white text-left">
                <th className="p-2">Timestamp</th>
                <th className="p-2">User</th>
                <th className="p-2">Action</th>
                <th className="p-2">Entity</th>
                <th className="p-2">Reference</th>
                <th className="p-2"></th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr><td colSpan={6} className="p-6 text-center"><LoadingSpinner size="sm" label="Loading..." className="mx-auto" /></td></tr>
              )}
              {!loading && rows.length === 0 && (
                <tr><td colSpan={6} className="p-4 text-center text-gray-400">No activity found for this filter.</td></tr>
              )}
              {rows.map((r) => (
                <React.Fragment key={r.id}>
                  <tr className="border-b border-gray-200 hover:bg-gray-50">
                    <td className="p-2 whitespace-nowrap">{new Date(r.created_at).toLocaleString()}</td>
                    <td className="p-2">{r.user_name}</td>
                    <td className="p-2">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${ACTION_COLORS[r.action] ?? 'bg-gray-100 text-gray-700'}`}>
                        {r.action}
                      </span>
                    </td>
                    <td className="p-2">{r.entity_type}</td>
                    <td className="p-2 font-mono">{r.entity_label}</td>
                    <td className="p-2 text-right">
                      {r.changes && (
                        <button onClick={() => setExpanded(expanded === r.id ? null : r.id)} className="text-rowan-navy font-bold hover:text-rowan-red">
                          {expanded === r.id ? 'Hide' : 'View changes'}
                        </button>
                      )}
                    </td>
                  </tr>
                  {expanded === r.id && r.changes && (
                    <tr className="bg-gray-50 border-b border-gray-200">
                      <td colSpan={6} className="p-3">
                        <table className="w-full text-[11px]">
                          <thead>
                            <tr className="text-gray-500">
                              <th className="text-left p-1">Field</th>
                              <th className="text-left p-1">Old value</th>
                              <th className="text-left p-1">New value</th>
                            </tr>
                          </thead>
                          <tbody>
                            {Object.entries(r.changes).map(([field, v]) => (
                              <tr key={field}>
                                <td className="p-1 font-bold">{field}</td>
                                <td className="p-1 text-red-600">{String(v.old ?? '—')}</td>
                                <td className="p-1 text-green-600">{String(v.new ?? '—')}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
        <BrandRibbon />
      </div>
    </div>
  );
}
