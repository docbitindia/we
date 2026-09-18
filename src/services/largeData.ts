export type ProcessingMode = 'small' | 'medium' | 'large' | 'very-large';
export interface ProcessingDecision {
  mode: ProcessingMode;
  reason: string;
  requiresServer: boolean;
}

/**
 * Choose processing strategy. Designed to keep the interactive editor
 * responsive even when users attempt to open files approaching 1 GB.
 * Browser memory and the main-thread table are deliberately capped;
 * anything beyond "medium" is routed to the async / server pipeline.
 */
export function chooseProcessingMode(
  file: File | { size: number },
  estimatedRows = 0,
  columns = 0
): ProcessingDecision {
  const mb = file.size / 1024 / 1024;
  const score = mb * 1 + estimatedRows / 5000 + columns / 20;

  // Hard browser safety: never try to fully materialize > ~80 MB or 250k rows in the grid.
  if (mb >= 80 || estimatedRows >= 250000 || score >= 100) {
    return {
      mode: 'very-large',
      reason:
        'Dataset exceeds safe browser limits. Use the server-side streaming pipeline for files up to 1024 MB.',
      requiresServer: true
    };
  }
  if (mb >= 20 || estimatedRows >= 80000 || score >= 35) {
    return {
      mode: 'large',
      reason:
        'Large dataset: process via object storage, server ingestion and an asynchronous report job. Editor shows a virtualized preview only.',
      requiresServer: true
    };
  }
  if (mb >= 4 || estimatedRows >= 15000 || score >= 8) {
    return {
      mode: 'medium',
      reason: 'Medium dataset: process in a Web Worker with chunked operations and a fully virtualized grid.',
      requiresServer: false
    };
  }
  return {
    mode: 'small',
    reason: 'Small dataset: browser processing is appropriate.',
    requiresServer: false
  };
}
