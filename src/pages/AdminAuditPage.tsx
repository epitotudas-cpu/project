import { useState, useEffect } from 'react';
import { Activity, Clock } from 'lucide-react';
import { getAuditLogs, type AuditLog } from '../services/adminService';

export default function AdminAuditPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const data = await getAuditLogs();
        setLogs(data);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  if (loading) {
    return (
      <div className="p-8 text-center text-gray-400">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-accent border-r-transparent mb-2" />
        <div>Audit napló betöltése...</div>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#1E1E1E] pb-6">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <Activity className="text-accent" size={26} />
            Audit Napló & Műveleti Előzmények
          </h1>
          <p className="text-gray-400 text-sm mt-1">
            Adminisztrátori műveletek és biztonsági események naplója
          </p>
        </div>
        <span className="text-xs bg-accent/10 border border-accent/20 text-accent font-bold px-3 py-1.5 rounded-lg self-start">
          {logs.length} Esemény
        </span>
      </div>

      <div className="bg-[#111111] border border-[#1E1E1E] rounded-xl overflow-hidden">
        <div className="divide-y divide-[#1E1E1E]">
          {logs.map((log) => (
            <div key={log.id} className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-bold uppercase text-accent bg-accent/10 px-2 py-0.5 rounded">
                    {log.action}
                  </span>
                  <span className="text-xs text-gray-400">Modul: {log.targetModule}</span>
                </div>
                <div className="text-sm font-medium text-white">{log.details}</div>
                <div className="text-xs text-gray-500">Felhasználó: {log.actorEmail}</div>
              </div>
              <div className="text-xs text-gray-500 flex items-center gap-1">
                <Clock size={12} /> {new Date(log.timestamp).toLocaleString('hu-HU')}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
