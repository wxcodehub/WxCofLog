import { InventoryItem, PredictionAnalysis } from '../types';

export interface CalculatedItemStatus {
  status: 'Critical' | 'Warning' | 'Optimal';
  badgeLabel: string;
  badgeClass: string;
  dotClass: string;
  progressClass: string;
  isCritical: boolean;
  isWarning: boolean;
  isOptimal: boolean;
  depletionDays: number;
  depletionDaysStr: string;
  avgDailyUsage: number;
  recommendation: string;
  historyData: number[];
  maxHistoryQty: number;
}

export function calculateItemMetrics(
  item: InventoryItem,
  salesHistory: any[] = [],
  aiAnalysis?: PredictionAnalysis
): CalculatedItemStatus {
  // Calculate 14 days usage
  const historyData = Array.from({ length: 14 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (13 - i));
    const dateStr = d.toLocaleDateString();

    const salesOnDate = (salesHistory || []).filter(sale => {
      if (!sale?.timestamp) return false;
      const saleDate = sale.timestamp?.toDate ? sale.timestamp.toDate() : new Date(sale.timestamp);
      return saleDate.toLocaleDateString() === dateStr;
    });

    return salesOnDate.reduce((sum, sale) => {
      const qty = Array.isArray(sale.items)
        ? sale.items.find((si: any) => si.itemId === item.id)?.qty
        : sale.items?.[item.id];
      return sum + (Number(qty) || 0);
    }, 0);
  });

  const avgUsage = historyData.reduce((a, b) => a + b, 0) / 14;
  const currentStock = Number(item.stock) || 0;
  const criticalThreshold = item.criticalStock !== undefined ? Number(item.criticalStock) : 0;
  const minStock = Number(item.minStock) || 0;
  const warningThreshold = minStock / 2;

  let depletionDays = avgUsage > 0 ? currentStock / avgUsage : 999;
  const depletionDaysStr = depletionDays === 999 ? '∞' : Math.round(depletionDays).toString();
  const avgDailyUsage = Math.round(avgUsage * 10) / 10;
  const maxHistoryQty = Math.max(...historyData, 1);

  let status: 'Critical' | 'Warning' | 'Optimal' = 'Optimal';

  // 1. Critical if stock <= criticalThreshold or stock == 0 or AI marked Critical
  if (currentStock <= criticalThreshold || aiAnalysis?.status === 'Critical') {
    status = 'Critical';
  }
  // 2. Warning if stock <= warningThreshold or depletion in < 7 days or stock < minStock or AI marked Warning
  else if (currentStock <= warningThreshold || (avgUsage > 0 && depletionDays < 7) || currentStock < minStock || aiAnalysis?.status === 'Warning') {
    status = 'Warning';
  }

  let badgeLabel = 'Optimal';
  let badgeClass = 'bg-green-500/10 border-green-500/30 text-green-500';
  let dotClass = 'bg-green-500';
  let progressClass = 'bg-green-500/80';

  if (status === 'Critical') {
    badgeLabel = 'Critical (Di Bawah Kritis)';
    badgeClass = 'bg-red-500/10 border-red-500/30 text-red-500';
    dotClass = 'bg-red-500';
    progressClass = 'bg-red-500';
  } else if (status === 'Warning') {
    badgeLabel = 'Warning (Perlu Restock)';
    badgeClass = 'bg-amber-500/10 border-amber-500/30 text-amber-500';
    dotClass = 'bg-amber-500';
    progressClass = 'bg-amber-500';
  }

  let recommendation = aiAnalysis?.recommendation;
  if (!recommendation) {
    if (status === 'Critical') {
      recommendation = `PERINGATAN KRITIS: Stok ${item.item} (${currentStock} ${item.unit}) berada di bawah batas kritis (${criticalThreshold} ${item.unit}). Segera lakukan pemesanan darurat hari ini!`;
    } else if (status === 'Warning') {
      recommendation = `PERHATIAN: Stok ${item.item} (${currentStock} ${item.unit}) mendekati batas aman (${minStock} ${item.unit}) atau diproyeksikan habis dalam ${depletionDaysStr} hari. Jadwalkan restok segera.`;
    } else {
      recommendation = `Stok AMAN: Ketersediaan ${item.item} dalam kondisi optimal (${currentStock} ${item.unit}). Laju pemakaian rata-rata ${avgDailyUsage} ${item.unit}/hari. Cukup untuk ${depletionDaysStr} hari ke depan.`;
    }
  }

  return {
    status,
    badgeLabel,
    badgeClass,
    dotClass,
    progressClass,
    isCritical: status === 'Critical',
    isWarning: status === 'Warning',
    isOptimal: status === 'Optimal',
    depletionDays,
    depletionDaysStr,
    avgDailyUsage,
    recommendation,
    historyData,
    maxHistoryQty
  };
}
