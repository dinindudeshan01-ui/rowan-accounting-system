'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { ConfirmModal } from '@/components/ConfirmModal';
import {
  Lead,
  LeadActivity,
  LeadActivityType,
  STAGE_OPTIONS,
  addActivity,
  completeActivity,
  convertLeadToCustomer,
  deleteLead,
  listActivities,
  updateLead,
} from '@/lib/crm';

const ACTIVITY_TYPES: { value: LeadActivityType; label: string }[] = [
  { value: 'note', label: 'Note' },
  { value: 'call', label: 'Call' },
  { value: 'email', label: 'Email' },
  { value: 'meeting', label: 'Meeting' },
  { value: 'follow_up', label: 'Follow-up' },
];

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
}

export function LeadDetail({
  lead,
  onClose,
  onChanged,
}: {
  lead: Lead;
  onClose: () => void;
  onChanged: () => void;
}) {
  const router = useRouter();
  const [activities, setActivities] = useState<LeadActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [activityType, setActivityType] = useState<LeadActivityType>('note');
  const [content, setContent] = useState('');
  const [followUpDate, setFollowUpDate] = useState('');
  const [saving, setSaving] = useState(false);
  const [converting, setConverting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    setLoading(true);
    listActivities(lead.id).then(setActivities).finally(() => setLoading(false));
  }, [lead.id]);

  async function handleAddActivity() {
    if (!content.trim()) return;
    setSaving(true);
    try {
      const a = await addActivity(lead.id, {
        activity_type: activityType,
        content: content.trim(),
        follow_up_date: activityType === 'follow_up' && followUpDate ? followUpDate : null,
      });
      setActivities((prev) => [a, ...prev]);
      setContent('');
      setFollowUpDate('');
    } finally {
      setSaving(false);
    }
  }

  async function handleConvert() {
    setConverting(true);
    try {
      const customer = await convertLeadToCustomer(lead);
      onChanged();
      router.push(`/accounting/customers/center?id=${customer.id}`);
    } finally {
      setConverting(false);
    }
  }

  async function handleDelete() {
    setDeleting(true);
    try {
      await deleteLead(lead.id);
      onChanged();
      onClose();
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex justify-end">
      <div className="bg-rowan-bg w-full max-w-md h-full overflow-auto shadow-2xl">
        <div className="bg-rowan-navy text-white px-5 py-4 flex justify-between items-start sticky top-0 z-10">
          <div>
            <p className="text-[10px] uppercase tracking-widest text-white/60">Lead</p>
            <h3 className="font-bold text-lg leading-tight">{lead.company_name}</h3>
          </div>
          <button onClick={onClose} className="text-white/70 hover:text-white text-xl leading-none">✕</button>
        </div>

        <div className="p-5 space-y-5">
          <div className="bg-white rounded-lg shadow p-4 space-y-2 text-[12px]">
            {lead.contact_person && <div><span className="text-gray-400">Contact: </span>{lead.contact_person}</div>}
            {lead.email && <div><span className="text-gray-400">Email: </span>{lead.email}</div>}
            {lead.phone && <div><span className="text-gray-400">Phone: </span>{lead.phone}</div>}
            {lead.source && <div><span className="text-gray-400">Source: </span>{lead.source}</div>}
            <div><span className="text-gray-400">Estimated Value: </span>{lead.estimated_value.toLocaleString()}</div>
            {lead.notes && <div className="pt-2 border-t border-gray-100 text-gray-600">{lead.notes}</div>}
          </div>

          <div className="flex items-center gap-2">
            <select
              value={lead.stage}
              onChange={async (e) => {
                await updateLead(lead.id, { stage: e.target.value as Lead['stage'] });
                onChanged();
              }}
              className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-[12px] font-bold bg-white"
            >
              {STAGE_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
            {lead.stage !== 'lost' && !lead.converted_customer_id && (
              <button
                onClick={handleConvert}
                disabled={converting}
                className="px-4 py-2 rounded-lg text-[12px] font-bold bg-rowan-red text-white hover:bg-rowan-redDark transition disabled:opacity-50 whitespace-nowrap"
              >
                {converting ? 'Converting…' : lead.converted_customer_id ? 'View Customer' : 'Win → Customer'}
              </button>
            )}
          </div>
          {lead.converted_customer_id && (
            <p className="text-[11px] text-green-700 font-bold">✓ Converted to a customer record.</p>
          )}

          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-[11px] font-bold text-rowan-navy uppercase tracking-wide mb-2">Log an activity</p>
            <div className="flex gap-2 mb-2">
              <select
                value={activityType}
                onChange={(e) => setActivityType(e.target.value as LeadActivityType)}
                className="border border-gray-300 rounded px-2 py-1.5 text-[12px]"
              >
                {ACTIVITY_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
              {activityType === 'follow_up' && (
                <input
                  type="date"
                  value={followUpDate}
                  onChange={(e) => setFollowUpDate(e.target.value)}
                  className="border border-gray-300 rounded px-2 py-1.5 text-[12px]"
                />
              )}
            </div>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={2}
              placeholder="What happened, or what's next…"
              className="w-full border border-gray-300 rounded px-2 py-1.5 text-[12px] mb-2"
            />
            <button
              onClick={handleAddActivity}
              disabled={saving || !content.trim()}
              className="px-4 py-2 rounded-lg text-[12px] font-bold bg-rowan-navy text-white hover:bg-rowan-red transition disabled:opacity-40"
            >
              {saving ? 'Adding…' : 'Add'}
            </button>
          </div>

          <div>
            <p className="text-[11px] font-bold text-rowan-navy uppercase tracking-wide mb-2">Timeline</p>
            {loading ? (
              <div className="py-6 flex justify-center"><LoadingSpinner /></div>
            ) : activities.length === 0 ? (
              <p className="text-[12px] text-gray-400 py-4 text-center">No activity logged yet.</p>
            ) : (
              <div className="space-y-2">
                {activities.map((a) => (
                  <div key={a.id} className="bg-white rounded-lg shadow-sm p-3 text-[12px]">
                    <div className="flex justify-between items-start">
                      <span className="font-bold text-rowan-navy uppercase text-[10px] tracking-wide">
                        {ACTIVITY_TYPES.find((t) => t.value === a.activity_type)?.label}
                      </span>
                      <span className="text-gray-400 text-[10px]">{fmtDate(a.created_at)}</span>
                    </div>
                    <p className="text-gray-600 mt-1">{a.content}</p>
                    {a.follow_up_date && (
                      <div className="flex justify-between items-center mt-2 pt-2 border-t border-gray-100">
                        <span className={`text-[10px] font-bold ${a.completed ? 'text-gray-400' : 'text-rowan-red'}`}>
                          Follow up: {fmtDate(a.follow_up_date)} {a.completed && '(done)'}
                        </span>
                        {!a.completed && (
                          <button
                            onClick={async () => {
                              await completeActivity(a.id);
                              setActivities((prev) => prev.map((x) => (x.id === a.id ? { ...x, completed: true } : x)));
                            }}
                            className="text-[10px] font-bold text-rowan-navy hover:text-rowan-red"
                          >
                            Mark done
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          <button
            onClick={() => setConfirmDelete(true)}
            className="text-[11px] font-bold text-gray-400 hover:text-rowan-red transition"
          >
            Delete lead
          </button>
        </div>
      </div>

      <ConfirmModal
        open={confirmDelete}
        title="Delete Lead"
        message={`Delete "${lead.company_name}"? This also removes its activity log. This can't be undone.`}
        confirmLabel="Delete"
        danger
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setConfirmDelete(false)}
      />
    </div>
  );
}
