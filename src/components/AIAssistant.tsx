/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Send, Sparkles, X, MessageSquare, Bot, User } from 'lucide-react';
import { chatWithAssistant } from '../services/geminiService';
import { cn } from '../lib/utils';

interface Message {
  role: 'user' | 'model';
  parts: string;
}

interface AIAssistantProps {
  inventory: any[];
  dailySalesAvg: any;
}

export function AIAssistant({ inventory, dailySalesAvg }: AIAssistantProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { 
      role: 'model', 
      parts: 'Halo! Saya WxCofLog Assistant. Ada yang bisa saya bantu dengan stok atau strategi promo kopimu hari ini?' 
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isOpen]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMsg = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', parts: userMsg }]);
    setIsLoading(true);

    try {
      const response = await chatWithAssistant(messages, userMsg, inventory, dailySalesAvg);
      setMessages(prev => [...prev, { role: 'model', parts: response }]);
    } catch (error) {
      console.error("Chat error:", error);
      setMessages(prev => [...prev, { 
        role: 'model', 
        parts: "Maaf, sepertinya ada gangguan koneksi ke otak AI saya. Coba lagi ya!" 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Trigger Button - Hidden on right edge (Peeking tab) */}
      {!isOpen && (
        <motion.button
          initial={{ x: 34 }}
          animate={{ x: 34 }}
          whileHover={{ x: 0 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setIsOpen(true)}
          className="fixed right-0 top-[85%] -translate-y-1/2 h-14 w-12 bg-amber-500 text-stone-950 rounded-l-2xl shadow-xl shadow-amber-500/20 flex items-center justify-start z-50 border border-stone-950 group transition-all duration-300 ease-in-out cursor-pointer overflow-hidden pl-3"
        >
          {/* Subtle handle line */}
          <div className="absolute left-0 top-[25%] bottom-[25%] w-[1px] bg-stone-950/40" />
          
          <Sparkles className="w-5 h-5 fill-stone-950 group-hover:rotate-12 transition-transform duration-500 shrink-0" />
        </motion.button>
      )}

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 100, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 100, scale: 0.9 }}
            className="fixed bottom-24 right-6 w-[400px] max-w-[calc(100vw-3rem)] h-[600px] max-h-[calc(100vh-8rem)] bg-stone-900 border border-stone-800 rounded-[2.5rem] shadow-2xl z-50 flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="p-6 bg-stone-950 border-b border-stone-800 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500 flex items-center justify-center">
                  <Bot className="w-6 h-6 text-stone-950" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-stone-100 uppercase tracking-widest">WxCofLog Assistant</h3>
                  <div className="flex items-center gap-2 mt-0.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                    <span className="text-[8px] font-black text-stone-500 uppercase tracking-widest">System Active</span>
                  </div>
                </div>
              </div>
              <button onClick={() => setIsOpen(false)} className="p-2 hover:bg-stone-900 rounded-lg transition-colors text-stone-500 hover:text-stone-100">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Messages */}
            <div 
              ref={scrollRef}
              className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar"
            >
              {messages.map((msg, i) => (
                <motion.div
                  initial={{ opacity: 0, x: msg.role === 'user' ? 20 : -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  key={i}
                  className={cn(
                    "flex gap-3 max-w-[85%]",
                    msg.role === 'user' ? "ml-auto flex-row-reverse" : "mr-auto"
                  )}
                >
                  <div className={cn(
                    "w-8 h-8 rounded-lg shrink-0 flex items-center justify-center mt-1",
                    msg.role === 'user' ? "bg-stone-800 text-stone-400" : "bg-amber-500/10 text-amber-500"
                  )}>
                    {msg.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                  </div>
                  <div className={cn(
                    "p-4 rounded-2xl text-[11px] font-bold leading-relaxed whitespace-pre-wrap",
                    msg.role === 'user' 
                      ? "bg-stone-800 text-stone-200" 
                      : "bg-stone-950 border border-stone-800 text-stone-300"
                  )}>
                    {msg.parts}
                  </div>
                </motion.div>
              ))}
              {isLoading && (
                <div className="flex gap-3 mr-auto max-w-[85%]">
                  <div className="w-8 h-8 rounded-lg shrink-0 bg-amber-500/10 text-amber-500 flex items-center justify-center mt-1">
                    <Bot className="w-4 h-4" />
                  </div>
                  <div className="p-4 rounded-2xl bg-stone-950 border border-stone-800 flex gap-1">
                    <div className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-bounce [animation-delay:-0.3s]" />
                    <div className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-bounce [animation-delay:-0.15s]" />
                    <div className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-bounce" />
                  </div>
                </div>
              )}
            </div>

            {/* Input Overlay for Mobile Flow */}
            <div className="p-6 pt-0">
              <div className="bg-stone-950 border border-stone-800 rounded-2xl p-2 flex items-center gap-2">
                <input 
                  type="text"
                  placeholder="Tanya stok atau promo..."
                  className="flex-1 bg-transparent px-4 py-3 text-xs font-bold text-stone-100 outline-none placeholder:text-stone-700"
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSend()}
                />
                <button 
                  onClick={handleSend}
                  disabled={!input.trim() || isLoading}
                  className="w-10 h-10 bg-amber-500 text-stone-950 rounded-xl flex items-center justify-center disabled:opacity-50 transition-all hover:scale-105"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
              <p className="text-[8px] font-black text-stone-700 uppercase tracking-widest text-center mt-4">Powered by WxCofLog Neural Network</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
