import type { GenerationResult } from '../models/generation-model';
import type { SynchronizationReport, ReportGeneratorInput } from '../models/report-model';

export class ReportGenerator {
  constructor(private readonly input: ReportGeneratorInput) {}

  generate(): SynchronizationReport {
    const generation = this.input.generation;
    const generatedFiles = generation.generatedContent.map((entry) => entry.target);
    const generatedDocumentationSummary = generation.generatedContent.map((entry) => `- ${entry.target}`);
    const skippedItems = generation.skippedItems;
    const validationWarnings = generation.validation.warnings;
    const generationWarnings = generation.warnings;
    const generatedCount = generation.generatedContent.length;
    const skippedCount = skippedItems.length;
    const warningCount = validationWarnings.length + generationWarnings.length;

    const status = generatedCount > 0 && warningCount === 0 ? 'success' : warningCount > 0 ? 'warning' : 'blocked';

    const markdown = [
      '# Documentation Synchronization Report',
      '',
      '## Generated Documentation Summary',
      '',
      ...generatedDocumentationSummary,
      '',
      '## Generated Files',
      '',
      ...generatedFiles.map((file) => `- ${file}`),
      '',
      '## Skipped Items',
      '',
      ...skippedItems.map((item) => `- ${item.section}: ${item.reason}`),
      '',
      '## Validation Warnings',
      '',
      ...validationWarnings.map((warning) => `- ${warning.section}: ${warning.reason}`),
      '',
      '## Generation Warnings',
      '',
      ...generationWarnings.map((warning) => `- ${warning.section}: ${warning.reason}`),
      '',
      '## Execution Summary',
      '',
      `- Generated count: ${generatedCount}`,
      `- Skipped count: ${skippedCount}`,
      `- Warning count: ${warningCount}`,
      `- Status: ${status}`,
      '',
    ].join('\n');

    return {
      markdown,
      generatedDocumentationSummary,
      generatedFiles,
      skippedItems,
      validationWarnings,
      generationWarnings,
      executionSummary: {
        generatedCount,
        skippedCount,
        warningCount,
        status,
      },
    };
  }
}
