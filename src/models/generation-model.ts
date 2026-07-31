import type { ValidationResult } from './validation-model';

export interface GeneratedDocumentationEntry {
  target: string;
  content: string;
  relatedSection: string;
}

export interface GenerationSkippedItem {
  section: string;
  reason: string;
}

export interface GenerationWarning {
  section: string;
  reason: string;
}

export interface GenerationResult {
  validation: ValidationResult;
  generatedContent: GeneratedDocumentationEntry[];
  skippedItems: GenerationSkippedItem[];
  warnings: GenerationWarning[];
}
