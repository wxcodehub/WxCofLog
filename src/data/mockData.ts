/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { InventoryItem } from "../types";

export const mockInventory: InventoryItem[] = [
  { id: '1', item: "Biji Kopi (Arabica)", stock: 5, minStock: 2, unit: "kg", exp_date: "2026-06-01", category: 'Beans' },
  { id: '2', item: "Susu UHT", stock: 12, minStock: 6, unit: "L", exp_date: "2026-05-13", category: 'Milk' },
  { id: '3', item: "Gula Aren", stock: 2, minStock: 1, unit: "kg", exp_date: "2026-07-10", category: 'Sugar' },
  { id: '4', item: "Oat Milk", stock: 4, minStock: 2, unit: "L", exp_date: "2026-05-12", category: 'Milk' },
  { id: '5', item: "Caramel Syrup", stock: 1, minStock: 0.5, unit: "bottle", exp_date: "2026-08-15", category: 'Syrup' },
  { id: '6', item: "Hazelnut Syrup", stock: 3, minStock: 1, unit: "bottle", exp_date: "2026-09-20", category: 'Syrup' },
  { id: '7', item: "Vanilla Syrup", stock: 8, minStock: 2, unit: "bottle", exp_date: "2026-10-01", category: 'Syrup' },
  { id: '8', item: "Chocolate Powder", stock: 3.5, minStock: 1, unit: "kg", exp_date: "2027-01-15", category: 'Sugar' },
  { id: '9', item: "Coffee Filter V60", stock: 100, minStock: 20, unit: "pcs", exp_date: "2029-01-01", category: 'Packaging' },
  { id: '10', item: "Takeaway Cup 12oz", stock: 250, minStock: 50, unit: "pcs", exp_date: "2029-01-01", category: 'Packaging' },
  { id: '11', item: "Paper Straw", stock: 400, minStock: 100, unit: "pcs", exp_date: "2029-01-01", category: 'Packaging' },
];

export const mockDailySalesAvg = {
  "Biji Kopi (Arabica)": "0.5kg/day",
  "Susu UHT": "2L/day",
  "Gula Aren": "0.1kg/day",
  "Oat Milk": "1L/day",
  "Caramel Syrup": "0.05bottle/day",
};

export const eventContext = "Besok hari Minggu dan ada konser di dekat kedai.";
