export type GoalHistoryPoint = {
  value: number;
  recordedAt: string;
};

export type GoalVM = {
  id: string | null;
  current: number;
  target: number;
  pricePerClient: number;
  history: GoalHistoryPoint[];
};
