
import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { LotteryType, DrawResult, SimulationStats, AlphaCandidate, BacktestResult, UserBet } from './types';
import { LOTTERY_CONFIGS } from './constants';
import { generateAlphaBatch } from './services/geminiService';
import HistoryView from './components/HistoryView';
import SlaProtocolBadge from './components/SlaProtocolBadge';

const STORAGE_KEY = 'LOTTOSIM_QUANTUM_V8.0.0';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<'simulator' | 'checker'>('simulator');
  const [notification, setNotification] = useState<{msg: string, type: 'info' | 'error' | 'success'} | null>(null);
  const [inspectedBet, setInspectedBet] = useState<AlphaCandidate | null>(null);

  const getInitialState = useCallback(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return null;
    try { return JSON.parse(saved); } catch (e) { return null; }
  }, []);

  const initialState = getInitialState();

  const [activeLottery, setActiveLottery] = useState<LotteryType>(initialState?.activeLottery || LotteryType.MEGA_SENA);
  const [selectedNumbers, setSelectedNumbers] = useState<number[]>(initialState?.selectedNumbers || []);
  const [drawHistory, setDrawHistory] = useState<DrawResult[]>(initialState?.drawHistory || []);
  const [userBets, setUserBets] = useState<UserBet[]>(initialState?.userBets || []);
  const [stats, setStats] = useState<SimulationStats>(initialState?.stats || { totalSpent: 0, totalWon: 0, drawCount: 0, tierHits: {} });
  const [simulationSpeed, setSimulationSpeed] = useState<number>(initialState?.simulationSpeed || 800);
  const [frequencyMap, setFrequencyMap] = useState<Record<number, number>>(initialState?.frequencyMap || {});
  const [savedBets, setSavedBets] = useState<AlphaCandidate[]>(initialState?.savedBets || []);
  const [autoSimulate, setAutoSimulate] = useState(false);
  const [isGeneratingAlpha, setIsGeneratingAlpha] = useState(false);
  
  // States for Checker View
  const [selectedDrawId, setSelectedDrawId] = useState<string>("");

  const config = LOTTERY_CONFIGS[activeLottery];
  const simulationIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Persistence
  useEffect(() => {
    const stateToSave = { activeLottery, selectedNumbers, drawHistory, userBets, stats, simulationSpeed, frequencyMap, savedBets };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stateToSave));
  }, [activeLottery, selectedNumbers, drawHistory, userBets, stats, simulationSpeed, frequencyMap, savedBets]);

  // Logic to clear notifications after 10 seconds
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => {
        setNotification(null);
      }, 10000); 
      return () =>