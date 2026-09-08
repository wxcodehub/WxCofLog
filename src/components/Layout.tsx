/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { LayoutDashboard, Package, ShoppingCart, TrendingUp, Menu, LogOut, Users, X, History } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { cn } from '../lib/utils';
import { AnimatePresence, motion } from 'motion/react';

interface SidebarProps {
  className?: string;
  onLogout?: () => void;
  role?: string;
  onClose?: () => void;
}

const Sidebar = ({ className, onLogout, role, onClose }: SidebarProps) => {
  const allLinks = [
    { icon: LayoutDashboard, label: 'Overview', id: 'overview', path: '/overview' },
    { icon: Package, label: 'Inventory', id: 'inventory', path: '/inventory' },
    { icon: TrendingUp, label: 'Forecasting', id: 'forecasting', path: '/forecasting' },
    { icon: Users, label: 'Team', id: 'team', path: '/team' },
    { icon: ShoppingCart, label: 'Restock AI', id: 'restock', path: '/restock' },
    { icon: History, label: 'Riwayat Penjualan', id: 'sales-history', path: '/sales-history' },
  ];

  const links = role === 'staff' 
    ? allLinks.filter(l => ['overview', 'inventory'].includes(l.id))
    : allLinks;

  return (
    <aside className={cn("w-72 bg-black text-stone-100 h-screen flex flex-col border-r border-stone-900 relative", className)}>
      {onClose && (
        <button onClick={onClose} className="absolute top-8 right-8 p-2 text-stone-500 hover:text-stone-300 xl:hidden">
          <X className="w-5 h-5" />
        </button>
      )}
      <div className="p-10 pb-6">
        <h1 className="text-4xl font-black tracking-tighter text-amber-500 italic">WxCofLog<span className="text-white">.</span></h1>
        <p className="text-stone-700 text-[9px] font-black uppercase tracking-widest md:tracking-[0.4em] mt-2">Neural Supply Chain</p>
      </div>
      
      <nav className="flex-1 px-6 py-10 space-y-2">
        {links.map((link) => (
          <NavLink
            key={link.id}
            to={link.path}
            onClick={onClose}
            className={({ isActive }) => cn(
              "w-full flex items-center gap-4 px-5 py-4 rounded-2xl transition-all text-[11px] font-black uppercase tracking-widest group",
              isActive 
                ? "bg-amber-500 text-black shadow-[0_0_30px_rgba(245,158,11,0.15)]" 
                : "text-stone-600 hover:bg-stone-900/50 hover:text-stone-300"
            )}
          >
            <link.icon className={cn("w-4 h-4")} />
            {link.label}
          </NavLink>
        ))}
      </nav>

      <div className="p-6">
        <button 
          onClick={() => {
            if (onLogout) onLogout();
            if (onClose) onClose();
          }}
          className="w-full flex items-center gap-4 px-5 py-4 rounded-2xl transition-all text-[11px] font-black uppercase tracking-widest text-stone-600 hover:bg-red-500/10 hover:text-red-500 group border border-transparent hover:border-red-500/20"
        >
          <LogOut className="w-4 h-4 text-stone-700 group-hover:text-red-500 transition-colors" />
          Terminate Session
        </button>
      </div>
    </aside>
  );
};

export const Layout = ({ 
  children, 
  onLogout, 
  role,
  shopName,
  userName
}: { 
  children: React.ReactNode, 
  onLogout?: () => void, 
  role?: string | null,
  shopName?: string | null,
  userName?: string | null
}) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden bg-stone-950 selection:bg-amber-500 selection:text-stone-950">
      {/* Desktop Sidebar */}
      <Sidebar className="hidden xl:flex" onLogout={onLogout} role={role || undefined} />
      
      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileMenuOpen(false)}
              className="fixed inset-0 bg-stone-950/80 backdrop-blur-sm z-40 xl:hidden"
            />
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed inset-y-0 left-0 z-50 xl:hidden"
            >
              <Sidebar 
                onLogout={onLogout} 
                role={role || undefined} 
                onClose={() => setIsMobileMenuOpen(false)} 
              />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <main className="flex-1 flex flex-col min-w-0 h-full">
        <header className="h-20 md:h-24 border-b border-stone-900 bg-stone-950/80 backdrop-blur-xl px-4 md:px-10 flex items-center justify-between sticky top-0 z-30 shrink-0">
          <div className="flex items-center gap-4 md:gap-6 xl:hidden">
            <button 
              onClick={() => setIsMobileMenuOpen(true)}
              className="p-2.5 md:p-3 bg-stone-900 rounded-xl text-stone-400 hover:text-stone-100 transition-colors"
            >
              <Menu className="w-5 h-5" />
            </button>

            <h1 className="text-xl md:text-2xl font-black text-amber-500 italic tracking-tighter">WxCofLog.</h1>
          </div>
          <div className="hidden xl:flex items-center gap-4">
            <div className="h-10 w-1 bg-amber-500 rounded-full" />
            <div>
              <div className="text-[10px] font-black text-stone-600 uppercase tracking-[0.3em]">{shopName || 'Connecting Node...'}</div>
              <div className="text-xl font-black font-mono tracking-tighter text-stone-200">
                {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-4 md:gap-8 min-w-0">
            <div className="flex flex-col items-end hidden lg:flex">
                <span className="text-xs font-black text-stone-100 uppercase tracking-widest">{userName || 'Syncing Profile...'}</span>
                <span className="text-[9px] text-stone-600 uppercase font-black tracking-widest mt-1">Authorized Access • Pos: {role || 'Standby'}</span>
            </div>
            <div className="flex items-center gap-4 shrink-0">
              <div className="w-10 h-10 md:w-12 md:h-12 rounded-2xl bg-gradient-to-br from-amber-500 to-amber-600 p-[1px]">
                 <div className="w-full h-full rounded-2xl bg-stone-950 flex items-center justify-center text-xs font-black text-amber-500 uppercase">
                    {userName ? userName.substring(0, 2).toUpperCase() : '??'}
                 </div>
              </div>
            </div>
          </div>
        </header>
        <div className="p-4 sm:p-6 md:p-8 lg:p-12 xl:p-16 pb-32 md:pb-12 xl:pb-16 flex-1 overflow-x-hidden overflow-y-auto custom-scrollbar">
          <div className="max-w-7xl mx-auto w-full">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
};
