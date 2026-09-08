import React from 'react';
import { motion } from 'motion/react';
import { Package, Sparkles, TrendingUp, Zap, LogIn, Database, Shield, Box, ArrowDown } from 'lucide-react';
import { cn } from '../lib/utils';

interface LandingProps {
  onLogin: () => void;
  loading?: boolean;
}

const features = [
  {
    icon: <Sparkles className="w-6 h-6 text-amber-500" />,
    title: "AI Supply Chain",
    description: "Rekomendasi restock cerdas berbasis model AI Gemini untuk menghindari kehabisan stok maupun penumpukan bahan."
  },
  {
    icon: <TrendingUp className="w-6 h-6 text-amber-500" />,
    title: "Predictive Analytics",
    description: "Analisis riwayat penjualan untuk memprediksi kapan Anda harus melakukan re-order secara otomatis."
  },
  {
    icon: <Database className="w-6 h-6 text-amber-500" />,
    title: "Multi-Role Workspace",
    description: "Akses tersentralisasi bagi Owner, Manager, dan Staff dalam satu kedai yang sama dengan hak akses berbeda."
  },
  {
    icon: <Shield className="w-6 h-6 text-amber-500" />,
    title: "Batch & Expiry Tracking",
    description: "Pantau tanggal kadaluwarsa (FIFO/FEFO) untuk mencegah kerugian akibat bahan baku yang terbuang."
  }
];

export const Landing: React.FC<LandingProps> = ({ onLogin, loading }) => {
  return (
    <div className="min-h-screen bg-stone-950 text-stone-100 overflow-hidden font-sans select-none">
      
      {/* Navigation Bar */}
      <nav className="fixed top-4 md:top-6 left-1/2 -translate-x-1/2 w-[calc(100%-2rem)] max-w-7xl z-50 bg-stone-950/80 backdrop-blur-lg border border-stone-800/50 rounded-2xl md:rounded-[2rem] overflow-hidden">
        <div className="px-6 md:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center shadow-lg shadow-amber-500/20 overflow-hidden">
              <img src="/logo.png" alt="Logo" className="w-full h-full object-cover" />
            </div>
            <span className="text-xl font-black italic uppercase tracking-tight">
              WxCof<span className="text-amber-500">Log.</span>
            </span>
          </div>
          <button
            onClick={onLogin}
            disabled={loading}
            className="px-6 py-2.5 bg-stone-100 text-stone-950 font-black rounded-full uppercase text-[10px] tracking-widest hover:bg-white hover:scale-105 transition-all flex items-center gap-2 shadow-xl"
          >
            <LogIn className="w-4 h-4" />
            {loading ? "Menghubungkan..." : "Sign In"}
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-40 pb-20 px-6 min-h-[90vh] flex flex-col justify-center items-center">
        {/* Abstract Background Elements */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-amber-500/5 rounded-full blur-[120px] pointer-events-none" />
        
        <div className="max-w-5xl mx-auto text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-stone-900 border border-stone-800 mb-8">
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
              <span className="text-[10px] font-black uppercase tracking-widest text-stone-400">System V2.4 Active</span>
            </div>
            
            <h1 className="text-6xl md:text-8xl font-black uppercase tracking-tighter leading-[0.9] mb-8">
              Intelligent <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-amber-600 italic">
                Supply Chain
              </span>
            </h1>
            
            <p className="max-w-2xl mx-auto text-stone-400 text-lg md:text-xl font-medium mb-12 leading-relaxed">
              Tingkatkan efisiensi manajemen stok kedai kopi Anda. 
              Gunakan kecerdasan buatan untuk memprediksi kebutuhan inventaris, melacak tanggal kadaluwarsa, 
              dan mengotomatisasi daftar belanja.
            </p>

            <button
              onClick={onLogin}
              disabled={loading}
              className="px-10 py-5 bg-amber-500 text-stone-950 font-black rounded-full uppercase text-xs md:text-sm tracking-[0.2em] hover:bg-amber-400 hover:scale-105 hover:shadow-[0_0_40px_rgba(245,158,11,0.4)] transition-all flex items-center gap-3 mx-auto"
            >
              <Zap className="w-5 h-5" />
              Mulai Sekarang — Gratis
            </button>
          </motion.div>
        </div>

        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1, duration: 1 }}
          className="absolute bottom-10 left-1/2 -translate-x-1/2 animate-bounce"
        >
          <ArrowDown className="w-6 h-6 text-stone-600" />
        </motion.div>
      </section>

      {/* 3D Scroll Features Section */}
      <section className="py-32 px-6 relative bg-stone-950">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <motion.h2 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              className="text-4xl md:text-6xl font-black uppercase tracking-tighter"
            >
              The Next Gen <br className="md:hidden" />
              <span className="text-amber-500 italic">Inventory.</span>
            </motion.h2>
          </div>

          <div className="grid md:grid-cols-2 gap-8 lg:gap-12">
            {features.map((feature, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 50, scale: 0.95 }}
                whileInView={{ opacity: 1, y: 0, scale: 1 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.6, delay: idx * 0.1, ease: "easeOut" }}
                className="group relative bg-stone-900 border border-stone-800 p-8 md:p-12 rounded-[2.5rem] hover:border-amber-500/50 transition-colors overflow-hidden"
              >
                {/* Subtle Hover Gradient */}
                <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                
                <div className="relative z-10">
                  <div className="w-14 h-14 bg-stone-950 rounded-2xl flex items-center justify-center mb-6 border border-stone-800 group-hover:scale-110 transition-transform">
                    {feature.icon}
                  </div>
                  <h3 className="text-2xl font-black uppercase tracking-tight mb-4">{feature.title}</h3>
                  <p className="text-stone-400 leading-relaxed font-medium">
                    {feature.description}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Interactive Mockup / Stats Teaser */}
      <section className="py-32 px-6 overflow-hidden">
        <div className="max-w-7xl mx-auto">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, rotateX: 10 }}
            whileInView={{ opacity: 1, scale: 1, rotateX: 0 }}
            viewport={{ once: true, margin: "-200px" }}
            transition={{ duration: 1, ease: "easeOut" }}
            className="bg-stone-900 rounded-[3rem] border border-stone-800 p-8 md:p-16 flex flex-col md:flex-row items-center justify-between gap-12 relative shadow-2xl"
            style={{ perspective: "1000px" }}
          >
            <div className="flex-1 space-y-6 relative z-10">
              <h2 className="text-4xl md:text-5xl font-black uppercase tracking-tighter leading-tight">
                Data-Driven <br />
                <span className="text-stone-500 italic">Decisions.</span>
              </h2>
              <p className="text-stone-400 text-lg max-w-md">
                Jangan biarkan intuisi membutakan operasional Anda. WxCofLog mengubah data penjualan harian menjadi daftar belanja yang presisi.
              </p>
            </div>
            <div className="flex-1 w-full relative">
               <div className="absolute inset-0 bg-gradient-to-r from-stone-900 to-transparent z-10" />
               <div className="grid grid-cols-2 gap-4 opacity-50 rotate-3 scale-110">
                 {[1,2,3,4].map((i) => (
                    <div key={i} className="bg-stone-950 p-6 rounded-2xl border border-stone-800">
                      <div className="w-1/2 h-2 bg-stone-800 rounded-full mb-4" />
                      <div className="w-full h-8 bg-stone-800/50 rounded-lg" />
                    </div>
                 ))}
               </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer CTA */}
      <section className="py-40 px-6 text-center relative">
        <div className="absolute inset-0 bg-amber-500/5" />
        <div className="absolute bottom-0 inset-x-0 h-1/2 bg-gradient-to-t from-stone-950 to-transparent" />
        
        <div className="max-w-3xl mx-auto relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <div className="w-20 h-20 rounded-3xl overflow-hidden mx-auto flex items-center justify-center mb-8 shadow-[0_0_50px_rgba(245,158,11,0.3)]">
              <img src="/logo.png" alt="Logo" className="w-full h-full object-cover" />
            </div>
            <h2 className="text-5xl md:text-7xl font-black uppercase tracking-tighter mb-8 leading-[0.9]">
              Ready to <br />
              <span className="italic text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-amber-600">
                Transform?
              </span>
            </h2>
            <button
              onClick={onLogin}
              disabled={loading}
              className="px-12 py-6 bg-stone-100 text-stone-950 font-black rounded-full uppercase text-sm tracking-[0.2em] hover:bg-white hover:scale-105 hover:shadow-xl transition-all flex items-center justify-center gap-3 mx-auto w-full md:w-auto"
            >
              <LogIn className="w-5 h-5" />
              Sign In with Google
            </button>
            <p className="mt-8 text-[10px] font-black uppercase tracking-widest text-stone-600">
              Authorized Session Required
            </p>
          </motion.div>
        </div>
      </section>

      {/* Small Footer bar */}
      <footer className="py-6 text-center border-t border-stone-800/50">
         <p className="text-[10px] font-black uppercase tracking-widest text-stone-700">© 2026 WxCofLog. All rights reserved.</p>
      </footer>

    </div>
  );
};
