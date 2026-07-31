import type { ChangeDetectionResult } from './change-model';
import type { RepositoryModel, ScannedFile } from './repository-model';

export type DocumentationStatus = 'up-to-date' | 'outdated' | 'missing' | 'uncertain';

export interface DocumentationAnalysisItem {
  status: DocumentationStatus;
  file: ScannedFile | null;
  reason: string;
}

export interface DocumentationAnalysisResult {
  repository: RepositoryModel;
  changeSet: ChangeDetectionResult;
  items: DocumentationAnalysisItem[];
  generatedSections: Array<{
    classification: string;
    status: DocumentationStatus;
    file: ScannedFile | null;
  }>;
}
