
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ShoppingBag, 
  RefreshCcw, 
  Zap, 
  ArrowRight,
  Plus,
  X,
  History
} from 'lucide-react';
import { cn } from '../lib/utils';
import { AssistantAnalysisResponse, InventoryItem } from '../types';

interface RestockAIProps {
  analysis: AssistantAnalysisResponse | null;
  handleManualOrder: () => void;
  rejectedRestockItems: string[];
  setRejectedRestockItems: React.Dispatch<React.SetStateAction<string[]>>;
  inventory: InventoryItem[];
  restockHistory: any[];
}

export const RestockAI: React.FC<RestockAIProps> = ({
  analysis,
  handleManualOrder,
  rejectedRestockItems,
  setRejectedRestockItems,
  inventory,
  restockHistory
}) => {
  const [showHistory, setShowHistory] = useState(false);

  return (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-8">
      <div className="flex flex-col md:flex-row md:justify-between items-center md:items-end gap-6 text-center md:text-left">
        <div>
          <h2 className="text-4xl font-black text-stone-100 uppercase tracking-tighter">Belanja <span className="text-amber-500">Pintar AI.</span></h2>
          <p className="text-stone-600 text-[10px] font-black uppercase tracking-widest md:tracking-[0.4em] mt-2">Daftar belanja otomatis berbasis AI</p>
        </div>
        <div className="flex flex-wrap sm:flex-nowrap justify-center gap-4 w-full md:w-auto">
           <button onClick={() => setShowHistory(!showHistory)} className={cn("flex-1 md:flex-none px-4 md:px-8 py-4 bg-stone-900 border border-stone-800 rounded-2xl font-black uppercase text-[10px] tracking-widest transition-colors", showHistory ? "text-amber-500 border-amber-500/50" : "text-stone-500 hover:text-stone-100")}>{showHistory ? 'Daftar Belanja' : 'Riwayat'}</button>
           {!showHistory && (
             <button onClick={handleManualOrder} className="flex-1 md:flex-none px-4 md:px-8 py-4 bg-amber-500 text-stone-950 rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl shadow-amber-500/20 hover:scale-105 transition-transform">Masukan Ke Stok</button>
           )}
        </div>
      </div>

      <AnimatePresence mode="wait">
        {!showHistory ? (
          <motion.div key="list" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="grid grid-cols-12 gap-8 pb-20">
             <div className="col-span-12 lg:col-span-7 min-w-0">
               <div className="bg-stone-950 border border-stone-800 rounded-[2.5rem] overflow-hidden">
                  <div className="p-6 md:p-8 border-b border-stone-800 flex flex-col md:flex-row md:justify-between items-start md:items-center gap-4 md:gap-2 bg-stone-900/30">
                     <h4 className="text-[11px] font-black uppercase text-stone-400 tracking-widest flex items-center gap-2">
                        <ShoppingBag className="w-3.5 h-3.5 border-none" /> Daftar Barang ({analysis?.shoppingList.length})
                     </h4>
                     <div className="text-[10px] font-black text-amber-500 uppercase">Estimasi Biaya: ~{((analysis?.shoppingList.reduce((acc, curr) => acc + (curr.quantity || 0), 0) || 0) * 15).toLocaleString()} Ribu Rupiah</div>
                  </div>
                  <div className="divide-y divide-stone-800">
                    {analysis?.shoppingList.map((shop, idx) => (
                      <motion.div 
                        initial={{ opacity: 0, y: 10 }} 
                        animate={{ opacity: 1, y: 0 }} 
                        transition={{ delay: idx * 0.05 }}
                        key={shop.item} 
                        className={cn("p-6 md:p-8 flex items-center justify-between gap-4 group hover:bg-stone-900/50 transition-all", rejectedRestockItems.includes(shop.item) && "opacity-50 grayscale")}
                      >
                        <div className="flex items-center gap-4 sm:gap-8 min-w-0">
                            <div className={cn("w-12 h-12 sm:w-14 sm:h-14 shrink-0 rounded-2xl flex items-center justify-center font-mono text-lg sm:text-xl font-black transition-transform", rejectedRestockItems.includes(shop.item) ? "bg-stone-800 text-stone-600" : "bg-stone-900 text-amber-500 group-hover:scale-110")}>
                              {shop.quantity}
                            </div>
                            <div className="min-w-0">
                              <h5 className={cn("text-lg sm:text-xl font-black uppercase tracking-tight transition-colors truncate", rejectedRestockItems.includes(shop.item) ? "text-stone-500 line-through" : "text-stone-100 group-hover:text-amber-500")}>{shop.item}</h5>
                              <div className="flex items-center gap-2 sm:gap-3 mt-1 flex-wrap">
                                 <p className="text-[9px] text-stone-600 font-bold uppercase tracking-widest italic whitespace-nowrap">{rejectedRestockItems.includes(shop.item) ? 'Ditolak' : 'Pesanan Baru'}</p>
                                 <div className="w-1 h-1 rounded-full bg-stone-800 shrink-0" />
                                 <p className="text-[9px] text-stone-600 font-bold uppercase tracking-widest whitespace-nowrap">{shop.unit}</p>
                              </div>
                            </div>
                        </div>
                        <button 
                          onClick={() => {
                            if (rejectedRestockItems.includes(shop.item)) {
                              setRejectedRestockItems(prev => prev.filter(i => i !== shop.item));
                            } else {
                              setRejectedRestockItems(prev => [...prev, shop.item]);
                            }
                          }}
                          className={cn(
                            "w-10 h-10 rounded-full border flex items-center justify-center transition-all",
                            rejectedRestockItems.includes(shop.item) 
                              ? "border-stone-800 hover:border-amber-500 hover:bg-amber-500 group-hover:border-stone-700" 
                              : "border-stone-800 hover:bg-red-500 hover:border-red-500 group-hover:border-stone-700"
                          )}>
                           {rejectedRestockItems.includes(shop.item) ? (
                             <Plus className="w-5 h-5 text-stone-700 group-hover:text-stone-100" />
                           ) : (
                             <X className="w-5 h-5 text-stone-700 group-hover:text-stone-950" />
                           )}
                        </button>
                      </motion.div>
                    ))}
                  </div>
               </div>
             </div>
             <div className="col-span-12 lg:col-span-5 space-y-8 min-w-0">
                <div className="bento-card bg-amber-500 border-none group relative overflow-hidden flex flex-col justify-between min-h-[300px]">
                   <div className="relative z-10">
                      <div className="flex justify-between items-start mb-10 gap-4">
                         <h3 className="bento-label !text-stone-950 !mb-0 opacity-80 min-w-0 flex-1">Rekomendasi AI Rantai Pasok</h3>
                         <Zap className="w-5 h-5 text-stone-950 fill-current shrink-0" />
                      </div>
                      <div className="space-y-6">
                         <div>
                            <div className="text-6xl font-black text-stone-950 tracking-tighter">{analysis?.recommendations.filter(r => r.type === 'Stock').length || 0} <span className="text-sm font-bold opacity-60">Saran</span></div>
                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-stone-950 mt-3 font-bold">Ide Tambah Stok Optimal</p>
                         </div>
                         <p className="text-xs font-bold text-stone-950 leading-relaxed uppercase tracking-tight opacity-70 border-t border-stone-950/20 pt-8">
                           {analysis?.recommendations.find(r => r.type === 'Stock')?.description || 'Semua stok produk saat ini masih aman dan optimal.'}
                         </p>
                      </div>
                   </div>
                   <RefreshCcw className="absolute -bottom-10 -right-10 text-[20rem] text-stone-950 opacity-5 font-black group-hover:rotate-45 transition-transform duration-1000" />
                </div>
                
                <div className="bento-card bg-stone-950 flex flex-col items-center justify-center text-center p-12 border-dashed border-stone-800">
                   <div className="w-20 h-20 rounded-[2.5rem] bg-stone-900 border border-stone-800 flex items-center justify-center mb-10 group cursor-pointer hover:border-amber-500/50 transition-all">
                      <RefreshCcw className="w-8 h-8 text-stone-600 animate-spin-slow group-hover:text-amber-500" />
                   </div>
                   <h4 className="text-stone-500 text-[10px] font-black uppercase tracking-widest md:tracking-[0.5em] text-center">Monitor Stok Kritis</h4>
                   <p className="text-[11px] text-stone-600 font-bold mt-6 uppercase tracking-tight leading-relaxed">
                      Rawan habis duluan: <span className="text-stone-100 italic">{analysis?.analysis.find(a => a.status === 'Critical')?.item || 'Tidak Ada'}</span>
                   </p>
                   <div className="mt-8 flex gap-2">
                      {[1, 2, 3, 4, 5].map(i => (
                        <div key={i} className="w-1 h-3 rounded-full bg-stone-800 animate-pulse" style={{ animationDelay: `${i * 0.1}s` }} />
                      ))}
                   </div>
                   <button onClick={handleManualOrder} className="mt-8 px-6 py-3 bg-stone-900 hover:bg-amber-500 text-stone-500 hover:text-stone-950 transition-colors uppercase font-black text-[10px] tracking-widest rounded-xl">
                     Force Restock Cycle
                   </button>
                </div>
             </div>
          </motion.div>
        ) : (
          <motion.div key="history" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="pb-20">
             <div className="bento-card bg-stone-900 border-stone-800">
               <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-amber-500 flex items-center justify-center shrink-0">
                     <History className="w-5 h-5 text-stone-950 fill-current" />
                  </div>
                  <h3 className="bento-label !mb-0 text-stone-100 min-w-0 flex-1">Riwayat Restock AI</h3>
               </div>

               <div className="space-y-4">
                 {restockHistory.length === 0 ? (
                   <div className="p-8 text-center border-2 border-dashed border-stone-800 rounded-2xl">
                     <p className="text-stone-500 font-bold uppercase text-xs tracking-widest">Belum ada riwayat restock.</p>
                   </div>
                 ) : (
                   restockHistory.map((restock, idx) => {
                     const dateStr = restock.timestamp?.toDate ? restock.timestamp.toDate().toLocaleString() : new Date(restock.timestamp).toLocaleString();
                     return (
                       <div key={idx} className="p-5 bg-stone-950 border border-stone-800/80 rounded-2xl flex flex-col gap-4 group hover:border-amber-500/30 transition-colors">
                         <div className="flex items-center justify-between border-b border-stone-800/80 pb-4">
                           <p className="text-[10px] text-stone-400 font-black uppercase tracking-[0.2em]">{dateStr}</p>
                           <p className="text-xs font-black text-amber-500 uppercase tracking-widest">Batch #{restock.id.substring(0, 6)}</p>
                         </div>
                         <div className="space-y-2">
                           {restock.items && restock.items.map((item: any, i: number) => (
                             <div key={i} className="flex justify-between items-center text-sm font-bold">
                               <span className="text-stone-300 uppercase tracking-tight">{item.item}</span>
                               <span className="text-stone-500">{item.qty} {item.unit}</span>
                             </div>
                           ))}
                         </div>
                       </div>
                     );
                   })
                 )}
               </div>
             </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
