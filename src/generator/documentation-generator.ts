import type { ValidationResult } from '../models/validation-model';
import type { GenerationResult, GeneratedDocumentationEntry, GenerationSkippedItem, GenerationWarning } from '../models/generation-model';

export class DocumentationGenerator {
  constructor(private readonly validation: ValidationResult) {}

  generate(): GenerationResult {
    const generatedContent: GeneratedDocumentationEntry[] = [];
    const skippedItems: GenerationSkippedItem[] = [];
    const warnings: GenerationWarning[] = [];

    for (const candidate of this.validation.candidates) {
      if (candidate.status === 'Approved') {
        generatedContent.push(this.renderCandidate(candidate.section));
        continue;
      }

      if (candidate.status === 'Skipped') {
        this.pushUniqueSkippedItem(skippedItems, candidate.section, candidate.skippedReason ?? 'Section was not generated due to validation constraints.');
        continue;
      }

      for (const warning of candidate.warnings) {
        this.pushUniqueWarning(warnings, warning.section, warning.reason);
      }
    }

    for (const warning of this.validation.warnings) {
      this.pushUniqueWarning(warnings, warning.section, warning.reason);
    }

    for (const skippedSection of this.validation.skippedSections) {
      this.pushUniqueSkippedItem(skippedItems, skippedSection.section, skippedSection.reason);
    }

    return {
      validation: this.validation,
      generatedContent,
      skippedItems,
      warnings,
    };
  }

  private renderCandidate(section: string): GeneratedDocumentationEntry {
    const target = this.normalizeTarget(section);
    return {
      target,
      relatedSection: section,
      content: this.renderMarkdown(target),
    };
  }

  private normalizeTarget(section: string): string {
    if (section === 'README.md') return 'README.md';
    if (section === 'CHANGELOG.md') return 'CHANGELOG.md';
    if (section.startsWith('docs/api/')) return 'api';
    if (section.startsWith('docs/')) return 'docs/';
    if (section.startsWith('architecture/')) return 'architecture';
    return section;
  }

  private pushUniqueWarning(collection: GenerationWarning[], section: string, reason: string): void {
    const hasExistingWarning = collection.some((warning) => warning.section === section && warning.reason === reason);
    if (!hasExistingWarning) {
      collection.push({ section, reason });
    }
  }

  private pushUniqueSkippedItem(collection: GenerationSkippedItem[], section: string, reason: string): void {
    const hasExistingSkip = collection.some((item) => item.section === section && item.reason === reason);
    if (!hasExistingSkip) {
      collection.push({ section, reason });
    }
  }

  private renderMarkdown(target: string): string {
    switch (target) {
      case 'README.md':
        return '# README\n\nThis document has been prepared for review and reflects the validated repository state.';
      case 'docs/':
        return '# Documentation\n\nThis section provides a review-ready summary of documentation changes for the approved target.';
      case 'api':
        return '# API Documentation\n\nThis review-ready API documentation proposal reflects the approved validation state.';
      case 'architecture':
        return '# Architecture Documentation\n\nThis proposal captures the approved architectural context and expected documentation scope.';
      case 'CHANGELOG.md':
        return '# Changelog\n\nThis changelog snapshot is intended for review and reflects validated repository changes.';
      default:
        return `# ${target}\n\nThis content was generated for review and is based on the approved validation outcome.`;
    }
  }
}
