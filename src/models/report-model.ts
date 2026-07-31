import type { GenerationResult } from './generation-model';

export interface ReportExecutionSummary {
  generatedCount: number;
  skippedCount: number;
  warningCount: number;
  status: 'success' | 'warning' | 'blocked';
}

export interface SynchronizationReport {
  markdown: string;
  generatedDocumentationSummary: string[];
  generatedFiles: string[];
  skippedItems: Array<{
    section: string;
    reason: string;
  }>;
  validationWarnings: Array<{
    section: string;
    reason: string;
  }>;
  generationWarnings: Array<{
    section: string;
    reason: string;
  }>;
  executionSummary: ReportExecutionSummary;
}

export interface ReportGeneratorInput {
  generation: GenerationResult;
}
