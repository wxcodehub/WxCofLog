import React from 'react';
import { motion } from 'motion/react';
import { Package, TrendingUp, History } from 'lucide-react';
import { cn } from '../lib/utils';
import { InventoryItem } from '../types';

interface SalesHistoryProps {
  salesHistory: any[];
  inventory: InventoryItem[];
}

export const SalesHistory: React.FC<SalesHistoryProps> = ({
  salesHistory,
  inventory
}) => {
  return (
    <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="space-y-8 pb-20">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 text-center md:text-left">
        <div>
          <h2 className="text-4xl font-black text-stone-100 uppercase tracking-tighter">Riwayat <span className="text-amber-500">Penjualan.</span></h2>
          <p className="text-stone-600 text-[10px] font-black uppercase tracking-widest md:tracking-[0.4em] mt-2">Log Transaksi & Penjualan</p>
        </div>
      </div>

      <div className="bento-card bg-stone-900 border-stone-800">
        <div className="flex items-center gap-3 mb-6">
           <div className="w-10 h-10 rounded-xl bg-amber-500 flex items-center justify-center shrink-0">
              <History className="w-5 h-5 text-stone-950 fill-current" />
           </div>
           <h3 className="bento-label !mb-0 text-stone-100 min-w-0 flex-1">Catatan Penjualan</h3>
        </div>

        <div className="space-y-4">
          {salesHistory.length === 0 ? (
            <div className="p-8 text-center border-2 border-dashed border-stone-800 rounded-2xl">
              <p className="text-stone-500 font-bold uppercase text-xs tracking-widest">Belum ada riwayat penjualan.</p>
            </div>
          ) : (
            salesHistory.map(sale => {
              const saleDate = sale.timestamp?.toDate ? sale.timestamp.toDate() : new Date(sale.timestamp);
              // Handle old vs new sale items format
              const isArrayFormat = Array.isArray(sale.items);
              
              return (
                <div key={sale.id} className="p-5 bg-stone-950 border border-stone-800/80 rounded-2xl flex flex-col gap-4 group hover:border-amber-500/30 transition-colors">
                  <div className="flex items-center justify-between border-b border-stone-800/80 pb-4">
                    <p className="text-[10px] text-stone-400 font-black uppercase tracking-[0.2em]">{saleDate.toLocaleString()}</p>
                    <p className="text-xs font-black text-amber-500 uppercase tracking-widest">Transaksi #{sale.id.substring(0, 6)}</p>
                  </div>
                  <div className="space-y-2">
                    {isArrayFormat ? (
                      sale.items.map((item: any, idx: number) => {
                        const invItem = inventory.find(i => i.id === item.itemId);
                        return (
                          <div key={idx} className="flex justify-between items-center text-sm font-bold">
                            <span className="text-stone-300 uppercase tracking-tight">{invItem?.item || 'Item Terhapus'}</span>
                            <span className="text-stone-500">{item.qty} {invItem?.unit || 'x'}</span>
                          </div>
                        );
                      })
                    ) : (
                      Object.entries(sale.items || {}).map(([itemId, qty]) => {
                        const invItem = inventory.find(i => i.id === itemId);
                        return (
                          <div key={itemId} className="flex justify-between items-center text-sm font-bold">
                            <span className="text-stone-300 uppercase tracking-tight">{invItem?.item || 'Item Terhapus'}</span>
                            <span className="text-stone-500">{Number(qty)} {invItem?.unit || 'x'}</span>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </motion.div>
  );
};
