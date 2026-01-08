
import React from 'react';
import { DrawResult } from '../types';
import { LOTTERY_CONFIGS } from '../constants';

interface HistoryViewProps {
  history: DrawResult[];
}

const HistoryView: React.FC<HistoryViewProps> = ({ history }) => {
  if (history.length === 0) {
    return (
      <div className="text-center p-8 glass-panel rounded-2xl border border-white/5">
        <p className="text-gray-500 italic text-sm font-bold uppercase tracking-widest">Nenhum sorteio realizado ainda.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-black flex items-center gap-2 text-white">
        <span className="w-2 h-6 bg-blue-600 rounded-full shadow-[0_0_10px_rgba(37,99,235,0.5)]"></span>
        Log de Transações
      </h2>
      <div className="overflow-hidden glass-panel rounded-2xl border border-white/10">
        <div className="max-h-[500px] overflow-y-auto custom-scrollbar p-2 space-y-2">
          {history.map((draw) => {
            const config = LOTTERY_CONFIGS[draw.type];
            return (
              <div 
                key={draw.id} 
                className="p-4 bg-white/5 rounded-xl border border-white/5 transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-blue-500/10 hover:bg-white/10 hover:z-10 relative cursor-default"
              >
                <div className="flex justify-between items-center mb-3">
                  <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase text-white ${config.colorClass} shadow-sm`}>
                    {config.name}
                  </span>
                  <span className="text-[10px] font-bold text-gray-500 mono">
                    {new Date(draw.timestamp).toLocaleTimeString()}
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {draw.numbers.map(n => (
                    <div 
                      key={n} 
                      className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-black text-white ${config.colorClass} border border-white/10 shadow-inner`}
                    >
                      {n.toString().padStart(2, '0')}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default HistoryView;
