import type { RepositoryModel, ScannedFile } from '../models/repository-model';
import type { ChangeDetectionResult, ChangeType, FileChange } from '../models/change-model';

export class ChangeDetector {
  constructor(private readonly repositoryModel: RepositoryModel) {}

  detectChanges(previousState?: RepositoryModel): ChangeDetectionResult {
    const currentFiles = this.collectAllFiles(this.repositoryModel).sort(this.sortByRelativePath);
    const previousFiles = previousState ? this.collectAllFiles(previousState).sort(this.sortByRelativePath) : [];

    const previousMap = new Map(previousFiles.map((file) => [file.relativePath, file]));
    const currentMap = new Map(currentFiles.map((file) => [file.relativePath, file]));

    const changes: FileChange[] = [];
    const addedFiles: ScannedFile[] = [];
    const modifiedFiles: ScannedFile[] = [];
    const deletedFiles: ScannedFile[] = [];

    for (const [relativePath, currentFile] of currentMap.entries()) {
      const previousFile = previousMap.get(relativePath);

      if (!previousFile) {
        const changeType: ChangeType = 'added';
        changes.push({ type: changeType, file: currentFile });
        addedFiles.push(currentFile);
        continue;
      }

      if (this.isModified(previousFile, currentFile)) {
        const changeType: ChangeType = 'modified';
        changes.push({ type: changeType, file: currentFile });
        modifiedFiles.push(currentFile);
      }
    }

    for (const [relativePath, previousFile] of previousMap.entries()) {
      if (!currentMap.has(relativePath)) {
        const changeType: ChangeType = 'deleted';
        changes.push({ type: changeType, file: previousFile });
        deletedFiles.push(previousFile);
      }
    }

    return {
      repository: this.repositoryModel,
      changes: changes.sort((left, right) => left.file.relativePath.localeCompare(right.file.relativePath)),
      addedFiles: addedFiles.sort(this.sortByRelativePath),
      modifiedFiles: modifiedFiles.sort(this.sortByRelativePath),
      deletedFiles: deletedFiles.sort(this.sortByRelativePath),
      hasChanges: changes.length > 0,
    };
  }

  private collectAllFiles(repository: RepositoryModel): ScannedFile[] {
    return [
      ...repository.sourceFiles,
      ...repository.documentationFiles,
      ...repository.metadataFiles,
    ];
  }

  private isModified(previousFile: ScannedFile, currentFile: ScannedFile): boolean {
    return (
      previousFile.kind !== currentFile.kind ||
      previousFile.documentationKind !== currentFile.documentationKind ||
      previousFile.extension !== currentFile.extension ||
      previousFile.contentHash !== currentFile.contentHash
    );
  }

  private sortByRelativePath(left: ScannedFile, right: ScannedFile): number {
    return left.relativePath.localeCompare(right.relativePath);
  }
}
