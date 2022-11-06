import { CardMetrics, Card } from '../../helpers/database.js';

function recalculatePersent(success: number, wrong: number): number {
  return Math.round((success / (success + wrong)) * 100);
}

export function recalculateMetrics(metrics: CardMetrics, isWrong: boolean, trashhold: number): CardMetrics {
  isWrong ? (metrics.wrong += 1) : (metrics.success += 1);

  const { success, wrong } = metrics;
  if ((success + wrong) > trashhold) {
    metrics.percent = recalculatePersent(success, wrong);
  }

  return metrics;
}

export function pretifyAsk(ph: Card, count: number, all: number): string {
  return `${ph.term}

(${count}/${all})
`
}
