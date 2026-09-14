import { useState } from 'react';
import { Shield, CheckSquare, Square, Save, RotateCcw, AlertTriangle, Lock, UserCheck, Briefcase } from 'lucide-react';
import {
  SYSTEM_MODULES,
  getRoleModulePermissions,
  saveRoleModulePermissions,
  type ModuleActionPermissions,
} from '../services/permissionService';

export function AdminAccessControlPage() {
  const [selectedRole, setSelectedRole] = useState<'editor' | 'partner'>('editor');
  const [permissions, setPermissions] = useState<Record<string, ModuleActionPermissions>>(() =>
    getRoleModulePermissions(selectedRole)
  );
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const handleRoleChange = (role: 'editor' | 'partner') => {
    setSelectedRole(role);
    setPermissions(getRoleModulePermissions(role));
  };

  const handlePermissionToggle = (moduleId: string, action: keyof ModuleActionPermissions) => {
    setPermissions((prev) => {
      const currentMod = prev[moduleId] || {
        view: false,
        create: false,
        edit: false,
        submit: false,
        publish: false,
        delete: false,
      };
      return {
        ...prev,
        [moduleId]: {
          ...currentMod,
          [action]: !currentMod[action],
        },
      };
    });
  };

  const handleBulkCategoryToggle = (categoryName: string, enable: boolean) => {
    const modulesInCategory = SYSTEM_MODULES.filter((m) => m.category === categoryName && !m.isAdminOnly);
    setPermissions((prev) => {
      const next = { ...prev };
      modulesInCategory.forEach((m) => {
        next[m.id] = {
          view: enable,
          create: enable,
          edit: enable,
          submit: enable,
          publish: enable,
          delete: enable,
        };
      });
      return next;
    });
  };

  const handleSave = () => {
    saveRoleModulePermissions(selectedRole, permissions);
    setToastMessage(
      `A(z) ${selectedRole === 'editor' ? 'Szerkesztő' : 'Partner'} szerepkör jogosultságai sikeresen elmentve!`
    );
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleReset = () => {
    localStorage.removeItem(`epitotudas_role_permissions_${selectedRole}`);
    setPermissions(getRoleModulePermissions(selectedRole));
    setToastMessage(`A(z) ${selectedRole === 'editor' ? 'Szerkesztő' : 'Partner'} jogosultságok visszaállítva az alapértelmezettekre.`);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const categories = Array.from(new Set(SYSTEM_MODULES.map((m) => m.category)));

  return (
    <div className="space-y-8">
      {/* Toast alert */}
      {toastMessage && (
        <div className="fixed top-6 right-6 z-50 flex items-center gap-3 bg-emerald-900/90 border border-emerald-500/50 text-emerald-100 px-6 py-4 rounded-xl shadow-2xl backdrop-blur-md animate-fade-in">
          <Shield className="w-5 h-5 text-emerald-400" />
          <span className="text-sm font-medium">{toastMessage}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-amber-950/40 to-slate-900 border border-amber-500/20 rounded-2xl p-6 md:p-8 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-semibold uppercase tracking-wider">
              <Lock className="w-3.5 h-3.5" />
              Kizárólag Adminisztrátori Hozzáférés
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">
              Szerepkörök és Jogosultságok Kezelése
            </h1>
            <p className="text-slate-400 text-sm max-w-2xl">
              Konfiguráld a Szerkesztői és Partneri panelek hozzáférési mátrixát. Állítsd be modulonként a megtekintési, létrehozási, szerkesztési, publikálási és törlési jogosultságokat.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleReset}
              className="flex items-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-sm font-medium transition-colors border border-slate-700"
            >
              <RotateCcw className="w-4 h-4" />
              Visszaállítás
            </button>

            <button
              onClick={handleSave}
              className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-semibold rounded-xl text-sm shadow-lg shadow-amber-500/20 transition-all hover:scale-[1.02]"
            >
              <Save className="w-4 h-4" />
              Mentés
            </button>
          </div>
        </div>
      </div>

      {/* Role Selection Tabs */}
      <div className="flex items-center gap-4 border-b border-slate-800 pb-4">
        <button
          onClick={() => handleRoleChange('editor')}
          className={`flex items-center gap-3 px-6 py-3 rounded-xl font-semibold text-sm transition-all ${
            selectedRole === 'editor'
              ? 'bg-amber-500/15 border border-amber-500/40 text-amber-400 shadow-md'
              : 'bg-slate-900/60 border border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
          }`}
        >
          <UserCheck className="w-5 h-5 text-amber-400" />
          <span>Szerkesztő Szerepkör</span>
          <span className="ml-2 text-xs bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full border border-slate-700">
            /szerkeszto
          </span>
        </button>

        <button
          onClick={() => handleRoleChange('partner')}
          className={`flex items-center gap-3 px-6 py-3 rounded-xl font-semibold text-sm transition-all ${
            selectedRole === 'partner'
              ? 'bg-blue-500/15 border border-blue-500/40 text-blue-400 shadow-md'
              : 'bg-slate-900/60 border border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
          }`}
        >
          <Briefcase className="w-5 h-5 text-blue-400" />
          <span>Partner Szerepkör</span>
          <span className="ml-2 text-xs bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full border border-slate-700">
            /partner
          </span>
        </button>
      </div>

      {/* Categorized Modules List */}
      <div className="space-y-8">
        {categories.map((catName) => {
          const categoryModules = SYSTEM_MODULES.filter((m) => m.category === catName);

          return (
            <div key={catName} className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden shadow-lg">
              {/* Category Header */}
              <div className="bg-slate-800/50 px-6 py-4 border-b border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Shield className="w-5 h-5 text-amber-400" />
                  <h2 className="text-lg font-bold text-white">{catName}</h2>
                </div>

                {!categoryModules.every((m) => m.isAdminOnly) && (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleBulkCategoryToggle(catName, true)}
                      className="text-xs bg-emerald-950/60 hover:bg-emerald-900/80 text-emerald-400 border border-emerald-800/60 px-3 py-1.5 rounded-lg transition-colors"
                    >
                      Kategória engedélyezése
                    </button>
                    <button
                      onClick={() => handleBulkCategoryToggle(catName, false)}
                      className="text-xs bg-rose-950/60 hover:bg-rose-900/80 text-rose-400 border border-rose-800/60 px-3 py-1.5 rounded-lg transition-colors"
                    >
                      Kategória tiltása
                    </button>
                  </div>
                )}
              </div>

              {/* Modules Table / Grid */}
              <div className="divide-y divide-slate-800/60">
                {categoryModules.map((mod) => {
                  if (mod.isAdminOnly) {
                    return (
                      <div key={mod.id} className="p-6 bg-slate-950/40 opacity-75 flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                          <Lock className="w-5 h-5 text-slate-500" />
                          <div>
                            <span className="font-semibold text-slate-300">{mod.name}</span>
                            <p className="text-xs text-slate-500">Rendszerigazgatási modul</p>
                          </div>
                        </div>

                        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-amber-950/40 border border-amber-800/50 text-amber-400 text-xs font-medium">
                          <AlertTriangle className="w-4 h-4" />
                          Kizárólag Adminisztrátor által kezelhető
                        </div>
                      </div>
                    );
                  }

                  const currentModPerms = permissions[mod.id] || {
                    view: false,
                    create: false,
                    edit: false,
                    submit: false,
                    publish: false,
                    delete: false,
                  };

                  const actions: Array<{ key: keyof ModuleActionPermissions; label: string }> = [
                    { key: 'view', label: 'Megtekintés' },
                    { key: 'create', label: 'Létrehozás' },
                    { key: 'edit', label: 'Szerkesztés' },
                    { key: 'submit', label: 'Beküldés' },
                    { key: 'publish', label: 'Publikálás' },
                    { key: 'delete', label: 'Törlés' },
                  ];

                  return (
                    <div key={mod.id} className="p-6 hover:bg-slate-800/30 transition-colors flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                      <div className="space-y-1 lg:w-1/3">
                        <h3 className="font-semibold text-white text-base">{mod.name}</h3>
                        <p className="text-xs text-slate-400 font-mono">Modul kulcs: {mod.id}</p>
                      </div>

                      {/* Action Toggles */}
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3 lg:w-2/3">
                        {actions.map(({ key, label }) => {
                          const isChecked = currentModPerms[key];
                          return (
                            <button
                              key={key}
                              type="button"
                              onClick={() => handlePermissionToggle(mod.id, key)}
                              className={`flex items-center gap-2 p-2.5 rounded-xl border text-xs font-medium transition-all ${
                                isChecked
                                  ? 'bg-amber-500/10 border-amber-500/40 text-amber-300'
                                  : 'bg-slate-900 border-slate-800 text-slate-500 hover:border-slate-700 hover:text-slate-400'
                              }`}
                            >
                              {isChecked ? (
                                <CheckSquare className="w-4 h-4 text-amber-400 shrink-0" />
                              ) : (
                                <Square className="w-4 h-4 text-slate-600 shrink-0" />
                              )}
                              <span className="truncate">{label}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Save Bottom Bar */}
      <div className="sticky bottom-6 bg-slate-900/90 border border-slate-800 p-4 rounded-2xl shadow-2xl backdrop-blur-md flex items-center justify-between">
        <p className="text-xs text-slate-400">
          A beállított jogosultságok azonnal életbe lépnek a(z){' '}
          <strong className="text-amber-400 font-semibold">
            {selectedRole === 'editor' ? 'Szerkesztő' : 'Partner'}
          </strong>{' '}
          felhasználók számára.
        </p>

        <button
          onClick={handleSave}
          className="flex items-center gap-2 px-6 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold rounded-xl text-sm transition-all shadow-lg shadow-amber-500/20"
        >
          <Save className="w-4 h-4" />
          Mentés Most
        </button>
      </div>
    </div>
  );
}
