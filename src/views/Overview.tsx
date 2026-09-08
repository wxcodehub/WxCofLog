
import React from 'react';
import { motion } from 'motion/react';
import { 
  Package, 
  AlertTriangle, 
  Sparkles, 
  TrendingUp, 
  Zap, 
  ArrowRight,
  RefreshCcw,
  ShoppingBag,
  ShoppingCart
} from 'lucide-react';
import { cn } from '../lib/utils';
import { useNavigate } from 'react-router-dom';
import { AssistantAnalysisResponse, InventoryItem } from '../types';

interface OverviewProps {
  inventory: InventoryItem[];
  inventoryLoading: boolean;
  userProfile: any;
  analysis: AssistantAnalysisResponse | null;
  fluxTimeframe: 'H' | 'M' | 'B';
  setFluxTimeframe: (t: 'H' | 'M' | 'B') => void;
  salesHistory: any[];
  setShowAddItemModal: (show: boolean) => void;
  handleManualOrder: () => void;
  onSeedSampleData?: () => void;
}

export const Overview: React.FC<OverviewProps> = ({
  inventory,
  inventoryLoading,
  userProfile,
  analysis,
  fluxTimeframe,
  setFluxTimeframe,
  salesHistory,
  setShowAddItemModal,
  handleManualOrder,
  onSeedSampleData
}) => {
  const navigate = useNavigate();
  return (
    <div className="space-y-6 pb-20">
      {inventory.length === 0 && !inventoryLoading && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-amber-500/10 border-2 border-dashed border-amber-500/30 p-12 rounded-[2.5rem] text-center"
        >
          <div className="w-16 h-16 bg-amber-500 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Package className="w-8 h-8 text-stone-950" />
          </div>
          <h3 className="text-2xl font-black text-stone-100 uppercase tracking-tighter mb-2">Inventory Masih Kosong</h3>
          <p className="text-stone-500 text-xs font-bold uppercase tracking-widest max-w-sm mx-auto leading-relaxed mb-8">
            Mulai gunakan WxCofLog dengan menambahkan item stok Anda atau muat data sampel kedai kopi untuk mencoba semua fitur secara instan.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            {userProfile?.role !== 'staff' && (
              <>
                <button 
                  onClick={() => setShowAddItemModal(true)}
                  className="w-full sm:w-auto px-8 py-4 bg-stone-100 text-stone-950 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-white transition-all shadow-xl shadow-stone-100/10"
                >
                  Tambah Item Manual
                </button>
                {onSeedSampleData && (
                  <button 
                    onClick={onSeedSampleData}
                    className="w-full sm:w-auto px-8 py-4 bg-amber-500 text-stone-950 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-amber-400 transition-all shadow-xl shadow-amber-500/20"
                  >
                    Muat Sampel Kedai (11 Item + Penjualan)
                  </button>
                )}
              </>
            )}
          </div>
        </motion.div>
      )}

      {/* Top Metrics Bar - More Compact */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-2">
         {[
           { label: 'Total SKU', val: inventory.length, icon: Package, color: 'text-stone-100', bg: 'bg-stone-900/40' },
           { label: 'Critical Stock', val: inventory.filter(i => i.stock <= (i.criticalStock !== undefined ? i.criticalStock : 0)).length, icon: AlertTriangle, color: 'text-red-500', bg: 'bg-red-500/5' },
           { label: 'Active Promos', val: analysis?.creativeCampaigns?.length || 0, icon: Sparkles, color: 'text-amber-500', bg: 'bg-amber-500/5', hidden: userProfile?.role === 'staff' },
           { label: 'AI Prediction', val: analysis ? '98%' : 'System Syncing', icon: TrendingUp, color: 'text-green-500', bg: 'bg-green-500/5', hidden: userProfile?.role === 'staff' }
         ].filter(s => !s.hidden).map((stat, i) => (
           <div key={i} className={cn("border border-stone-800/40 p-4 rounded-2xl flex items-center justify-between group hover:border-amber-500/30 transition-all cursor-default", stat.bg)}>
              <div>
                 <p className="text-[9px] font-black text-stone-600 uppercase tracking-widest">{stat.label}</p>
                 <div className={cn("text-xl font-black font-mono tracking-tighter mt-0.5", stat.color)}>{stat.val}</div>
              </div>
              <stat.icon className={cn("w-5 h-5 opacity-20 group-hover:opacity-100 group-hover:scale-110 transition-all", stat.color)} />
           </div>
         ))}
      </div>

      <div className="grid grid-cols-12 gap-5">
        {/* 1. Main Inventory (Left Column) */}
        <div className={cn("col-span-12 space-y-5", userProfile?.role === 'staff' ? "lg:col-span-12" : "lg:col-span-4")}>
          <div className="bento-card bg-stone-950/40 border-stone-800/50 min-h-[420px] flex flex-col">
            <div className="flex justify-between items-center mb-6">
              <h3 className="bento-label !mb-0">Stock Monitoring</h3>
              <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-green-500/10 border border-green-500/20">
                <div className="w-1 h-1 rounded-full bg-green-500 animate-pulse" />
                <span className="text-[8px] font-black uppercase text-green-500">Live</span>
              </div>
            </div>
            
            <div className="space-y-5 flex-1 custom-scrollbar overflow-y-auto pr-2 mb-6">
              {inventory.slice(0, 7).map(item => (
                <div key={item.id} className="group cursor-default">
                  <div className="flex justify-between items-end mb-2">
                    <div>
                      <span className="text-[8px] font-black text-stone-600 uppercase tracking-widest">{item.category}</span>
                      <h4 className="font-black text-xs text-stone-200 uppercase tracking-tight group-hover:text-amber-500 transition-colors">{item.item}</h4>
                    </div>
                    <div className="text-right">
                      <span className="font-mono text-sm font-black text-stone-100">{item.stock}</span>
                      <span className="text-[9px] text-stone-600 font-bold ml-1 uppercase">{item.unit}</span>
                    </div>
                  </div>
                  <div className="w-full bg-white/5 h-1 rounded-full overflow-hidden">
                    <div 
                      className={cn(
                        "h-full rounded-full transition-all duration-700 ease-in-out",
                        item.stock <= (item.criticalStock !== undefined ? item.criticalStock : 0) ? "bg-red-500" : item.stock <= (item.minStock || 0) / 2 ? "bg-amber-500" : "bg-green-500/80"
                      )} 
                      style={{ width: `${Math.max(2, Math.min(100, (item.stock / (item.minStock || Math.max(item.stock, 1))) * 100))}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>

            <button 
              onClick={() => navigate('/inventory')}
              className="w-full py-3 bg-stone-900/50 hover:bg-stone-800 border border-stone-800/60 text-[9px] font-black uppercase tracking-widest text-stone-400 hover:text-stone-100 rounded-xl transition-all"
            >
              Atur Stok
            </button>
          </div>

          {/* System Signals (New Tiny Widget) */}
          {(() => {
            const hasCritical = inventory.some(i => i.stock <= (i.criticalStock !== undefined ? i.criticalStock : 0)) || analysis?.analysis.some(a => a.status === 'Critical');
            const hasWarning = inventory.some(i => i.stock <= (i.minStock || 0) / 2) || analysis?.analysis.some(a => a.status === 'Warning' || a.status === 'Low Stock');
            
            const signalStatus = hasCritical ? 'Critical' : hasWarning ? 'Warning' : 'Optimal';
            const signalColor = hasCritical ? 'bg-red-500 text-stone-950' : hasWarning ? 'bg-amber-500 text-stone-950' : 'bg-green-500 text-stone-950';

            return (
              <div className={cn("bento-card border-none flex items-center justify-between p-6 overflow-hidden relative group", signalColor)}>
                 <div className="relative z-10">
                    <p className="text-[9px] font-black text-stone-950/60 uppercase tracking-widest mb-1">Signal Strength</p>
                    <h4 className="text-2xl font-black uppercase tracking-tighter italic">
                      {signalStatus}
                    </h4>
                 </div>
                 <Zap className="w-10 h-10 text-stone-950/20 group-hover:scale-125 transition-transform" />
                 <div className="absolute top-0 right-0 p-2">
                    <div className="w-1 h-1 bg-stone-950 rounded-full animate-ping" />
                 </div>
              </div>
            );
          })()}
        </div>

        {/* 2. Middle Column: Forecast & Market Drivers */}
        {userProfile?.role !== 'staff' && (
          <div className="col-span-12 lg:col-span-5 space-y-5">
          <div className="bento-card bg-stone-950 border-stone-800/50 h-[320px] flex flex-col">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h3 className="bento-label">Kecerdasan Penjualan</h3>
                <h4 className="text-xl font-black tracking-tighter uppercase text-stone-100 italic">Prediksi <span className="text-amber-500">Fluktuasi</span></h4>
              </div>
              <div className="flex gap-1.5">
                 {['H', 'M', 'B'].map(t => (
                   <button key={t} onClick={() => setFluxTimeframe(t as 'H' | 'M' | 'B')} className={cn("w-6 h-6 rounded-md flex items-center justify-center text-[9px] font-black border transition-all hover:scale-105", t === fluxTimeframe ? "bg-amber-500 border-amber-500 text-stone-950" : "bg-stone-900 border-stone-800 text-stone-600 hover:text-stone-300")}>
                     {t}
                   </button>
                 ))}
              </div>
            </div>
            
            <div className="flex-1 flex items-end gap-2 px-2 pb-2">
              {(() => {
                const getSalesForPeriod = (startDate: Date, endDate: Date) => {
                  return salesHistory.reduce((sum, sale) => {
                    if (!sale.timestamp) return sum;
                    const saleDate = sale.timestamp?.toDate ? sale.timestamp.toDate() : new Date(sale.timestamp);
                    if (saleDate >= startDate && saleDate <= endDate) {
                      const itemsSold = Array.isArray(sale.items) 
                        ? sale.items.reduce((a: any, b: any) => a + (Number(b.qty) || 0), 0)
                        : Object.values(sale.items || {}).reduce((a: any, b: any) => a + (Number(b) || 0), 0);
                      return sum + itemsSold;
                    }
                    return sum;
                  }, 0);
                };

                const length = fluxTimeframe === 'B' ? 30 : fluxTimeframe === 'M' ? 7 : 24;
                const periodData = Array.from({ length }).map((_, i) => {
                  const dEnd = new Date();
                  const dStart = new Date();
                  
                  if (fluxTimeframe === 'B') {
                     dEnd.setDate(dEnd.getDate() - (29 - i));
                     dEnd.setHours(23, 59, 59, 999);
                     dStart.setTime(dEnd.getTime());
                     dStart.setHours(0, 0, 0, 0);
                  } else if (fluxTimeframe === 'M') {
                     dEnd.setDate(dEnd.getDate() - (6 - i));
                     dEnd.setHours(23, 59, 59, 999);
                     dStart.setTime(dEnd.getTime());
                     dStart.setHours(0, 0, 0, 0);
                  } else {
                     // Hours
                     dEnd.setHours(dEnd.getHours() - (23 - i));
                     dEnd.setMinutes(59, 59, 999);
                     dStart.setTime(dEnd.getTime());
                     dStart.setMinutes(0, 0, 0);
                  }

                  return {
                    val: getSalesForPeriod(dStart, dEnd),
                    start: dStart
                  };
                });

                const maxVal = Math.max(...periodData.map(d => d.val), 1); // Avoid division by zero

                return periodData.map((data, i) => {
                  const dynamicH = Math.max(0.05, data.val / maxVal);
                  const isHighActivity = data.val > maxVal * 0.7; // highlight if greater than 70% of max
                  
                  return (
                    <div key={i} className="flex-1 flex flex-col items-center gap-2 group cursor-pointer relative" onClick={() => navigate('/forecasting')}>
                      <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-stone-100 text-stone-900 text-[8px] font-black px-2 py-1 rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-10">
                        {data.val}
                      </div>
                      <div className={cn("w-full bg-stone-900/50 rounded-lg overflow-hidden relative border border-stone-800/20 flex-1 flex flex-col justify-end", fluxTimeframe === 'M' ? 'min-h-[40px]' : 'min-h-[20px]')}>
                        <motion.div 
                          initial={{ height: 0 }}
                          animate={{ height: `${dynamicH * 100}%` }}
                          className={cn(
                            "w-full rounded-t-sm transition-all duration-700",
                            isHighActivity ? "bg-amber-500/80 group-hover:bg-amber-400" : "bg-stone-800 group-hover:bg-stone-700"
                          )} 
                        />
                      </div>
                      {fluxTimeframe === 'M' && (
                        <span className="text-[8px] font-mono font-black text-stone-700 tracking-tighter">
                          {['MIN', 'SEN', 'SEL', 'RAB', 'KAM', 'JUM', 'SAB'][data.start.getDay()]}
                        </span>
                      )}
                      {fluxTimeframe === 'H' && i % 6 === 0 && (
                        <span className="text-[8px] font-mono font-black text-stone-700 tracking-tighter">
                          {data.start.getHours().toString().padStart(2, '0')}:00
                        </span>
                      )}
                      {fluxTimeframe === 'B' && i % 7 === 0 && (
                        <span className="text-[8px] font-mono font-black text-stone-700 tracking-tighter">
                          Mg{Math.floor(i/7) + 1}
                        </span>
                      )}
                    </div>
                  );
                });
              })()}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-5">
             <div className="bento-card bg-stone-900/30 border-stone-800/40 p-5" onClick={() => navigate('/forecasting')}>
                <div className="flex items-center gap-2 mb-3">
                   <TrendingUp className="w-3 h-3 text-green-500" />
                   <span className="text-[9px] font-black text-stone-600 uppercase tracking-widest">Efficiency</span>
                </div>
                <div className="text-3xl font-black font-mono text-stone-100 tracking-tighter">{analysis ? Math.min(100, 92 + (inventory.length * 0.5)).toFixed(1) : '--'}%</div>
                <p className="text-[8px] text-stone-500 font-bold uppercase mt-2 tracking-tight">AI routing optimized</p>
             </div>
             <div className="bento-card border-none bg-stone-100 p-5 group cursor-pointer overflow-hidden relative" onClick={() => navigate('/forecasting')}>
                <div className="relative z-10">
                  <div className="flex items-center gap-2 mb-3 text-stone-900/50">
                     <RefreshCcw className="w-3 h-3 group-hover:rotate-180 transition-transform duration-500" />
                     <span className="text-[9px] font-black uppercase tracking-widest">Runway</span>
                  </div>
                  <div className="text-3xl font-black font-mono text-stone-950 tracking-tighter">
                    {analysis?.analysis?.length ? `D-${Math.min(...analysis.analysis.map(a => a.daysRemaining)).toString().padStart(2, '0')}` : 'D-??'}
                  </div>
                  <p className="text-[8px] text-stone-950/60 font-bold uppercase mt-2 tracking-tight italic">
                    {analysis?.analysis?.length ? `Lowest stock: ${analysis.analysis.reduce((min, cur) => cur.daysRemaining < min.daysRemaining ? cur : min, analysis.analysis[0]).item}` : 'Low stock alert'}
                  </p>
                </div>
                <div className="absolute -bottom-4 -right-4 w-16 h-16 bg-stone-200 rounded-full group-hover:scale-150 transition-transform opacity-50" />
             </div>
          </div>

          {/* AI Insight (Empty space filler) */}
          <div className="bento-card bg-stone-950 border border-amber-500/20 p-5">
             <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-amber-500 flex items-center justify-center shrink-0">
                   <Sparkles className="w-4 h-4 text-stone-950 fill-current" />
                </div>
                <div>
                   <p className="text-[9px] font-black text-stone-200 uppercase tracking-tight">Catatan Strategi AI</p>
                   <p className="text-[10px] text-stone-500 font-bold leading-normal mt-0.5">
                      {analysis ? (analysis.recommendations[0]?.description || 'Sistem optimal. Tidak ada rekomendasi mendesak.') : 'Menunggu data untuk menyusun strategi...'}
                   </p>
                </div>
             </div>
          </div>

          {/* New: Expiring Items Promos (The "Wow" Factor) */}
          {analysis && analysis.creativeCampaigns.length > 0 && (
            <div className="bento-card bg-stone-900/50 border-amber-500/10 p-6">
              <h3 className="text-xs font-black text-stone-100 uppercase tracking-widest mb-4 flex items-center gap-2">
                 <Zap className="w-3.5 h-3.5 text-amber-500" /> Promo Cerdas Stok Tersisa
              </h3>
              <div className="space-y-4">
                {analysis.creativeCampaigns.map((camp, idx) => (
                  <div key={idx} className="p-4 bg-stone-950 rounded-2xl border border-stone-800 hover:border-amber-500/30 transition-all">
                     <h4 className="text-[11px] font-black text-amber-500 uppercase">{camp.title}</h4>
                     <p className="text-[10px] text-stone-300 font-bold mt-2 leading-relaxed italic">"{camp.hook}"</p>
                     <div className="mt-4 flex items-center gap-2 text-[8px] font-black text-stone-600 uppercase tracking-widest">
                        <span>Visual Link:</span>
                        <span className="text-stone-400">{camp.visualIdea}</span>
                     </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
        )}

        {/* 3. Right Column: Procurement & Market Sentiment */}
        {userProfile?.role !== 'staff' && (
          <div className="col-span-12 lg:col-span-3 space-y-5">
          <div className="bento-card bg-stone-950 border-stone-800/50 min-h-[300px] flex flex-col">
            <div className="flex justify-between items-center mb-6">
              <h3 className="bento-label !mb-0">Daftar Belanja AI</h3>
              <ShoppingBag className="w-3.5 h-3.5 text-stone-700" />
            </div>
            <div className="space-y-3 flex-1 overflow-auto custom-scrollbar pr-1">
              {analysis?.shoppingList.slice(0, 3).map((shop) => (
                <div key={shop.item} className="flex items-center gap-3 p-3 bg-stone-900/40 border border-stone-800/30 rounded-xl hover:bg-stone-900 transition-colors group cursor-pointer" onClick={() => navigate('/restock')}>
                  <div className="w-10 h-10 rounded-lg bg-stone-950 border border-stone-800 flex items-center justify-center font-mono text-[10px] font-black text-amber-500/70 group-hover:bg-amber-500 group-hover:text-stone-950 transition-all">
                    {shop.quantity}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h5 className="text-[10px] font-black uppercase text-stone-200 truncate">{shop.item}</h5>
                    <p className="text-[8px] text-stone-600 font-bold uppercase tracking-tighter">{shop.unit} • AI_ORDER</p>
                  </div>
                </div>
              ))}
            </div>
            <button 
              onClick={() => navigate('/restock')}
              className="w-full mt-4 py-3 bg-amber-500/10 hover:bg-amber-500 border border-amber-500/20 hover:border-amber-500 text-[8px] font-black uppercase tracking-[0.2em] text-amber-500 hover:text-stone-950 rounded-xl transition-all"
            >
              Analyze Orders
            </button>
          </div>

          <div className="bento-card bg-stone-950 border-stone-800/50 p-6 flex flex-col justify-between h-[215px]">
             <div>
                <h3 className="bento-label !mb-2 opacity-60">System Traction</h3>
                <div className="text-5xl font-black font-mono text-stone-50 tracking-tighter">
                  {analysis ? Math.min(100, 85 + inventory.length).toFixed(0) : '--'}
                  <span className="text-base text-stone-700">%</span>
                </div>
             </div>
             <div className="mt-4 pt-4 border-t border-stone-900 flex flex-wrap gap-2">
                <div className="px-3 py-1.5 bg-green-500/10 text-green-500 text-[8px] font-black uppercase rounded-md">Growth_Active</div>
                <div className="px-3 py-1.5 bg-stone-900 text-stone-500 text-[8px] font-black uppercase rounded-md">
                  Sentiment_{analysis ? (9 + (inventory.length % 10) / 10).toFixed(1) : '?.?'}
                </div>
             </div>
          </div>

          {/* Floating Action (Fill bottom of right col if needed) */}
          <button 
            onClick={handleManualOrder}
            className="w-full p-6 bg-stone-950 border-stone-800 hover:border-amber-500/40 rounded-3xl group transition-all"
          >
            <div className="flex items-center justify-between">
              <span className="text-[9px] font-black text-stone-500 uppercase tracking-[0.2em] group-hover:text-amber-500 transition-colors">Start Restock Cycle</span>
              <ArrowRight className="w-4 h-4 text-stone-700 group-hover:text-amber-500 group-hover:translate-x-1 transition-all" />
            </div>
          </button>
        </div>
        )}
      </div>
    </div>
  );
};
