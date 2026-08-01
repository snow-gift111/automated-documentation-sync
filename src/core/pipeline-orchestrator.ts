import { randomUUID } from 'node:crypto';
import type { RepositoryModel } from '../models/repository-model';
import type { ChangeDetectionResult } from '../models/change-model';
import type { DocumentationAnalysisResult } from '../models/analysis-model';
import type { ValidationResult } from '../models/validation-model';
import type { GenerationResult } from '../models/generation-model';
import type { SynchronizationReport } from '../models/report-model';
import type { ReviewDecision } from '../models/review-model';
import type { AuditRecord } from '../models/audit-model';
import type { PipelineExecutionResult, PipelineStageName } from '../models/pipeline-model';
import { RepositoryScanner } from '../scanner/repository-scanner';
import { ChangeDetector } from '../detector/change-detector';
import { DocumentationAnalyzer } from '../analyzer/documentation-analyzer';
import { DocumentationValidator } from '../validator/documentation-validator';
import { DocumentationGenerator } from '../generator/documentation-generator';
import { ReportGenerator } from '../report/report-generator';
import { ReviewOrchestrator } from '../review/review-orchestrator';
import { AuditStore } from '../audit/audit-store';
import { GitService } from '../git/git-service';

export class PipelineOrchestrator {
  constructor(
    private readonly repositoryRoot: string,
    private readonly gitService: GitService,
    private readonly scanner: RepositoryScanner = new RepositoryScanner(repositoryRoot),
    private readonly auditStore: AuditStore = new AuditStore(),
  ) {}

  async run(): Promise<PipelineExecutionResult> {
    const runId = randomUUID();
    const completedStages: PipelineStageName[] = [];
    let currentStage: PipelineStageName = 'RepositoryScanner';

    try {
      const repositoryModel = await this.scanner.scanRepository();
      completedStages.push('RepositoryScanner');

      currentStage = 'ChangeDetector';
      const changeSet = new ChangeDetector(repositoryModel).detectChanges();
      completedStages.push('ChangeDetector');

      currentStage = 'DocumentationAnalyzer';
      const analysis = new DocumentationAnalyzer(repositoryModel, changeSet).analyze();
      completedStages.push('DocumentationAnalyzer');

      currentStage = 'DocumentationValidator';
      const validation = new DocumentationValidator(analysis).validate();
      completedStages.push('DocumentationValidator');

      currentStage = 'DocumentationGenerator';
      const generation = new DocumentationGenerator(validation).generate();
      completedStages.push('DocumentationGenerator');

      currentStage = 'ReportGenerator';
      const generatedReport = new ReportGenerator({ generation }).generate();
      completedStages.push('ReportGenerator');

      currentStage = 'ReviewOrchestrator';
      const reviewOrchestrator = new ReviewOrchestrator(generatedReport);
      const reviewDecision = reviewOrchestrator.transition('Approved');
      completedStages.push('ReviewOrchestrator');

      currentStage = 'AuditStore';
      const auditRecord = this.auditStore.record(runId, reviewDecision, generatedReport);
      completedStages.push('AuditStore');

      currentStage = 'GitService';
      this.gitService.getCurrentBranch(this.repositoryRoot);
      this.gitService.getLatestCommitHash(this.repositoryRoot);
      this.gitService.checkWorkingTreeStatus(this.repositoryRoot);
      this.gitService.createDiffSummary(this.repositoryRoot, ['README.md']);
      completedStages.push('GitService');

      return {
        runId,
        executionStatus: reviewDecision.canProceed ? 'success' : 'warning',
        completedStages,
        generatedReport,
        reviewDecision,
        auditRecordReference: auditRecord.runId,
        repositoryModel,
        auditRecord,
      };
    } catch (error) {
      return {
        runId,
        executionStatus: 'failed',
        completedStages,
        failedStage: currentStage,
      };
    }
  }

  private mapFailedStage(completedStages: PipelineStageName[]): PipelineStageName {
    const fallbackStages: PipelineStageName[] = [
      'RepositoryScanner',
      'ChangeDetector',
      'DocumentationAnalyzer',
      'DocumentationValidator',
      'DocumentationGenerator',
      'ReportGenerator',
      'ReviewOrchestrator',
      'AuditStore',
      'GitService',
    ];

    const lastCompleted = completedStages[completedStages.length - 1];
    return lastCompleted ?? fallbackStages[0];
  }
}
