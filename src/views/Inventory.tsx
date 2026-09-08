
import React from 'react';
import { motion } from 'motion/react';
import { 
  Search, 
  Plus, 
  Filter, 
  Package 
} from 'lucide-react';
import { cn } from '../lib/utils';
import { AssistantAnalysisResponse, InventoryItem } from '../types';
import { calculateItemMetrics } from '../utils/itemStatus';

interface InventoryProps {
  filteredInventory: InventoryItem[];
  inventorySearch: string;
  setInventorySearch: (s: string) => void;
  inventoryFilter: string;
  setInventoryFilter: (f: string) => void;
  inventorySort: string;
  setInventorySort: (s: any) => void;
  lowStockOnly: boolean;
  setLowStockOnly: (l: boolean) => void;
  categories: string[];
  userProfile: any;
  setShowAddItemModal: (show: boolean) => void;
  setSelectedItemAnalytics: (item: InventoryItem | null) => void;
  analysis: AssistantAnalysisResponse | null;
  salesHistory?: any[];
}

export const Inventory: React.FC<InventoryProps> = ({
  filteredInventory,
  inventorySearch,
  setInventorySearch,
  inventoryFilter,
  setInventoryFilter,
  inventorySort,
  setInventorySort,
  lowStockOnly,
  setLowStockOnly,
  categories,
  userProfile,
  setShowAddItemModal,
  setSelectedItemAnalytics,
  analysis,
  salesHistory = []
}) => {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-8 pb-20">
      <div className="flex flex-col md:flex-row justify-between items-center md:items-center gap-6 text-center md:text-left">
        <div>
          <h2 className="text-4xl font-black text-stone-100 uppercase tracking-tighter">Brankas <span className="text-amber-500">Stok.</span></h2>
          <div className="flex items-center justify-center md:justify-start gap-2 mt-2">
            <p className="text-stone-600 text-[10px] font-black uppercase tracking-widest md:tracking-[0.4em]">Manajemen Stok Lengkap</p>
            <div className="w-1 h-1 rounded-full bg-stone-800" />
            <p className="text-amber-500/50 text-[10px] font-black uppercase tracking-widest md:tracking-[0.4em]">{filteredInventory.length} Item ditemukan</p>
          </div>
        </div>
        <div className="flex items-center gap-4 w-full md:w-auto">
           <div className="relative flex-1 md:w-64">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-600" />
              <input 
                type="text" 
                placeholder="Cari barang..." 
                className="w-full bg-stone-900 border border-stone-800 rounded-2xl py-3 pl-12 pr-4 text-xs font-bold text-stone-100 focus:border-amber-500 outline-none transition-colors"
                value={inventorySearch}
                onChange={(e) => setInventorySearch(e.target.value)}
              />
           </div>
           {userProfile?.role !== 'staff' && (
             <button 
              onClick={() => setShowAddItemModal(true)}
              className="p-3.5 bg-amber-500 text-stone-950 rounded-2xl flex items-center gap-2 font-black uppercase text-[10px] tracking-widest shadow-lg shadow-amber-500/10 hover:scale-105 transition-transform"
             >
               <Plus className="w-4 h-4" /> Item Baru
             </button>
           )}
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-6 items-center">
        <div className="flex gap-4 overflow-x-auto pb-4 md:pb-0 custom-scrollbar flex-1 w-full">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setInventoryFilter(cat)}
              className={cn(
                "px-6 py-3 rounded-full text-[10px] font-black uppercase tracking-widest border transition-all whitespace-nowrap",
                inventoryFilter === cat 
                  ? "bg-amber-500 border-amber-500 text-stone-950" 
                  : "bg-stone-950 border-stone-800 text-stone-500 hover:text-stone-100"
              )}
            >
              {cat}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-4 w-full md:w-auto bg-stone-900/50 p-2 rounded-2xl border border-stone-800/50">
          <div className="flex items-center gap-2 px-3">
            <Filter className="w-3.5 h-3.5 text-stone-600" />
            <span className="text-[10px] font-black uppercase text-stone-600">Sort</span>
          </div>
          <select 
            className="bg-transparent text-[10px] font-black uppercase text-stone-400 outline-none pr-4"
            value={inventorySort}
            onChange={(e) => setInventorySort(e.target.value as any)}
          >
            <option value="name">Alpha</option>
            <option value="stock">Stock</option>
            <option value="expiry">Expiry</option>
          </select>
          <div className="w-px h-4 bg-stone-800" />
          <label className="flex items-center gap-2 cursor-pointer px-4">
            <input 
              type="checkbox" 
              className="hidden" 
              checked={lowStockOnly} 
              onChange={e => setLowStockOnly(e.target.checked)}
            />
            <div className={cn(
              "w-3 h-3 rounded-sm border transition-all",
              lowStockOnly ? "bg-amber-500 border-amber-500" : "border-stone-700"
            )} />
            <span className={cn(
              "text-[10px] font-black uppercase transition-colors",
              lowStockOnly ? "text-amber-500" : "text-stone-600"
            )}>Low Stock</span>
          </label>
        </div>
      </div>

      <div className="flex flex-col">
        <div className="hidden lg:grid grid-cols-12 gap-6 px-6 py-4 border-b border-stone-800/50 text-[9px] font-black tracking-widest text-stone-500 uppercase mb-4">
          <div className="col-span-5">Barang / SKU</div>
          <div className="col-span-2 text-right">Stok Saat Ini</div>
          <div className="col-span-2 text-right">Laju Pakai (14D)</div>
          <div className="col-span-3 pl-8">Status & Proyeksi AI</div>
        </div>
        <div className="space-y-3">
        {filteredInventory.map(item => {
          const itemAnalysis = analysis?.analysis?.find(a => a.item.toLowerCase() === item.item.toLowerCase());
          const metrics = calculateItemMetrics(item, salesHistory, itemAnalysis);

          const isValidExpDate = item.exp_date && !isNaN(new Date(item.exp_date).getTime());

          return (
           <div key={item.id} onClick={() => setSelectedItemAnalytics(item)} className="flex flex-col lg:grid lg:grid-cols-12 gap-4 lg:gap-6 lg:items-center px-5 lg:px-6 py-5 bg-stone-900/30 rounded-2xl border border-transparent hover:border-stone-800 transition-all cursor-pointer group">
             <div className="lg:col-span-5 flex items-start lg:items-center gap-4 lg:gap-5">
               <div className="w-11 h-11 rounded-lg bg-stone-800/50 border border-stone-800 flex items-center justify-center shrink-0 group-hover:bg-amber-500/10 transition-colors">
                 <Package className="w-4 h-4 text-stone-500 group-hover:text-amber-500" />
               </div>
               <div>
                 <h4 className="text-sm font-black text-stone-200 tracking-widest uppercase">{item.item}</h4>
                 <div className="text-[9px] font-black text-stone-500 uppercase tracking-widest mt-1.5 flex items-center gap-2 flex-wrap">
                   <span>{item.category}</span>
                   <span className="w-1 h-1 rounded-full bg-stone-800 mx-1"></span>
                   <span className="text-stone-600">Batas Aman: {item.minStock || 0} {item.unit}</span>
                   {['Beans', 'Milk', 'Syrup'].includes(item.category) && isValidExpDate && (
                     <>
                       <span className="w-1 h-1 rounded-full bg-stone-800 mx-1"></span>
                       <span className="text-stone-600">EXP: {new Date(item.exp_date).toLocaleDateString('id-ID', {day: 'numeric', month: 'short', year: 'numeric'})}</span>
                     </>
                   )}
                 </div>
               </div>
             </div>
             
             <div className="flex flex-row justify-between lg:col-span-4 lg:grid lg:grid-cols-4 lg:gap-6 w-full mt-2 lg:mt-0 pt-3 lg:pt-0 border-t border-stone-800/30 lg:border-t-0">
               <div className="flex flex-col lg:col-span-2 lg:text-right">
                 <span className="text-[9px] lg:hidden text-stone-500 font-bold uppercase mb-1">Stok Saat Ini</span>
                 <div className="inline-flex items-baseline gap-1.5 lg:justify-end">
                   <span className={cn("text-lg font-black", metrics.isCritical ? "text-red-500" : metrics.isWarning ? "text-amber-500" : "text-stone-200")}>{item.stock}</span>
                   <span className="text-[10px] text-stone-500 font-bold ml-1">{item.unit.toUpperCase()}</span>
                 </div>
               </div>
               <div className="flex flex-col lg:col-span-2 lg:text-right">
                 <span className="text-[9px] lg:hidden text-stone-500 font-bold uppercase mb-1">Laju Pakai</span>
                 <div className="inline-flex items-baseline gap-1.5 lg:justify-end">
                   <span className="text-sm font-black text-stone-200">{metrics.avgDailyUsage}</span>
                   <span className="text-[9px] text-stone-500 font-bold ml-1">{item.unit.toUpperCase()}/HARI</span>
                 </div>
               </div>
             </div>

              <div className="lg:col-span-3 lg:pl-8 flex justify-between items-center pr-2 mt-2 lg:mt-0">
               <div className="w-full">
                  <div className={cn(
                    "inline-flex items-center px-2 py-1.5 rounded-md border uppercase tracking-widest text-[8px] font-black mb-1.5",
                    metrics.badgeClass
                  )}>
                    <span className={cn("w-1.5 h-1.5 rounded-full mr-2", metrics.dotClass)}></span>
                    {metrics.badgeLabel}
                  </div>
                  <div className="mt-2">
                    <div className="text-[9px] font-bold text-stone-500 tracking-wide mb-1.5 flex justify-between">
                      <span>
                        {metrics.isCritical ? 'Di bawah batas kritis' : 
                         metrics.isWarning ? `Sisa ${metrics.depletionDaysStr} hari pemakaian` : 
                         'Stok dalam batas aman'}
                      </span>
                      <span className="text-stone-600 uppercase">{item.stock} {item.unit}</span>
                    </div>
                    <div className="w-full max-w-[12rem] lg:w-48 h-1 bg-stone-800 rounded-full overflow-hidden">
                      <div 
                        className={cn(
                          "h-full rounded-full transition-all duration-700 ease-in-out",
                          metrics.progressClass
                        )} 
                        style={{ width: `${Math.max(2, Math.min(100, (item.stock / (item.minStock || Math.max(item.stock, 1))) * 100))}%` }}
                      />
                    </div>
                  </div>
               </div>
              </div>
           </div>
          );
        })}
        </div>
      </div>
    </motion.div>
  );
};
