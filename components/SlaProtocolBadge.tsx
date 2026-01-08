
import React from 'react';
import { LotteryConfig } from '../types';

interface SlaProtocolBadgeProps {
  config: LotteryConfig;
}

const SlaProtocolBadge: React.FC<SlaProtocolBadgeProps> = ({ config }) => {
  return (
    <div className="glass-panel p-4 rounded-2xl border border-white/10 bg-white/5 space-y-3">
      <div className="flex items-center gap-2">
        <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></div>
        <h4 className="text-[10px] font-black text-white uppercase tracking-widest">Protocolo Operacional</h4>
      </div>
      
      <div className="grid grid-cols-1 gap-2">
        <div className="flex justify-between items-center bg-black/20 p-2 rounded-lg">
          <span className="text-[9px] font-bold text-gray-500 uppercase">Frequência</span>
          <span className="text-[10px] font-black text-blue-400">{config.sla.frequency}</span>
        </div>
        <div className="flex justify-between items-center bg-black/20 p-2 rounded-lg">
          <span className="text-[9px] font-bold text-gray-500 uppercase">Latência</span>
          <span className="text-[10px] font-black text-emerald-400">{config.sla.processingTime}</span>
        </div>
        <div className="flex justify-between items-center bg-black/20 p-2 rounded-lg">
          <span className="text-[9px] font-bold text-gray-500 uppercase">Integridade</span>
          <span className="text-[10px] font-black text-purple-400">{config.sla.reliability}</span>
        </div>
      </div>

      <div className="pt-2 border-t border-white/5 flex gap-3">
        <div className="flex-1 text-center">
          <p className="text-[8px] font-bold text-gray-500 uppercase">Aposta</p>
          <p className="text-[11px] font-black text-white">R$ {config.pricePerBet.toFixed(2)}</p>
        </div>
        <div className="flex-1 text-center">
          <p className="text-[8px] font-bold text-gray-500 uppercase">Range</p>
          <p className="text-[11px] font-black text-white">01-{config.totalNumbers}</p>
        </div>
      </div>
    </div>
  );
};

export default SlaProtocolBadge;
