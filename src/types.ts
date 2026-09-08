/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface InventoryItem {
  id: string;
  item: string;
  stock: number;
  minStock: number;
  criticalStock?: number;
  unit: string;
  exp_date: string;
  category: 'Beans' | 'Milk' | 'Sugar' | 'Others' | 'Packaging' | 'Syrup';
  batches?: { qty: number; exp_date: string }[];
}

export interface DailySales {
  date: string;
  amount: number;
  itemId: string;
}

export interface PredictionAnalysis {
  item: string;
  daysRemaining: number;
  status: 'Safe' | 'Warning' | 'Critical';
  forecastedUsage: number;
  recommendation: string;
}

export interface Recommendation {
  title: string;
  description: string;
  type: 'Promo' | 'Stock' | 'Event';
  urgency: 'Low' | 'Medium' | 'High';
  socialContent?: string; // For Gen-Z style story ideas
}

export interface AssistantAnalysisResponse {
  analysis: PredictionAnalysis[];
  recommendations: Recommendation[];
  shoppingList: { item: string; quantity: number; unit: string }[];
  creativeCampaigns: { 
    title: string; 
    hook: string; 
    visualIdea: string; 
    socialCopy: string 
  }[];
}
