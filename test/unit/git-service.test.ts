import test from 'node:test';
import assert from 'node:assert/strict';
import { GitService } from '../../src/git/git-service';

const createMockExecutor = (responseMap: Record<string, string>, errorMap: Record<string, Error> = {}) => {
  return (_command: string, args: readonly string[]) => {
    const joined = args.join(' ');

    if (errorMap[joined]) {
      throw errorMap[joined];
    }

    return responseMap[joined] ?? '';
  };
};

test('GitService exposes repository and git metadata through a service abstraction', () => {
  const executor = createMockExecutor({
    'rev-parse --show-toplevel': '/repo',
    'branch --show-current': 'main',
    'rev-parse HEAD': 'abc123',
    'status --short': ' M README.md\n?? docs/overview.md',
    'add README.md docs/overview.md': '',
    'diff --cached --stat -- README.md docs/overview.md': ' 1 file changed, 2 insertions(+), 1 deletion(-)',
  });

  const service = new GitService('/repo', executor as never);

  assert.equal(service.detectRepositoryRoot('/repo'), '/repo');
  assert.equal(service.getCurrentBranch('/repo'), 'main');
  assert.equal(service.getLatestCommitHash('/repo'), 'abc123');
  assert.equal(service.checkWorkingTreeStatus('/repo'), ' M README.md\n?? docs/overview.md');
  assert.equal(service.stageDocumentationFiles('/repo', ['README.md', 'docs/overview.md']), '');
  assert.equal(service.createDiffSummary('/repo', ['README.md', 'docs/overview.md']), ' 1 file changed, 2 insertions(+), 1 deletion(-)');
  assert.equal(service.validateRepositoryAvailability('/repo'), true);
});

test('GitService throws a useful error when Git is unavailable', () => {
  const executor = createMockExecutor({}, {
    'rev-parse --show-toplevel': Object.assign(new Error('spawn git ENOENT'), { code: 'ENOENT' }),
  });

  const service = new GitService('/repo', executor as never);

  assert.throws(() => service.validateRepositoryAvailability('/repo'), /Git executable is unavailable/);
});

test('GitService throws a useful error when the target directory is not a Git repository', () => {
  const executor = createMockExecutor({}, {
    'rev-parse --show-toplevel': new Error('fatal: not a git repository'),
  });

  const service = new GitService('/repo', executor as never);

  assert.throws(() => service.validateRepositoryAvailability('/repo'), /not a Git repository/);
});
