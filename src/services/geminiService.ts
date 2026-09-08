/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { GoogleGenAI, Type } from "@google/genai";
import { AssistantAnalysisResponse } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
const DEFAULT_MODEL = "gemini-3-flash-preview";

// Simple cache to prevent redundant analysis calls
let analysisCache: { key: string; data: AssistantAnalysisResponse; timestamp: number } | null = null;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

async function retryWithBackoff<T>(fn: () => Promise<T>, maxRetries = 3): Promise<T> {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error: any) {
      const isRateLimit = error?.message?.includes('429') || error?.status === 429;
      if (isRateLimit && i < maxRetries - 1) {
        const delay = Math.pow(2, i) * 1000 + Math.random() * 1000;
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }
      throw error;
    }
  }
  throw new Error("Max retries exceeded");
}

const ANALYSIS_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    analysis: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          item: { type: Type.STRING },
          daysRemaining: { type: Type.NUMBER },
          status: { type: Type.STRING, enum: ['Safe', 'Warning', 'Critical'] },
          forecastedUsage: { type: Type.NUMBER },
          recommendation: { type: Type.STRING },
        },
        required: ['item', 'daysRemaining', 'status', 'forecastedUsage', 'recommendation'],
      },
    },
    recommendations: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING },
          description: { type: Type.STRING },
          type: { type: Type.STRING, enum: ['Promo', 'Stock', 'Event'] },
          urgency: { type: Type.STRING, enum: ['Low', 'Medium', 'High'] },
        },
        required: ['title', 'description', 'type', 'urgency'],
      },
    },
    shoppingList: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          item: { type: Type.STRING },
          quantity: { type: Type.NUMBER },
          unit: { type: Type.STRING },
        },
        required: ['item', 'quantity', 'unit'],
      },
    },
    creativeCampaigns: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING },
          hook: { type: Type.STRING },
          visualIdea: { type: Type.STRING },
          socialCopy: { type: Type.STRING }
        },
        required: ['title', 'hook', 'visualIdea', 'socialCopy']
      }
    }
  },
  required: ['analysis', 'recommendations', 'shoppingList', 'creativeCampaigns'],
};

export async function analyzeSupplyChain(
  inventory: any[],
  dailySalesAvg: any,
  eventContext: string = '',
  forceRefresh: boolean = false
): Promise<AssistantAnalysisResponse> {
  // Check cache first
  const cacheKey = JSON.stringify({ 
    inventory: inventory.map(i => ({ id: i.id, stock: i.stock, exp_date: i.exp_date, minStock: i.minStock, item: i.item, batches: i.batches })), 
    eventContext 
  });
  if (!forceRefresh && analysisCache && analysisCache.key === cacheKey && (Date.now() - analysisCache.timestamp < CACHE_TTL)) {
    return analysisCache.data;
  }

  const prompt = `
    Sebagai Asisten Rantai Pasokan Cerdas untuk kedai kopi UMKM (WxCofLog), analisis data ini:
    
    Data Inventaris: ${JSON.stringify(inventory)}
    Rata-rata Penjualan Harian Riil: ${JSON.stringify(dailySalesAvg)}
    Konteks: ${eventContext}
    Waktu Saat Ini: ${new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
    
    Tugas & Aturan Ketat:
    1. JANGAN PERNAH menyarankan barang yang tidak ada dalam "Data Inventaris".
    2. Prediksi kapan setiap barang akan habis berdasarkan "Rata-rata Penjualan Harian Riil". Jika tidak ada riwayat penjualan, gunakan estimasi moderat (misal: habis dalam 14 hari).
    3. Berikan rekomendasi bisnis. UTAMAKAN barang yang stoknya di bawah "minStock" (Batas Aman).
    4. Buat daftar belanja otomatis. Jika stok <= minStock, barang tersebut WAJIB masuk daftar belanja untuk mencapai tingkat stok optimal.
    5. JIKA ada barang yang hampir kedaluwarsa (kurang dari 5 hari), buat 3 ide pemasaran kreatif "Gen-Z"/flash sale untuk media sosial (Instagram Story).
       Nada bahasa harus estetik, jenaka, dan berenergi tinggi tapi tetap profesional (Gunakan Bahasa Indonesia).
    
    PENTING: minStock adalah batas aman. Jika tidak ada minStock, asumsikan batas aman adalah 20% dari stok awal atau 5 unit.
    JAWABAN HARUS DALAM BAHASA INDONESIA YANG MUDAH DIPAHAMI UMKM.
    Response must be in valid JSON format.
  `;

  try {
    const data = await retryWithBackoff(async () => {
      const response = await ai.models.generateContent({
        model: DEFAULT_MODEL,
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: ANALYSIS_SCHEMA as any,
        },
      });

      if (!response.text) {
        throw new Error("No response from Gemini");
      }

      return JSON.parse(response.text) as AssistantAnalysisResponse;
    });

    // Update cache
    analysisCache = { key: cacheKey, data, timestamp: Date.now() };
    return data;
  } catch (error) {
    console.warn("Supply chain analysis skipped (rate limit or offline)", error);
    // Fallback response to keep UI functional
    return {
      analysis: [],
      recommendations: [
        {
          title: "Analysis Temporarily Unavailable",
          description: "We encountered a permission issue while connecting to the AI. Please verify your Gemini API settings.",
          type: "Warning" as any,
          urgency: "High" as any
        }
      ],
      shoppingList: [],
      creativeCampaigns: []
    };
  }
}

export async function chatWithAssistant(
  history: { role: 'user' | 'model'; parts: string }[],
  userMessage: string,
  inventory: any[],
  dailySalesAvg: any
): Promise<string> {
  const context = `
    Konteks: Kamu adalah "Asisten WxCofLog", Asisten Rantai Pasokan & Pemasaran yang ahli untuk WxCofLog (sebuah kedai kopi UMKM).
    Waktu Saat Ini: ${new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
    Inventaris Saat Ini: ${JSON.stringify(inventory)}
    Rata-rata Penjualan Harian Riil (Berbasis Data Transaksi): ${JSON.stringify(dailySalesAvg)}
    
    Aturan Penting:
    - HANYA bahas barang yang ada di "Inventaris Saat Ini". JANGAN PERNAH menyebutkan Biji Kopi Arabica atau Susu UHT jika item tersebut tidak ada di data.
    - Jika inventaris kosong, katakan dengan ramah: "Sepertinya kamu belum memasukkan data stok. Ayo tambah item pertamamu agar aku bisa menganalisisnya!"
    - Jawab pertanyaan tentang penipisan stok dan kebutuhan pemesanan berdasarkan data angka yang ada.
    - Sarankan promo pemasaran "Gen-Z" yang kreatif jika ada barang yang akan kedaluwarsa.
    - Bersikap ringkas, jenaka, dan sangat membantu. Gunakan poin-poin untuk daftar.
    - JAWAB SELALU DALAM BAHASA INDONESIA YANG RAMAH UMKM LOKAL.
  `;

  try {
    return await retryWithBackoff(async () => {
      const chat = ai.chats.create({
        model: DEFAULT_MODEL,
        config: {
          systemInstruction: context,
        },
        history: history.map(h => ({
          role: h.role,
          parts: [{ text: h.parts }]
        }))
      });

      const response = await chat.sendMessage({
        message: userMessage
      });
      
      return response.text || "I'm sorry, I couldn't process that.";
    });
  } catch (error) {
    console.error("Chat error:", error);
    return "Maaf, WxCofLog Assistant sedang offline. Coba sebentar lagi ya!";
  }
}

