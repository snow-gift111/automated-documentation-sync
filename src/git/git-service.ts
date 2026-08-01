import { execFileSync } from 'node:child_process';
import type { GitDiffSummary } from '../models/git-model';

export class GitService {
  constructor(
    private readonly workingDirectory: string,
    private readonly executor: typeof execFileSync = execFileSync,
  ) {}

  detectRepositoryRoot(directory: string): string {
    return this.runGit(directory, ['rev-parse', '--show-toplevel']);
  }

  getCurrentBranch(directory: string): string {
    return this.runGit(directory, ['branch', '--show-current']);
  }

  getLatestCommitHash(directory: string): string {
    return this.runGit(directory, ['rev-parse', 'HEAD']);
  }

  checkWorkingTreeStatus(directory: string): string {
    return this.runGit(directory, ['status', '--short']);
  }

  stageDocumentationFiles(directory: string, files: string[]): string {
    const staged = this.runGit(directory, ['add', ...files]);
    return staged;
  }

  createDiffSummary(directory: string, files: string[]): string {
    const summary = this.runGit(directory, ['diff', '--cached', '--stat', '--', ...files]);
    return summary;
  }

  validateRepositoryAvailability(directory: string): boolean {
    try {
      const root = this.detectRepositoryRoot(directory);
      if (!root || root.trim().length === 0) {
        throw new Error('Repository root could not be determined.');
      }
      return true;
    } catch (error) {
      if (error instanceof Error && (error as NodeJS.ErrnoException).code === 'ENOENT') {
        throw new Error('Git executable is unavailable.');
      }

      if (error instanceof Error && error.message.includes('not a git repository')) {
        throw new Error('Target directory is not a Git repository.');
      }

      throw error;
    }
  }

  private runGit(directory: string, args: string[]): string {
    try {
      const result = this.executor('git', args, {
        cwd: directory,
        encoding: 'utf8',
      });

      return typeof result === 'string' ? result : '';
    } catch (error) {
      if (error instanceof Error && (error as NodeJS.ErrnoException).code === 'ENOENT') {
        throw new Error('Git executable is unavailable.');
      }

      if (error instanceof Error && error.message.includes('not a git repository')) {
        throw new Error('Target directory is not a Git repository.');
      }

      throw error;
    }
  }
}
