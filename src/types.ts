
export enum LotteryType {
  MEGA_SENA = 'MEGA_SENA',
  LOTOFACIL = 'LOTOFACIL',
  QUINA = 'QUINA',
  LOTOMANIA = 'LOTOMANIA'
}

export interface WinTier {
  hits: number;
  label: string;
  approxPrize: number;
  isFixed: boolean;
}

export interface LotteryConfig {
  id: LotteryType;
  name: string;
  totalNumbers: number;
  pickCount: { min: number; max: number };
  drawCount: number;
  winTiers: WinTier[];
  colorClass: string;
  textClass: string;
  sla: {
    frequency: string;
    processingTime: string;
    reliability: string;
  };
  pricePerBet: number;
  idealSumRange: [number, number];
}

export interface DrawResult {
  id: string;
  type: LotteryType;
  numbers: number[];
  timestamp: number;
  prizeAwarded?: number;
}

export interface UserBet {
  id: string;
  type: LotteryType;
  numbers: number[];
  createdAt: number;
  label?: string;
}

export interface AlphaCandidate {
  id: string;
  type: LotteryType;
  numbers: number[];
  strategy: string;
  probabilityScore: number;
  createdAt: number;
  lastCheckHits?: number;
  isWinner?: boolean;
}

export interface SimulationStats {
  totalSpent: number;
  totalWon: number;
  drawCount: number;
  tierHits: Record<string, number>;
}

export interface BacktestResult {
  timesTested: number;
  hitsCount: Record<number, number>;
  totalPrizeHistory: number;
}
