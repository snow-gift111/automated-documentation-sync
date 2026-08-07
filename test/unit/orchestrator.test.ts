import test from 'node:test';
import assert from 'node:assert/strict';
import {
  SDLCOrchestrator,
  type AgentResult,
  type SDLCContext,
  type SDLCAgent,
} from '../../src/orchestrator/sdlc-orchestrator';

type SDLCWorkflowAgents = ConstructorParameters<typeof SDLCOrchestrator>;

function createContext(): SDLCContext {
  return {
    currentStage: '',
    requiresUserInput: false,
    questions: [],
    completedStages: [],
  };
}

function createAgent(
  name: string,
  execute: (context: SDLCContext) => Promise<AgentResult> | AgentResult,
): SDLCAgent {
  return {
    name,
    execute: async (context) => execute(context),
  };
}

function createWorkflowAgents(overrides: Partial<Record<string, SDLCAgent>> = {}): SDLCWorkflowAgents {
  const stageNames = [
    'requirements-agent',
    'architecture-agent',
    'design-review-agent',
    'implementation-planner-agent',
    'implementation-agent',
    'verification-agent',
    'pr-agent',
  ] as const;

  return stageNames.map((stageName) => {
    const override = overrides[stageName];

    if (override) {
      return override;
    }

    return createAgent(stageName, () => ({
      success: true,
      stage: stageName,
      context: {
        metadata: {
          [stageName]: 'completed',
        },
      },
    }));
  }) as SDLCWorkflowAgents;
}

test('SDLCOrchestrator runs all seven agents in order and passes shared context forward', async () => {
  const observedStages: string[] = [];

  const agents = createWorkflowAgents({
    'architecture-agent': createAgent('architecture-agent', (context) => {
      observedStages.push(context.completedStages.join(','));
      return {
        success: true,
        stage: 'architecture-agent',
        context: {
          architecture: {
            approved: true,
          },
        },
      };
    }),
    'design-review-agent': createAgent('design-review-agent', (context) => {
      observedStages.push(context.currentStage);
      assert.deepEqual(context.architecture, { approved: true });
      return {
        success: true,
        stage: 'design-review-agent',
      };
    }),
  });

  const orchestrator = new SDLCOrchestrator(...agents);
  const context = await orchestrator.run(createContext());

  assert.equal(context.failedStage, undefined);
  assert.equal(context.requiresUserInput, false);
  assert.deepEqual(context.completedStages, [
    'requirements-agent',
    'architecture-agent',
    'design-review-agent',
    'implementation-planner-agent',
    'implementation-agent',
    'verification-agent',
    'pr-agent',
  ]);
  assert.equal(context.currentStage, 'pr-agent');
  assert.deepEqual(observedStages, ['requirements-agent', 'design-review-agent']);
  assert.equal(context.metadata?.['pr-agent'], 'completed');
});

test('SDLCOrchestrator stops and returns questions when a stage requires user input', async () => {
  const agents = createWorkflowAgents({
    'design-review-agent': createAgent('design-review-agent', () => ({
      success: true,
      stage: 'design-review-agent',
      requiresUserInput: true,
      questions: ['Clarify architecture tradeoff'],
    })),
  });

  const orchestrator = new SDLCOrchestrator(...agents);
  const context = await orchestrator.run(createContext());

  assert.equal(context.currentStage, 'design-review-agent');
  assert.equal(context.requiresUserInput, true);
  assert.deepEqual(context.questions, ['Clarify architecture tradeoff']);
  assert.deepEqual(context.completedStages, [
    'requirements-agent',
    'architecture-agent',
  ]);
});

test('SDLCOrchestrator stops when a stage fails', async () => {
  const agents = createWorkflowAgents({
    'verification-agent': createAgent('verification-agent', () => ({
      success: false,
      stage: 'verification-agent',
      message: 'Verification failed',
    })),
  });

  const orchestrator = new SDLCOrchestrator(...agents);
  const context = await orchestrator.run(createContext());

  assert.equal(context.failedStage, 'verification-agent');
  assert.equal(context.currentStage, 'verification-agent');
  assert.deepEqual(context.completedStages, [
    'requirements-agent',
    'architecture-agent',
    'design-review-agent',
    'implementation-planner-agent',
    'implementation-agent',
  ]);
});
