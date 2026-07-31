import type { DocumentationAnalysisResult } from './analysis-model';

export type ValidationDecision = 'Approved' | 'Warning' | 'Skipped';

export interface ValidationWarning {
  section: string;
  reason: string;
}

export interface ValidationSkippedSection {
  section: string;
  reason: string;
}

export interface ValidationCandidate {
  section: string;
  status: ValidationDecision;
  warnings: ValidationWarning[];
  skippedReason?: string;
}

export interface ValidationResult {
  analysis: DocumentationAnalysisResult;
  candidates: ValidationCandidate[];
  warnings: ValidationWarning[];
  skippedSections: ValidationSkippedSection[];
}

export interface ValidationRules {
  lowConfidenceThreshold: number;
  minimumCoverageForApproval: number;
  requireExplicitDocumentedSection: boolean;
}
