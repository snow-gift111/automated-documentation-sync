import { randomUUID } from 'node:crypto';
import { PipelineOrchestrator } from '../core/pipeline-orchestrator';
import { RepositoryScanner } from '../scanner/repository-scanner';
import { AuditStore } from '../audit/audit-store';
import { GitService } from '../git/git-service';

interface CliOptions {
  repositoryPath: string;
  outputDirectory?: string;
  verbose: boolean;
}

export async function runCli(argv: string[] = process.argv.slice(2)): Promise<number> {
  if (argv.length === 0) {
    console.log('Automated Documentation Sync CLI initialized.');
    return 0;
  }

  const options = parseCliArgs(argv);

  const pipeline = new PipelineOrchestrator(
    options.repositoryPath,
    new GitService(options.repositoryPath),
    new RepositoryScanner(options.repositoryPath),
    new AuditStore(),
  );

  const result = await pipeline.run();
  const summary = formatSummary(result, options.verbose);

  console.log(summary);

  return result.executionStatus === 'failed' ? 1 : 0;
}

function parseCliArgs(argv: string[]): CliOptions {
  let repositoryPath = '';
  let outputDirectory: string | undefined;
  let verbose = false;

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];

    if (arg === '--verbose') {
      verbose = true;
      continue;
    }

    if (arg === '--output' || arg === '--out') {
      outputDirectory = argv[i + 1];
      i += 1;
      continue;
    }

    if (arg === '--repo') {
      repositoryPath = argv[i + 1] ?? '';
      i += 1;
      continue;
    }

    if (!repositoryPath) {
      repositoryPath = arg;
    }
  }

  if (!repositoryPath) {
    throw new Error('Repository path is required.');
  }

  return {
    repositoryPath,
    outputDirectory,
    verbose,
  };
}

function formatSummary(result: Awaited<ReturnType<PipelineOrchestrator['run']>>, verbose: boolean): string {
  const lines = [
    `Run ID: ${result.runId}`,
    `Status: ${result.executionStatus}`,
    `Completed stages: ${result.completedStages.join(', ') || 'none'}`,
  ];

  if (result.failedStage) {
    lines.push(`Failed stage: ${result.failedStage}`);
  }

  if (verbose && result.generatedReport) {
    lines.push(`Generated files: ${result.generatedReport.generatedFiles.join(', ') || 'none'}`);
  }

  if (result.reviewDecision) {
    lines.push(`Review decision: ${result.reviewDecision.reviewState}`);
  }

  if (result.auditRecordReference) {
    lines.push(`Audit reference: ${result.auditRecordReference}`);
  }

  return lines.join('\n');
}
