import { PhraseMetrics, Phrase } from '../../helpers/database.js';

function recalculatePersent(success: number, wrong: number): number {
  return Math.round((success / (success + wrong)) * 100);
}

export function recalculateMetrics(metrics: PhraseMetrics, isWrong: boolean, trashhold: number): PhraseMetrics {
  const { success, wrong } = metrics;
  isWrong ? (metrics.wrong += 1) : (metrics.success += 1);

  if ((success + wrong) > trashhold) {
    metrics.percent = recalculatePersent(success, wrong);
  }

  return metrics;
}

export function pretifyAsk(ph: Phrase, count: number, all: number): string {
  return `${ph.phTo}

(${count}/${all})
`
}
