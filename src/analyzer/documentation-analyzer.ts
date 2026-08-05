import type { ChangeDetectionResult } from '../models/change-model';
import type { DocumentationAnalysisItem, DocumentationAnalysisResult } from '../models/analysis-model';
import type { RepositoryModel, ScannedFile } from '../models/repository-model';

export class DocumentationAnalyzer {
  constructor(
    private readonly repository: RepositoryModel,
    private readonly changeSet: ChangeDetectionResult,
  ) {}

  analyze(): DocumentationAnalysisResult {
    const documentationFiles = this.repository.documentationFiles;
    const detectedChanges = this.changeSet.changes;
    const hasChanges = this.changeSet.hasChanges;
    const items: DocumentationAnalysisItem[] = [];
    const generatedSections: DocumentationAnalysisResult['generatedSections'] = [];

    const supportedTargets = [
      'README.md',
      'CHANGELOG.md',
      'docs/',
      'docs/api/',
      'architecture/',
    ];

    for (const target of supportedTargets) {
      const matchingFile = this.findDocumentationTarget(documentationFiles, target);

      if (!matchingFile) {
        items.push({
          status: 'missing',
          file: null,
          reason: `Documentation target '${target}' is missing from the repository.`,
        });
        generatedSections.push({
          classification: target,
          status: 'missing',
          file: null,
        });
        continue;
      }

      if (hasChanges) {
        items.push({
          status: 'outdated',
          file: matchingFile,
          reason: `Detected repository changes affect '${target}'. Existing documentation may be stale.`,
        });
        generatedSections.push({
          classification: target,
          status: 'outdated',
          file: matchingFile,
        });
        continue;
      }

      items.push({
        status: 'up-to-date',
        file: matchingFile,
        reason: `Documentation target '${target}' is present and no repository changes were detected.`,
      });
      generatedSections.push({
        classification: target,
        status: 'up-to-date',
        file: matchingFile,
      });
    }

    const unresolved = detectedChanges.filter((change) => {
      const file = change.file;
      const filePath = file.relativePath.toLowerCase();
      return filePath.includes('docs/') || filePath.includes('readme.md') || filePath.includes('changelog.md');
    });

    if (unresolved.length > 0) {
      items.push({
        status: 'uncertain',
        file: null,
        reason: 'Some file-level changes could not be conclusively mapped to documentation sections.',
      });
      generatedSections.push({
        classification: 'unmapped-changes',
        status: 'uncertain',
        file: null,
      });
    }

    return {
      repository: this.repository,
      changeSet: this.changeSet,
      items,
      generatedSections,
    };
  }

  private findDocumentationTarget(documentationFiles: ScannedFile[], target: string): ScannedFile | undefined {
    const normalizedTarget = target.toLowerCase();
    const candidates = documentationFiles
      .filter((file) => {
        const relativePath = file.relativePath.toLowerCase();

        if (target === 'README.md' || target === 'CHANGELOG.md') {
          return relativePath === normalizedTarget;
        }

        if (target === 'docs/') {
          return relativePath.startsWith('docs/') && !relativePath.startsWith('docs/api/');
        }

        if (target === 'docs/api/') {
          return relativePath.startsWith('docs/api/');
        }

        if (target === 'architecture/') {
          return relativePath.startsWith('architecture/');
        }

        return relativePath === normalizedTarget || relativePath.startsWith(normalizedTarget);
      })
      .sort((left, right) => left.relativePath.localeCompare(right.relativePath));

    return candidates[0];
  }
}
