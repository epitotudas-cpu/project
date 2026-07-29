import { useState, useEffect } from 'react';
import { Shield } from 'lucide-react';
import { listRoles } from '../services/roleService';
import type { Role } from '../lib/supabase';

export default function AdminRolesPage() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const data = await listRoles();
        setRoles(data);
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
        <div>Szerepkörök betöltése...</div>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#1E1E1E] pb-6">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <Shield className="text-accent" size={26} />
            Jogosultságkezelés (v2 RBAC Szerepkörök)
          </h1>
          <p className="text-gray-400 text-sm mt-1">
            Rendszer- és egyedi szerepkörök áttekintése
          </p>
        </div>
        <span className="text-xs bg-accent/10 border border-accent/20 text-accent font-bold px-3 py-1.5 rounded-lg self-start">
          {roles.length} Regisztrált Szerepkör
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {roles.map((role) => (
          <div key={role.id} className="bg-[#111111] border border-[#1E1E1E] rounded-xl p-6 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-accent bg-accent/10 px-2.5 py-1 rounded">
                {role.slug}
              </span>
              <span className="text-xs text-gray-500">
                {role.is_system ? 'Rendszer' : 'Egyedi'}
              </span>
            </div>
            <h2 className="text-lg font-bold text-white">{role.name}</h2>
            <p className="text-sm text-gray-400 leading-relaxed">{role.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
