'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { LeadModal } from '@/components/LeadModal';
import { LeadDetail } from '@/components/LeadDetail';
import {
  Lead,
  LeadDraft,
  STAGE_OPTIONS,
  createLead,
  listLeads,
  listUpcomingFollowUps,
} from '@/lib/crm';

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString('en-US', { day: 'numeric', month: 'short' });
}

const STAGE_COLORS: Record<string, string> = {
  inquiry: 'border-t-gray-300',
  quoted: 'border-t-rowan-navyLight',
  sample_sent: 'border-t-rowan-red',
  confirmed: 'border-t-green-500',
  lost: 'border-t-gray-200',
};

export default function CrmHubPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [followUps, setFollowUps] = useState<Awaited<ReturnType<typeof listUpcomingFollowUps>>>([]);
  const [loading, setLoading] = useState(true);
  const [showNew, setShowNew] = useState(false);
  const [selected, setSelected] = useState<Lead | null>(null);

  async function refresh() {
    const [l, f] = await Promise.all([listLeads(), listUpcomingFollowUps()]);
    setLeads(l);
    setFollowUps(f);
  }

  useEffect(() => {
    refresh().finally(() => setLoading(false));
  }, []);

  const byStage = useMemo(() => {
    const map = new Map<string, Lead[]>();
    for (const s of STAGE_OPTIONS) map.set(s.value, []);
    for (const l of leads) map.get(l.stage)?.push(l);
    return map;
  }, [leads]);

  const pipelineValue = useMemo(
    () => leads.filter((l) => l.stage !== 'lost' && l.stage !== 'confirmed').reduce((sum, l) => sum + l.estimated_value, 0),
    [leads]
  );

  return (
    <div className="min-h-screen bg-rowan-bg p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-start mb-6">
          <div>
            <Link href="/" className="text-xs font-bold text-rowan-navy hover:text-rowan-red">← Dashboard</Link>
            <h1 className="text-2xl font-black text-rowan-navy mt-1">CRM</h1>
            <p className="text-xs text-gray-500 mt-0.5">
              Leads, follow-ups, and the pipeline — open deals worth {pipelineValue.toLocaleString()}.
            </p>
          </div>
          <button type="button"
            onClick={() => setShowNew(true)}
            className="bg-rowan-navy text-white px-5 py-2.5 rounded-lg font-bold text-sm hover:bg-rowan-red transition whitespace-nowrap"
          >
            + New Lead
          </button>
        </div>

        {followUps.length > 0 && (
          <div className="bg-white rounded-lg shadow-lg p-4 mb-6">
            <p className="text-[11px] font-bold text-rowan-navy uppercase tracking-wide mb-2">Follow-ups due</p>
            <div className="flex flex-wrap gap-2">
              {followUps.map((f) => {
                const lead = leads.find((l) => l.id === f.lead.id);
                const overdue = new Date(f.follow_up_date!) < new Date(new Date().toDateString());
                return (
                  <button type="button"
                    key={f.id}
                    onClick={() => lead && setSelected(lead)}
                    className={`text-[11px] font-bold px-3 py-1.5 rounded-full border transition ${
                      overdue
                        ? 'bg-red-50 border-rowan-red text-rowan-red hover:bg-red-100'
                        : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    {f.lead.company_name} · {fmtDate(f.follow_up_date!)}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {loading ? (
          <div className="py-16 flex justify-center"><LoadingSpinner /></div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {STAGE_OPTIONS.map((stage) => {
              const stageLeads = byStage.get(stage.value) ?? [];
              const stageValue = stageLeads.reduce((sum, l) => sum + l.estimated_value, 0);
              return (
                <div key={stage.value} className={`bg-white rounded-lg shadow border-t-4 ${STAGE_COLORS[stage.value]} p-3`}>
                  <div className="flex justify-between items-baseline mb-3">
                    <p className="text-[11px] font-black text-rowan-navy uppercase tracking-wide">{stage.label}</p>
                    <span className="text-[10px] text-gray-400 font-bold">{stageLeads.length}</span>
                  </div>
                  {stageValue > 0 && <p className="text-[10px] text-gray-400 mb-2">{stageValue.toLocaleString()}</p>}
                  <div className="space-y-2 min-h-[40px]">
                    {stageLeads.length === 0 ? (
                      <p className="text-[11px] text-gray-300 py-4 text-center">—</p>
                    ) : (
                      stageLeads.map((lead) => (
                        <button type="button"
                          key={lead.id}
                          onClick={() => setSelected(lead)}
                          className="w-full text-left bg-rowan-bg hover:bg-gray-100 rounded-lg p-2.5 transition"
                        >
                          <p className="font-bold text-rowan-navy text-[12px] leading-tight">{lead.company_name}</p>
                          {lead.contact_person && <p className="text-[10px] text-gray-500">{lead.contact_person}</p>}
                          {lead.estimated_value > 0 && (
                            <p className="text-[10px] text-gray-400 mt-1">{lead.estimated_value.toLocaleString()}</p>
                          )}
                        </button>
                      ))
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {showNew && (
        <LeadModal
          onClose={() => setShowNew(false)}
          onSave={async (draft: LeadDraft) => {
            await createLead(draft);
            await refresh();
            setShowNew(false);
          }}
        />
      )}

      {selected && (
        <LeadDetail
          lead={selected}
          onClose={() => setSelected(null)}
          onChanged={async () => {
            await refresh();
            const updated = (await listLeads()).find((l) => l.id === selected.id);
            setSelected(updated ?? null);
          }}
        />
      )}
    </div>
  );
}
