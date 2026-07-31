import type { RepositoryModel, ScannedFile } from './repository-model';

export type ChangeType = 'added' | 'modified' | 'deleted';

export interface FileChange {
  type: ChangeType;
  file: ScannedFile;
}

export interface ChangeDetectionResult {
  repository: RepositoryModel;
  changes: FileChange[];
  addedFiles: ScannedFile[];
  modifiedFiles: ScannedFile[];
  deletedFiles: ScannedFile[];
  hasChanges: boolean;
}
