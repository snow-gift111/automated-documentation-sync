import type { DocumentationAnalysisResult, DocumentationAnalysisItem } from '../models/analysis-model';
import type { ValidationCandidate, ValidationResult, ValidationRules, ValidationSkippedSection, ValidationWarning } from '../models/validation-model';

export class DocumentationValidator {
  constructor(
    private readonly analysis: DocumentationAnalysisResult,
    private readonly rules: ValidationRules = {
      lowConfidenceThreshold: 0.5,
      minimumCoverageForApproval: 0.6,
      requireExplicitDocumentedSection: true,
    },
  ) {}

  validate(): ValidationResult {
    const candidates: ValidationCandidate[] = [];
    const warnings: ValidationWarning[] = [];
    const skippedSections: ValidationSkippedSection[] = [];

    for (const item of this.analysis.items) {
      const sectionName = item.file?.relativePath ?? 'unmapped-section';
      const status = this.classifySection(item);

      if (status === 'Skipped') {
        skippedSections.push({
          section: sectionName,
          reason: item.reason,
        });
      }

      if (status === 'Warning') {
        warnings.push({
          section: sectionName,
          reason: item.reason,
        });
      }

      candidates.push({
        section: sectionName,
        status,
        warnings,
        skippedReason: status === 'Skipped' ? item.reason : undefined,
      });
    }

    const approvedCount = candidates.filter((candidate) => candidate.status === 'Approved').length;
    const totalCandidates = candidates.length;
    const coverage = totalCandidates === 0 ? 0 : approvedCount / totalCandidates;

    if (coverage < this.rules.minimumCoverageForApproval) {
      warnings.push({
        section: 'overall-validation',
        reason: `Coverage ${coverage.toFixed(2)} is below the approved threshold ${this.rules.minimumCoverageForApproval.toFixed(2)}.`,
      });
    }

    return {
      analysis: this.analysis,
      candidates,
      warnings,
      skippedSections,
    };
  }

  private classifySection(item: DocumentationAnalysisItem): 'Approved' | 'Warning' | 'Skipped' {
    if (item.status === 'missing') {
      return 'Skipped';
    }

    if (item.status === 'uncertain') {
      return 'Warning';
    }

    if (item.status === 'outdated') {
      return 'Warning';
    }

    return 'Approved';
  }
}
