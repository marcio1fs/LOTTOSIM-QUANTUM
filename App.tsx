
import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { LotteryType, DrawResult, SimulationStats, AlphaCandidate, BacktestResult, UserBet } from './types';
import { LOTTERY_CONFIGS } from './constants';
import { generateAlphaBatch, fetchLatestRealResults } from './services/geminiService';
import HistoryView from './components/HistoryView';
import SlaProtocolBadge from './components/SlaProtocolBadge';

const STORAGE_KEY = 'LOTTOSIM_QUANTUM_V8.0.0';
const LICENSE_KEY = 'LOTTOSIM_LICENSE_PRO_V8';
const AUTH_KEY = 'LOTTOSIM_AUTH_V8';

const App: React.FC = () => {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(() => localStorage.getItem(AUTH_KEY) === 'true');
  const [loginData, setLoginData] = useState({ email: '', password: '' });
  const [currentView, setCurrentView] = useState<'simulator' | 'checker'>('simulator');
  const [notification, setNotification] = useState<{msg: string, type: 'info' | 'error' | 'success'} | null>(null);
  const [inspectedBet, setInspectedBet] = useState<AlphaCandidate | null>(null);
  const [showCheckout, setShowCheckout] = useState(false);

  const getInitialState = useCallback(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    const license = localStorage.getItem(LICENSE_KEY);
    if (!saved) return { isPro: license === btoa('ACTIVE_PRO_PLAN_30') };
    try { 
      const parsed = JSON.parse(saved);
      return { ...parsed, isPro: license === btoa('ACTIVE_PRO_PLAN_30') };
    } catch (e) { return { isPro: license === btoa('ACTIVE_PRO_PLAN_30') }; }
  }, []);

  const initialState = getInitialState();

  const [isPro, setIsPro] = useState(initialState.isPro || false);
  const [activeLottery, setActiveLottery] = useState<LotteryType>(initialState.activeLottery || LotteryType.MEGA_SENA);
  const [selectedNumbers, setSelectedNumbers] = useState<number[]>(initialState.selectedNumbers || []);
  const [drawHistory, setDrawHistory] = useState<DrawResult[]>(initialState.drawHistory || []);
  const [userBets, setUserBets] = useState<UserBet[]>(initialState.userBets || []);
  const [stats, setStats] = useState<SimulationStats>(initialState.stats || { totalSpent: 0, totalWon: 0, drawCount: 0, tierHits: {} });
  const [simulationSpeed, setSimulationSpeed] = useState<number>(initialState.simulationSpeed || 800);
  const [frequencyMap, setFrequencyMap] = useState<Record<number, number>>(initialState.frequencyMap || {});
  const [savedBets, setSavedBets] = useState<AlphaCandidate[]>(initialState.savedBets || []);
  const [autoSimulate, setAutoSimulate] = useState(false);
  const [isGeneratingAlpha, setIsGeneratingAlpha] = useState(false);
  const [isSyncingReal, setIsSyncingReal] = useState(false);
  const [realDraw, setRealDraw] = useState<any>(null);
  const [selectedDrawId, setSelectedDrawId] = useState<string>("");

  const config = LOTTERY_CONFIGS[activeLottery];
  const simulationIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Persistence
  useEffect(() => {
    if (!isLoggedIn) return;
    const stateToSave = { activeLottery, selectedNumbers, drawHistory, userBets, stats, simulationSpeed, frequencyMap, savedBets };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stateToSave));
  }, [activeLottery, selectedNumbers, drawHistory, userBets, stats, simulationSpeed, frequencyMap, savedBets, isLoggedIn]);

  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 10000); 
      return () => clearTimeout(timer);
    }
  }, [notification]);

  const showToast = (msg: string, type: 'info' | 'error' | 'success' = 'info') => setNotification({ msg, type });

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    // Simulação de login: qualquer e-mail válido e senha > 4 caracteres
    if (loginData.email.includes('@') && loginData.password.length >= 4) {
      localStorage.setItem(AUTH_KEY, 'true');
      setIsLoggedIn(true);
      showToast("Acesso autorizado. Carregando Quantum Engine...", "success");
    } else {
      showToast("Credenciais inválidas. Verifique os dados de acesso.", "error");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem(AUTH_KEY);
    setIsLoggedIn(false);
    showToast("Sessão finalizada. Terminal bloqueado.", "info");
  };

  const syncRealData = useCallback(async () => {
    if (isSyncingReal) return;
    setIsSyncingReal(true);
    try {
      const data = await fetchLatestRealResults(activeLottery);
      if (data) {
        setRealDraw(data);
        showToast(`Sincronizado: Concurso ${data.contestNumber} (${activeLottery})`, "success");
      }
    } finally { setIsSyncingReal(false); }
  }, [activeLottery, isSyncingReal]);

  useEffect(() => {
    if (isPro && isLoggedIn) syncRealData();
  }, [activeLottery, isPro, isLoggedIn, syncRealData]);

  const activatePro = () => {
    localStorage.setItem(LICENSE_KEY, btoa('ACTIVE_PRO_PLAN_30'));
    setIsPro(true);
    setShowCheckout(false);
    showToast("Licença Pro Ativada com Sucesso!", "success");
  };

  const saveTicket = (numbers: number[], type: LotteryType, label?: string) => {
    const newBet: UserBet = {
      id: `BET-${Math.random().toString(36).substr(2, 5).toUpperCase()}`,
      numbers: [...numbers].sort((a,b)=>a-b),
      type,
      createdAt: Date.now(),
      label
    };
    setUserBets(prev => [newBet, ...prev]);
    showToast("Bilhete registrado com sucesso!", "success");
  };

  const performDraw = useCallback(() => {
    try {
      const drawn: number[] = [];
      const pool = Array.from({ length: config.totalNumbers }, (_, i) => i + 1);
      for (let i = 0; i < config.drawCount; i++) {
        const idx = Math.floor(Math.random() * pool.length);
        drawn.push(pool.splice(idx, 1)[0]);
      }
      drawn.sort((a, b) => a - b);
      const hits = selectedNumbers.filter(n => drawn.includes(n)).length;
      const winTier = config.winTiers.find(t => t.hits === hits) || (activeLottery === LotteryType.LOTOMANIA && hits === 0 ? config.winTiers.find(t => t.hits === 0) : null);
      const prize = winTier ? winTier.approxPrize : 0;
      const newDraw: DrawResult = { id: `DRW-${Math.random().toString(36).substr(2, 5).toUpperCase()}`, type: activeLottery, numbers: drawn, timestamp: Date.now(), prizeAwarded: prize };
      setDrawHistory(prev => [newDraw, ...prev].slice(0, isPro ? 1000 : 10));
      setFrequencyMap(prev => {
        const next = { ...prev };
        drawn.forEach(n => next[n] = (next[n] || 0) + 1);
        return next;
      });
      if (winTier) showToast(`BINGO: ${winTier.label}!`, 'success');
      else showToast("Novo sorteio simulado.", "info");
      
      setStats(prev => {
        const newTierHits = { ...prev.tierHits };
        if (winTier) newTierHits[winTier.label] = (newTierHits[winTier.label] || 0) + 1;
        return { totalSpent: prev.totalSpent + config.pricePerBet, totalWon: prev.totalWon + prize, drawCount: prev.drawCount + 1, tierHits: newTierHits };
      });
    } catch (error) { setAutoSimulate(false); }
  }, [activeLottery, config, selectedNumbers, isPro]);

  useEffect(() => {
    if (autoSimulate && selectedNumbers.length >= config.pickCount.min) {
      simulationIntervalRef.current = setInterval(performDraw, simulationSpeed);
    } else {
      if (simulationIntervalRef.current) clearInterval(simulationIntervalRef.current);
    }
    return () => { if (simulationIntervalRef.current) clearInterval(simulationIntervalRef.current); };
  }, [autoSimulate, performDraw, simulationSpeed, config.pickCount.min, selectedNumbers.length]);

  const handleAlphaGenerate = async () => {
    if (isGeneratingAlpha) return;
    setIsGeneratingAlpha(true);
    try {
      const historyData = drawHistory.slice(0, isPro ? 100 : 10).map(d => d.numbers);
      const games = await generateAlphaBatch(activeLottery, config, historyData, selectedNumbers);
      if (games && Array.isArray(games)) {
        const timestamp = Date.now();
        const limit = isPro ? 10 : 3;
        const processedGames = games.slice(0, limit);
        
        const alphaCandidates: AlphaCandidate[] = processedGames.map((g: any) => ({
          ...g,
          id: `ALPHA-${Math.random().toString(36).substr(2, 5).toUpperCase()}`,
          type: activeLottery,
          createdAt: timestamp,
          numbers: g.numbers.sort((a: number, b: number) => a - b),
        }));

        if (isPro) {
          const newBetsToAutoSave: UserBet[] = alphaCandidates.map(ac => ({
            id: `BET-${Math.random().toString(36).substr(2, 5).toUpperCase()}`,
            type: ac.type,
            numbers: ac.numbers,
            createdAt: timestamp,
            label: `Auto-IA: ${ac.strategy}`
          }));
          setUserBets(prev => [...newBetsToAutoSave, ...prev]);
        }
        setSavedBets(alphaCandidates);
        showToast(`${limit} Matrizes geradas com sucesso!`, "success");
      }
    } finally { setIsGeneratingAlpha(false); }
  };

  const maxFreq = Math.max(...(Object.values(frequencyMap) as number[]), 1);
  const roi = stats.totalSpent === 0 ? 0 : ((stats.totalWon - stats.totalSpent) / stats.totalSpent) * 100;
  
  const selectedDraw = useMemo(() => {
    if (selectedDrawId === "REAL" && realDraw) return { id: "REAL", numbers: realDraw.numbers, type: activeLottery };
    return drawHistory.find(d => d.id === selectedDrawId);
  }, [drawHistory, selectedDrawId, realDraw, activeLottery]);

  // LOGIN SCREEN - DESIGN PERMANENTE
  if (!isLoggedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0b0f1a] p-4 relative overflow-hidden">
        {/* Camadas de Brilho de Fundo */}
        <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-blue-600/10 blur-[150px] rounded-full"></div>
        <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] bg-purple-600/10 blur-[150px] rounded-full"></div>

        <div className="glass-panel w-full max-w-md p-10 md:p-14 rounded-[3.5rem] border border-white/10 shadow-[0_0_80px_rgba(0,0,0,0.5)] relative z-10 animate-in zoom-in-95 duration-700">
           <div className="text-center space-y-4 mb-12">
              <div className="w-20 h-20 bg-blue-600 rounded-[2rem] flex items-center justify-center mx-auto shadow-2xl shadow-blue-500/30 animate-pulse">
                 <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
              </div>
              <div className="space-y-1">
                <h1 className="text-4xl font-black text-white tracking-tighter uppercase italic">Quantum Core</h1>
                <p className="text-[10px] font-black text-gray-500 uppercase tracking-[0.4em]">Integrated Analytical Terminal</p>
              </div>
           </div>

           <form onSubmit={handleLogin} className="space-y-7">
              <div className="space-y-2">
                 <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Terminal ID (Email)</label>
                 <input 
                    type="email" 
                    required
                    value={loginData.email}
                    onChange={(e) => setLoginData({...loginData, email: e.target.value})}
                    placeholder="user@quantum.sys"
                    className="w-full bg-black/50 border border-white/10 p-5 rounded-3xl text-white text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 transition-all placeholder:text-gray-700"
                 />
              </div>
              <div className="space-y-2">
                 <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Access Key (Senha)</label>
                 <input 
                    type="password" 
                    required
                    value={loginData.password}
                    onChange={(e) => setLoginData({...loginData, password: e.target.value})}
                    placeholder="••••••••"
                    className="w-full bg-black/50 border border-white/10 p-5 rounded-3xl text-white text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 transition-all placeholder:text-gray-700"
                 />
              </div>

              <div className="flex items-center justify-between px-1">
                 <label className="flex items-center gap-3 cursor-pointer group">
                    <input type="checkbox" className="w-5 h-5 rounded-[0.5rem] border-white/10 bg-black/40 text-blue-600 focus:ring-0 cursor-pointer transition-all" />
                    <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest group-hover:text-gray-400 transition-colors">Manter Conexão</span>
                 </label>
                 <button type="button" className="text-[10px] font-black text-blue-500 uppercase tracking-widest hover:text-blue-400 transition-colors">Recovery</button>
              </div>

              <button type="submit" className="w-full py-6 bg-blue-600 hover:bg-blue-700 text-white font-black uppercase rounded-3xl transition-all shadow-2xl shadow-blue-500/20 text-xs tracking-[0.2em] active:scale-95">Inicar Sincronização</button>
           </form>

           <div className="mt-12 pt-8 border-t border-white/5 text-center">
              <p className="text-[9px] font-black text-gray-600 uppercase tracking-[0.2em]">Restricted Access Area • System v8.0.4</p>
           </div>
        </div>
        
        <p className="absolute bottom-10 text-[8px] font-black text-gray-800 uppercase tracking-[0.8em] opacity-50">Quantum Intelligence Group © 2024</p>

        {notification && (
          <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[300] px-8 py-4 rounded-[1.5rem] bg-red-600 border border-red-500 text-white flex items-center gap-4 animate-in slide-in-from-bottom-6 duration-500 shadow-2xl">
            <div className="w-2 h-2 bg-white rounded-full animate-ping"></div>
            <span className="text-[11px] font-black uppercase tracking-widest">{notification.msg}</span>
          </div>
        )}
      </div>
    );
  }

  // MAIN APPLICATION SCREEN
  return (
    <div className={`min-h-screen flex flex-col bg-[#0b0f1a] text-slate-200 ${isPro ? 'pro-theme' : ''}`}>
      {/* Checkout Modal */}
      {showCheckout && (
        <div className="fixed inset-0 z-[500] flex items-center justify-center p-4">
           <div className="absolute inset-0 bg-black/95 backdrop-blur-3xl" onClick={() => setShowCheckout(false)}></div>
           <div className="glass-panel w-full max-w-xl p-10 rounded-[4rem] border border-yellow-500/30 shadow-[0_0_120px_rgba(234,179,8,0.15)] relative z-10 animate-in zoom-in-95">
              <div className="text-center space-y-4 mb-8">
                 <div className="w-20 h-20 bg-yellow-500 rounded-[2.5rem] flex items-center justify-center mx-auto shadow-2xl shadow-yellow-500/20">
                    <svg className="w-10 h-10 text-black" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 2a1 1 0 011 1v1.323l3.954 1.582 1.599-.8a1 1 0 01.894 1.79l-1.233.616 1.738 2.318a1 1 0 01-.274 1.408l-4.473 3.354 1.233 1.233a1 1 0 01-1.414 1.414l-1.499-1.5a1 1 0 01-.01-1.405l4.472-3.354-1.244-1.659L10 9.12l-2.783.556-1.244 1.659 4.472 3.354a1 1 0 01-.01 1.405l-1.499 1.5a1 1 0 01-1.414-1.414l1.233-1.233-4.473-3.354a1 1 0 01-.274-1.408l1.738-2.318-1.233-.616a1 1 0 11.894-1.79l1.599.8L9 4.323V3a1 1 0 011-1z" clipRule="evenodd" /></svg>
                 </div>
                 <h2 className="text-4xl font-black text-white uppercase tracking-tighter italic">Quantum Pro</h2>
                 <p className="text-gray-400 text-sm">Desbloqueie o potencial máximo de análise preditiva.</p>
                 <div className="text-6xl font-black text-yellow-500">R$ 30,00</div>
                 <p className="text-[10px] font-black text-gray-500 uppercase tracking-[0.3em]">Acesso Vitalício Individual</p>
              </div>

              <div className="space-y-4 mb-10 px-4">
                 {[
                   "Sincronização com Resultados Oficiais (CEF)",
                   "Gerador de 10 Matrizes Alpha por Ciclo",
                   "Salvamento Automático em Banco de Dados",
                   "Heatmap de Frequência de Alta Precisão",
                   "Histórico de Simulação Ilimitado"
                 ].map((feat, i) => (
                   <div key={i} className="flex items-center gap-4 text-sm text-gray-300">
                      <div className="w-6 h-6 bg-yellow-500/20 text-yellow-500 rounded-full flex items-center justify-center text-xs">✓</div>
                      {feat}
                   </div>
                 ))}
              </div>

              <button onClick={activatePro} className="w-full py-6 bg-yellow-500 hover:bg-yellow-600 text-black font-black uppercase rounded-[2rem] transition-all shadow-2xl shadow-yellow-500/20 text-sm tracking-widest">Ativar Terminal Pro via PIX</button>
           </div>
        </div>
      )}

      {notification && (
        <div className={`fixed top-6 left-1/2 -translate-x-1/2 z-[300] px-8 py-4 rounded-[1.5rem] shadow-2xl border flex items-center gap-4 animate-in fade-in slide-in-from-top-6 duration-300
          ${notification.type === 'error' ? 'bg-red-600 border-red-500 text-white' : 
            notification.type === 'success' ? 'bg-emerald-600 border-emerald-500 text-white' : 
            'bg-blue-600 border-blue-500 text-white'}`}>
          <div className="w-2 h-2 rounded-full bg-white animate-ping"></div>
          <span className="text-[11px] font-black uppercase tracking-[0.1em]">{notification.msg}</span>
        </div>
      )}

      <header className="glass-panel sticky top-0 z-[100] px-8 py-5 flex flex-col md:flex-row items-center justify-between border-b border-white/5 shadow-2xl backdrop-blur-2xl gap-6">
        <div className="flex items-center gap-5">
          <div className={`w-12 h-12 rounded-[1.2rem] flex items-center justify-center shadow-2xl animate-pulse ${isPro ? 'bg-yellow-500 text-black shadow-yellow-500/20' : 'bg-blue-600 text-white shadow-blue-500/20'}`}>
            <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tighter text-white italic uppercase">LOTTOSIM <span className={isPro ? 'text-yellow-500' : 'text-blue-500'}>{isPro ? 'QUANTUM PRO' : 'QUANTUM FREE'}</span></h1>
            <p className="text-[9px] font-black text-gray-500 uppercase tracking-[0.4em]">Engine v8 • Data-Sync Active</p>
          </div>
        </div>

        <nav className="bg-black/50 p-1.5 rounded-[1.5rem] border border-white/5 flex gap-2">
           <button onClick={() => setCurrentView('simulator')} className={`px-8 py-2.5 rounded-2xl text-[10px] font-black uppercase transition-all ${currentView === 'simulator' ? (isPro ? 'bg-yellow-500 text-black' : 'bg-blue-600 text-white') : 'text-gray-500 hover:text-white'}`}>Simulador</button>
           <button onClick={() => setCurrentView('checker')} className={`px-8 py-2.5 rounded-2xl text-[10px] font-black uppercase transition-all ${currentView === 'checker' ? (isPro ? 'bg-yellow-500 text-black' : 'bg-blue-600 text-white') : 'text-gray-500 hover:text-white'}`}>Meus Bilhetes</button>
        </nav>

        <div className="flex gap-4">
           {!isPro ? (
             <button onClick={() => setShowCheckout(true)} className="px-6 py-2.5 bg-yellow-500 text-black text-[10px] font-black uppercase rounded-2xl hover:scale-105 transition-all shadow-xl shadow-yellow-500/20">Upgrade Pro</button>
           ) : (
             <button onClick={syncRealData} disabled={isSyncingReal} className="px-5 py-2.5 bg-emerald-600/10 text-emerald-500 text-[9px] font-black uppercase rounded-2xl border border-emerald-500/20 flex items-center gap-3">
               {isSyncingReal ? <div className="w-2.5 h-2.5 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div> : <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>}
               Sincronizar CEF
             </button>
           )}
           <select value={activeLottery} onChange={(e) => { setActiveLottery(e.target.value as LotteryType); setSelectedNumbers([]); setSavedBets([]); setRealDraw(null); }} className="bg-black/50 border border-white/10 text-white text-[10px] font-black uppercase px-5 py-2.5 rounded-2xl outline-none focus:border-blue-500 transition-colors cursor-pointer">
              {Object.values(LotteryType).map(t => <option key={t} value={t}>{LOTTERY_CONFIGS[t].name}</option>)}
           </select>
           <button onClick={handleLogout} className="w-12 h-12 bg-red-600/10 border border-red-600/20 text-red-500 rounded-[1.2rem] flex items-center justify-center hover:bg-red-600 hover:text-white transition-all group">
              <svg className="w-6 h-6 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
           </button>
        </div>
      </header>

      {currentView === 'simulator' ? (
        <main className="flex-1 max-w-[1600px] mx-auto w-full p-6 lg:p-10 grid grid-cols-1 lg:grid-cols-12 gap-10 animate-in slide-in-from-left-10 duration-700">
          <div className="lg:col-span-8 space-y-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div className="glass-panel p-6 rounded-[2rem] border-l-4 border-blue-600">
                <p className="text-[10px] font-black text-gray-500 uppercase mb-2">Custo Operacional</p>
                <p className="text-2xl font-black text-white mono">R$ {stats.totalSpent.toLocaleString('pt-BR')}</p>
              </div>
              <div className="glass-panel p-6 rounded-[2rem] border-l-4 border-emerald-600">
                <p className="text-[10px] font-black text-gray-500 uppercase mb-2">Ganhos Brutos</p>
                <p className="text-2xl font-black text-emerald-400 mono">R$ {stats.totalWon.toLocaleString('pt-BR')}</p>
              </div>
              <div className="glass-panel p-6 rounded-[2rem] border-l-4 border-yellow-500">
                <p className="text-[10px] font-black text-gray-500 uppercase mb-2">ROI Projetado</p>
                <p className={`text-2xl font-black mono ${roi >= 0 ? 'text-emerald-400' : 'text-red-500'}`}>{roi.toFixed(1)}%</p>
              </div>
              <div className="glass-panel p-6 rounded-[2rem] border-l-4 border-purple-600">
                <p className="text-[10px] font-black text-gray-500 uppercase mb-2">Engine Mode</p>
                <p className="text-2xl font-black text-white uppercase italic tracking-tighter">{isPro ? 'Quantum' : 'Basic'}</p>
              </div>
            </div>

            <section className="glass-panel p-10 rounded-[3.5rem] border border-white/5 relative overflow-hidden group shadow-2xl">
              <div className={`absolute -top-40 -right-40 w-96 h-96 blur-[150px] rounded-full transition-all duration-1000 ${isPro ? 'bg-yellow-500/10' : 'bg-blue-600/5'}`}></div>
              
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 relative z-10 gap-6">
                  <div className="flex flex-wrap items-center gap-6">
                    <div className={`px-8 py-3 rounded-2xl ${config.colorClass} text-white font-black text-xl shadow-2xl italic uppercase tracking-tighter`}>{config.name}</div>
                    {realDraw && (
                      <div className="px-5 py-2 bg-emerald-500/10 rounded-full border border-emerald-500/20 flex items-center gap-3">
                        <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest animate-pulse">Live: ID-{realDraw.contestNumber}</span>
                      </div>
                    )}
                  </div>
                  <button onClick={handleAlphaGenerate} className={`px-8 py-4 text-white text-[11px] font-black uppercase rounded-2xl transition-all shadow-2xl active:scale-95 ${isPro ? 'bg-yellow-600 hover:bg-yellow-700' : 'bg-blue-600 hover:bg-blue-700'}`}>
                    {isGeneratingAlpha ? (
                      <><div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> Processando IA...</>
                    ) : (isPro ? 'Gerar 10 Matrizes Alpha' : 'Gerar 3 Sugestões IA')}
                  </button>
              </div>

              <div className="grid grid-cols-5 sm:grid-cols-10 lg:grid-cols-12 gap-3 mb-10 relative z-10">
                  {Array.from({ length: config.totalNumbers }, (_, i) => i + 1).map(n => {
                    const isSelected = selectedNumbers.includes(n);
                    const freq = frequencyMap[n] || 0;
                    const heatIntensity = (freq / maxFreq) * 100;
                    return (
                      <button 
                        key={n} 
                        onClick={() => isSelected ? setSelectedNumbers(s => s.filter(x => x !== n)) : selectedNumbers.length < config.pickCount.max && setSelectedNumbers(s => [...s, n].sort((a,b)=>a-b))}
                        className={`relative h-16 rounded-2xl flex items-center justify-center text-sm font-black border transition-all duration-300
                          ${isSelected ? `${config.colorClass} text-white border-transparent shadow-2xl scale-110 z-10` : 'bg-white/5 text-gray-500 border-white/5 hover:border-white/20'}`}
                        style={(!isSelected && isPro) ? { backgroundColor: `rgba(234, 179, 8, ${Math.min(0.35, heatIntensity / 220)})` } : {}}
                      >
                        {n.toString().padStart(2, '0')}
                        {isPro && freq > 0 && !isSelected && (
                          <div className="absolute top-1 right-1.5 text-[8px] font-black text-yellow-500 opacity-70">{freq}</div>
                        )}
                      </button>
                    );
                  })}
              </div>

              <div className="flex flex-col md:flex-row gap-6 relative z-10">
                  <button 
                    disabled={selectedNumbers.length < config.pickCount.min}
                    onClick={performDraw}
                    className="flex-[2] py-6 bg-white text-black font-black uppercase rounded-3xl shadow-2xl hover:bg-slate-100 active:scale-95 transition-all disabled:opacity-20 text-sm tracking-[0.3em]"
                  >
                    Simular Ciclo Agora
                  </button>
                  <button 
                    disabled={selectedNumbers.length < config.pickCount.min}
                    onClick={() => saveTicket(selectedNumbers, activeLottery, "Aposta Manual")}
                    className="flex-1 py-6 bg-blue-600 text-white font-black uppercase rounded-3xl border border-blue-500/50 hover:bg-blue-700 transition-all text-xs tracking-[0.1em]"
                  >
                    Registrar Bilhete
                  </button>
              </div>
            </section> section
          </div>

          <div className="lg:col-span-4 space-y-8">
            <div className="glass-panel p-8 rounded-[2.5rem] border border-white/5 space-y-6 shadow-xl">
                <h3 className="text-sm font-black text-white uppercase tracking-[0.3em] flex items-center gap-3">
                   <div className={`w-2 h-7 rounded-full ${isPro ? 'bg-yellow-500' : 'bg-blue-600'}`}></div>
                   Data-Sync Terminal
                </h3>
                
                {realDraw ? (
                  <button 
                    onClick={() => setSelectedDrawId("REAL")}
                    className={`w-full p-6 rounded-[2rem] border transition-all text-left space-y-4 relative overflow-hidden group ${selectedDrawId === "REAL" ? 'bg-emerald-600 border-transparent shadow-2xl' : 'bg-black/50 border-emerald-600/20 hover:bg-emerald-600/5'}`}
                  >
                    <div className="flex justify-between items-center relative z-10">
                       <span className={`text-[11px] font-black uppercase tracking-widest ${selectedDrawId === "REAL" ? 'text-black' : 'text-emerald-500'}`}>Official Result: {realDraw.contestNumber}</span>
                       <span className={`text-[9px] font-bold ${selectedDrawId === "REAL" ? 'text-black/60' : 'text-gray-500'}`}>{realDraw.date}</span>
                    </div>
                    <div className="flex flex-wrap gap-2 relative z-10">
                       {realDraw.numbers.map((n: number) => (
                         <div key={n} className={`w-8 h-8 rounded-xl flex items-center justify-center text-[10px] font-black ${selectedDrawId === "REAL" ? 'bg-black/20 text-white' : 'bg-emerald-600/20 text-emerald-400'}`}>
                            {n.toString().padStart(2, '0')}
                         </div>
                       ))}
                    </div>
                  </button>
                ) : (
                  <div className="p-8 bg-black/50 rounded-[2rem] border border-dashed border-white/10 text-center space-y-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-ping mx-auto mb-2"></div>
                    <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Sincronizando Banco CEF...</p>
                  </div>
                )}

                <div className="space-y-3 mt-6 max-h-[300px] overflow-y-auto custom-scrollbar pr-2">
                   <p className="text-[9px] font-black text-gray-600 uppercase tracking-widest mb-3 ml-1">Simulated Archive</p>
                   {drawHistory.filter(d => d.type === activeLottery).length === 0 ? (
                     <p className="text-[10px] text-gray-700 italic ml-1">Nenhum registro encontrado.</p>
                   ) : (
                     drawHistory.filter(d => d.type === activeLottery).map(draw => (
                       <button 
                          key={draw.id} 
                          onClick={() => setSelectedDrawId(draw.id)}
                          className={`w-full p-4 rounded-2xl border transition-all flex justify-between items-center ${selectedDrawId === draw.id ? 'bg-blue-600 border-transparent text-white shadow-xl' : 'bg-white/5 border-white/5 text-gray-500 hover:bg-white/10'}`}
                       >
                          <span className="text-[10px] font-black uppercase tracking-tighter">{draw.id}</span>
                          <span className="text-[9px] opacity-60 mono">{new Date(draw.timestamp).toLocaleTimeString()}</span>
                       </button>
                     ))
                   )}
                </div>
            </div>

            <SlaProtocolBadge config={config} />
          </div>
        </main>
      ) : (
        <main className="flex-1 max-w-[1600px] mx-auto w-full p-6 lg:p-10 grid grid-cols-1 lg:grid-cols-12 gap-10 animate-in slide-in-from-right-10 duration-700">
           <div className="lg:col-span-8 space-y-8">
              <div className="flex justify-between items-center px-2">
                 <div>
                    <h2 className="text-3xl font-black text-white italic uppercase tracking-tighter">Inventory Control</h2>
                    <p className="text-[11px] font-black text-gray-600 uppercase tracking-[0.2em]">
                       {selectedDrawId === "REAL" ? `Comparando com Concurso Oficial ${realDraw?.contestNumber}` : 'Comparando com Ciclo de Simulação'}
                    </p>
                 </div>
                 <button onClick={() => setUserBets([])} className="px-6 py-3 bg-red-600/10 text-red-500 text-[10px] font-black uppercase rounded-2xl border border-red-600/20 hover:bg-red-600 hover:text-white transition-all">Format Terminal</button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-h-[75vh] overflow-y-auto custom-scrollbar pr-4">
                 {userBets.filter(b => b.type === activeLottery).length === 0 ? (
                   <div className="col-span-full glass-panel p-24 rounded-[4rem] border border-white/5 text-center flex flex-col items-center justify-center gap-6 shadow-2xl">
                      <p className="text-sm font-black text-gray-700 uppercase tracking-[0.3em]">Nenhum bilhete ativo no sistema.</p>
                      <button onClick={() => setCurrentView('simulator')} className="px-10 py-4 bg-blue-600 text-white rounded-[1.5rem] font-black uppercase text-[10px] tracking-widest shadow-2xl hover:bg-blue-700 transition-all">Acessar Simulador</button>
                   </div>
                 ) : (
                   userBets.filter(b => b.type === activeLottery).map(bet => {
                      const hitsNumbers = selectedDraw ? bet.numbers.filter(n => selectedDraw.numbers.includes(n)) : [];
                      const hits = hitsNumbers.length;
                      const winTier = selectedDraw ? LOTTERY_CONFIGS[bet.type].winTiers.find(t => t.hits === hits) : null;
                      
                      return (
                        <div key={bet.id} className={`glass-panel p-8 rounded-[2.5rem] border transition-all duration-500 shadow-xl ${hits >= (config.winTiers[config.winTiers.length-1].hits) ? 'border-emerald-600/60 bg-emerald-600/5 scale-[1.02]' : 'border-white/5'}`}>
                           <div className="flex justify-between items-start mb-6">
                              <div>
                                 <span className={`text-[11px] font-black uppercase tracking-widest block mb-1 ${bet.label?.includes('IA') ? 'text-yellow-500' : 'text-blue-400'}`}>{bet.label || 'Manual Record'}</span>
                                 <span className="text-[9px] text-gray-600 font-bold uppercase tracking-widest">{bet.id}</span>
                              </div>
                              {selectedDraw && (
                                <div className={`px-4 py-1.5 rounded-xl font-black text-[11px] ${hits > 0 ? 'bg-emerald-600 text-white shadow-lg' : 'bg-black/40 text-gray-700'}`}>
                                   {hits} HITS
                                </div>
                              )}
                           </div>
                           <div className="flex flex-wrap gap-2.5 mb-8">
                              {bet.numbers.map(n => {
                                 const isHit = selectedDraw?.numbers.includes(n);
                                 return (
                                   <div key={n} className={`w-9 h-9 rounded-2xl flex items-center justify-center text-[11px] font-black transition-all duration-300 ${isHit ? 'bg-emerald-600 text-white shadow-2xl scale-110' : 'bg-black/50 text-gray-500 border border-white/5'}`}>
                                      {n.toString().padStart(2, '0')}
                                   </div>
                                 );
                              })}
                           </div>
                           {selectedDraw && winTier && (
                             <div className="bg-emerald-600 text-white p-4 rounded-2xl flex justify-between items-center shadow-2xl animate-in zoom-in-95">
                                <span className="text-[10px] font-black uppercase tracking-widest italic">{winTier.label}</span>
                                <span className="text-sm font-black mono tracking-tighter">R$ {winTier.approxPrize.toLocaleString('pt-BR')}</span>
                             </div>
                           )}
                        </div>
                      );
                   })
                 )}
              </div>
           </div>
        </main>
      )}

      <footer className="py-10 px-12 border-t border-white/5 bg-black/40 flex flex-col items-center gap-6">
        <p className="text-[10px] text-gray-700 font-black uppercase tracking-[0.8em] opacity-40 italic">Quantum Engineering Systems • Professional Data Terminal • v8.0.4</p>
      </footer>
    </div>
  );
};

export default App;
