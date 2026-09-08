
import React, { useState } from 'react';
import { Copy, RefreshCcw, UserMinus, Trash2, AlertTriangle, X } from 'lucide-react';
import { cn } from '../lib/utils';
import { doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../services/firebase';
import { motion, AnimatePresence } from 'motion/react';

interface TeamProps {
  teamMembers: any[];
  userProfile: any;
  shopData: any;
  loading: boolean;
  user: any;
  copyToClipboard: (text: string) => void;
  handleRefreshJoinCode: () => void;
  showToast: (message: string) => void;
}

export const Team: React.FC<TeamProps> = ({
  teamMembers,
  userProfile,
  shopData,
  loading,
  user,
  copyToClipboard,
  handleRefreshJoinCode,
  showToast
}) => {
  const [confirmConfig, setConfirmConfig] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    actionLabel: string;
    onConfirm: () => void;
    isDanger?: boolean;
  } | null>(null);

  const confirmRemoveMember = (member: any) => {
    setConfirmConfig({
      isOpen: true,
      title: "Keluarkan Anggota",
      message: `Apakah Anda yakin ingin mengeluarkan ${member.displayName || member.email} dari kedai ini?`,
      actionLabel: "Keluarkan",
      isDanger: true,
      onConfirm: async () => {
        try {
          await updateDoc(doc(db, `users/${member.id}`), {
            currentShopId: null,
            role: null
          });
          showToast(`${member.displayName || member.email} telah dikeluarkan.`);
        } catch (error) {
          console.error("Remove member failed:", error);
          showToast("Gagal mengeluarkan anggota.");
        }
        setConfirmConfig(null);
      }
    });
  };

  const confirmDeleteShop = () => {
    setConfirmConfig({
      isOpen: true,
      title: "Hapus Kedai",
      message: "PERINGATAN: Menghapus kedai ini bersifat permanen dan tidak dapat dibatalkan. Semua anggota tim akan dikeluarkan otomatis. Lanjutkan?",
      actionLabel: "Hapus Permanen",
      isDanger: true,
      onConfirm: async () => {
        try {
          await deleteDoc(doc(db, `shops/${shopData.id}`));
          showToast("Kedai berhasil dihapus.");
        } catch (error) {
          console.error("Delete shop failed:", error);
          showToast("Gagal menghapus kedai.");
        }
        setConfirmConfig(null);
      }
    });
  };

  return (
    <div className="space-y-8 pb-20">
      <div className="flex flex-col md:flex-row md:justify-between items-center md:items-end gap-6 text-center md:text-left">
        <div>
          <h2 className="text-4xl font-black text-stone-100 italic tracking-tighter uppercase leading-none mb-4">Team<span className="text-amber-500">_Nodes</span></h2>
          <p className="text-stone-500 text-[10px] font-black uppercase tracking-widest leading-relaxed">Manage access roles for shop personnel</p>
        </div>
        {userProfile?.role === 'owner' && (
          <div className="bg-stone-900 border border-stone-800 p-4 rounded-2xl flex flex-wrap md:flex-nowrap items-center justify-center gap-4 md:gap-6 w-full md:w-auto">
            <div className="flex-1 md:flex-none">
              <p className="text-[8px] font-black text-stone-600 uppercase tracking-widest mb-1">Join Code</p>
              <p className="text-lg font-black font-mono text-amber-500">{shopData?.joinCode || '------'}</p>
            </div>
            <div className="flex gap-2">
              <button 
                onClick={() => copyToClipboard(shopData?.joinCode)}
                className="p-3 bg-stone-950 border border-stone-800 rounded-xl text-stone-400 hover:text-amber-500 transition-colors flex items-center justify-center gap-2"
                title="Copy Code"
              >
                <Copy className="w-4 h-4" />
              </button>
              <button 
                onClick={handleRefreshJoinCode}
                disabled={loading}
                className="p-3 bg-stone-950 border border-stone-800 rounded-xl text-stone-400 hover:text-amber-500 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                title="Refresh Code"
              >
                <RefreshCcw className={cn("w-4 h-4", loading && "animate-spin")} />
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {teamMembers.sort((a, b) => (b.role === 'owner' ? 1 : -1)).map((member) => (
          <div key={member.id} className="bg-stone-900/40 border border-stone-800/50 p-6 rounded-[2.5rem] relative overflow-hidden group hover:border-amber-500/30 transition-all">
            <div className="flex items-center gap-4 mb-6">
              <div className={cn(
                "w-12 h-12 rounded-2xl border flex items-center justify-center font-black transition-colors",
                member.role === 'owner' ? "bg-amber-500/10 border-amber-500/30 text-amber-500" : "bg-stone-950 border-stone-800 text-stone-500"
              )}>
                {member.displayName?.charAt(0) || member.email?.charAt(0) || '?'}
              </div>
              <div className="min-w-0">
                <h4 className="text-xs font-black text-stone-100 uppercase truncate">
                  {member.displayName || member.email?.split('@')[0] || 'Unknown User'}
                </h4>
                <p className="text-[10px] text-stone-600 font-bold leading-tight truncate">
                  {member.email}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between pt-6 border-t border-stone-800/50">
              <div className="flex flex-col">
                <span className="text-[8px] font-black text-stone-700 uppercase tracking-widest mb-1">Current Role</span>
                <span className={cn(
                  "text-[10px] font-black uppercase tracking-tighter italic",
                  member.role === 'owner' ? "text-amber-500" : member.role === 'manager' ? "text-stone-100" : "text-stone-500"
                )}>
                  {member.role || 'Unassigned'}
                </span>
              </div>
              
              {userProfile?.role === 'owner' && member.uid !== user?.uid && (
                <div className="flex gap-2">
                  <select 
                    className="bg-stone-950 border border-stone-800 rounded-lg px-3 py-1.5 text-[10px] font-black text-stone-400 outline-none"
                    value={member.role || 'staff'}
                    onChange={async (e) => {
                      const newRole = e.target.value;
                      try {
                        await updateDoc(doc(db, `users/${member.id}`), { role: newRole });
                        showToast(`Role updated for ${member.displayName || member.email}`);
                      } catch (error) {
                        console.error("Update role failed:", error);
                        showToast("Gagal update role.");
                      }
                    }}
                  >
                    <option value="staff">Staff</option>
                    <option value="manager">Manager</option>
                  </select>
                  <button
                    onClick={() => confirmRemoveMember(member)}
                    className="p-1.5 bg-stone-950 border border-stone-800 rounded-lg text-stone-500 hover:text-red-500 hover:border-red-500/50 transition-colors"
                    title="Remove User"
                  >
                    <UserMinus className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>

            <div className="absolute -right-2 -bottom-2 text-2xl text-stone-800/10 font-black italic group-hover:text-amber-500/5 transition-colors uppercase">
              {member.role}
            </div>
          </div>
        ))}
      </div>

      {userProfile?.role === 'owner' && shopData && (
        <div className="mt-12 pt-12 border-t border-stone-800/50">
          <div className="bg-red-500/5 border border-red-500/20 rounded-[2rem] p-8 max-w-2xl">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-red-500/10 rounded-2xl">
                <AlertTriangle className="w-6 h-6 text-red-500" />
              </div>
              <div>
                <h3 className="text-lg font-black text-red-500 uppercase tracking-tight mb-2">Danger Zone</h3>
                <p className="text-stone-400 text-xs leading-relaxed mb-6">
                  Menghapus kedai ini bersifat permanen. Semua data kedai akan dihentikan operasionalnya, dan seluruh anggota tim akan dikeluarkan secara otomatis. Anda dapat membuat kedai baru setelahnya.
                </p>
                <button 
                  onClick={confirmDeleteShop}
                  className="px-6 py-3 bg-red-500 hover:bg-red-600 text-white text-[10px] font-black uppercase tracking-widest rounded-xl transition-colors flex items-center gap-2 shadow-lg shadow-red-500/20"
                >
                  <Trash2 className="w-4 h-4" />
                  Hapus Kedai (Delete Shop)
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      <AnimatePresence>
        {confirmConfig?.isOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setConfirmConfig(null)}
              className="absolute inset-0 bg-stone-950/80 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative bg-stone-900 border border-stone-800 rounded-[2rem] p-8 max-w-md w-full shadow-2xl overflow-hidden"
            >
              {/* Decorative Background */}
              {confirmConfig.isDanger && (
                 <div className="absolute top-0 inset-x-0 h-1 bg-red-500 shadow-[0_0_20px_rgba(239,68,68,0.5)]" />
              )}
              
              <div className="flex justify-between items-start mb-6">
                <h3 className="text-xl font-black uppercase tracking-tighter text-stone-100">
                  {confirmConfig.title}
                </h3>
                <button 
                  onClick={() => setConfirmConfig(null)}
                  className="text-stone-500 hover:text-stone-300 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <p className="text-stone-400 text-sm mb-8 leading-relaxed">
                {confirmConfig.message}
              </p>

              <div className="flex gap-3 justify-end">
                <button 
                  onClick={() => setConfirmConfig(null)}
                  className="px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest text-stone-400 hover:bg-stone-800 transition-colors"
                >
                  Batal
                </button>
                <button 
                  onClick={confirmConfig.onConfirm}
                  className={cn(
                    "px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-colors flex items-center gap-2",
                    confirmConfig.isDanger 
                      ? "bg-red-500 hover:bg-red-600 text-white shadow-lg shadow-red-500/20" 
                      : "bg-amber-500 hover:bg-amber-400 text-stone-950 shadow-lg shadow-amber-500/20"
                  )}
                >
                  {confirmConfig.actionLabel}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
