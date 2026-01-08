
import { LotteryType, LotteryConfig } from './types';

export const LOTTERY_CONFIGS: Record<LotteryType, LotteryConfig> = {
  [LotteryType.MEGA_SENA]: {
    id: LotteryType.MEGA_SENA,
    name: 'Mega-Sena',
    totalNumbers: 60,
    pickCount: { min: 6, max: 15 },
    drawCount: 6,
    winTiers: [
      { hits: 6, label: 'Sena', approxPrize: 35000000.00, isFixed: false },
      { hits: 5, label: 'Quina', approxPrize: 45000.00, isFixed: false },
      { hits: 4, label: 'Quadra', approxPrize: 1100.00, isFixed: false }
    ],
    colorClass: 'bg-mega-sena',
    textClass: 'text-mega-sena',
    sla: {
      frequency: 'Qua/Sáb 20h',
      processingTime: '< 500ms',
      reliability: '99.9% Prob. Analysis'
    },
    pricePerBet: 5.00,
    idealSumRange: [150, 220]
  },
  [LotteryType.LOTOFACIL]: {
    id: LotteryType.LOTOFACIL,
    name: 'LotoFácil',
    totalNumbers: 25,
    pickCount: { min: 15, max: 20 },
    drawCount: 15,
    winTiers: [
      { hits: 15, label: '15 Acertos', approxPrize: 1500000.00, isFixed: false },
      { hits: 14, label: '14 Acertos', approxPrize: 1500.00, isFixed: false },
      { hits: 13, label: '13 Acertos', approxPrize: 30.00, isFixed: true },
      { hits: 12, label: '12 Acertos', approxPrize: 12.00, isFixed: true },
      { hits: 11, label: '11 Acertos', approxPrize: 6.00, isFixed: true }
    ],
    colorClass: 'bg-lotofacil',
    textClass: 'text-lotofacil',
    sla: {
      frequency: 'Diário 20h',
      processingTime: '< 200ms',
      reliability: 'High Volume Verification'
    },
    pricePerBet: 3.00,
    idealSumRange: [180, 210]
  },
  [LotteryType.QUINA]: {
    id: LotteryType.QUINA,
    name: 'Quina',
    totalNumbers: 80,
    pickCount: { min: 5, max: 15 },
    drawCount: 5,
    winTiers: [
      { hits: 5, label: 'Quina', approxPrize: 5000000.00, isFixed: false },
      { hits: 4, label: 'Quadra', approxPrize: 8500.00, isFixed: false },
      { hits: 3, label: 'Terno', approxPrize: 160.00, isFixed: false },
      { hits: 2, label: 'Duque', approxPrize: 4.50, isFixed: false }
    ],
    colorClass: 'bg-quina',
    textClass: 'text-quina',
    sla: {
      frequency: 'Seg a Sáb 20h',
      processingTime: '< 300ms',
      reliability: 'Multi-Tier Validation'
    },
    pricePerBet: 2.50,
    idealSumRange: [160, 240]
  },
  [LotteryType.LOTOMANIA]: {
    id: LotteryType.LOTOMANIA,
    name: 'Lotomania',
    totalNumbers: 100,
    pickCount: { min: 50, max: 50 },
    drawCount: 20,
    winTiers: [
      { hits: 20, label: '20 Acertos', approxPrize: 5000000.00, isFixed: false },
      { hits: 19, label: '19 Acertos', approxPrize: 35000.00, isFixed: false },
      { hits: 18, label: '18 Acertos', approxPrize: 2500.00, isFixed: false },
      { hits: 17, label: '17 Acertos', approxPrize: 250.00, isFixed: false },
      { hits: 16, label: '16 Acertos', approxPrize: 50.00, isFixed: false },
      { hits: 15, label: '15 Acertos', approxPrize: 10.00, isFixed: false },
      { hits: 0, label: 'Zero Acertos', approxPrize: 120000.00, isFixed: false }
    ],
    colorClass: 'bg-orange-500',
    textClass: 'text-orange-500',
    sla: {
      frequency: 'Seg/Qua/Sex 20h',
      processingTime: '< 800ms',
      reliability: 'Full Grid Comparison'
    },
    pricePerBet: 3.00,
    idealSumRange: [2400, 2600]
  }
};
