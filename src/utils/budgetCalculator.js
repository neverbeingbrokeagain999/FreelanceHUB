export const calculateEstimatedCost = (complexity, hours) => {
  let baseRate = 50; // Medium complexity base rate
  
  switch (complexity) {
    case 'low':
      baseRate = 30;
      break;
    case 'high':
      baseRate = 70;
      break;
    default:
      baseRate = 50;
  }

  return baseRate * hours;
};

export const COMPLEXITY_OPTIONS = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high'
};

export const BASE_RATES = {
  [COMPLEXITY_OPTIONS.LOW]: 30,
  [COMPLEXITY_OPTIONS.MEDIUM]: 50,
  [COMPLEXITY_OPTIONS.HIGH]: 70
};
