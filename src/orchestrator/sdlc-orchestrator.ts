export interface SDLCContext {
  userStory?: unknown;
  requirements?: unknown;
  architecture?: unknown;
  designReview?: unknown;
  implementationPlan?: unknown;
  implementation?: unknown;
  verification?: unknown;
  pullRequest?: unknown;

  currentStage: string;

  requiresUserInput: boolean;

  questions: string[];

  completedStages: string[];

  failedStage?: string;

  metadata?: Record<string, unknown>;
}

export interface AgentResult<T = unknown> {
  success: boolean;

  stage: string;

  context?: T;

  requiresUserInput?: boolean;

  questions?: string[];

  message?: string;
}

export interface SDLCAgent {

  name: string;

  execute(context: SDLCContext): Promise<AgentResult>;

}

interface SDLCWorkflowStage {
  name:
    | 'requirements-agent'
    | 'architecture-agent'
    | 'design-review-agent'
    | 'implementation-planner-agent'
    | 'implementation-agent'
    | 'verification-agent'
    | 'pr-agent';

  agent: SDLCAgent;
}

// SDLCOrchestrator models the GitHub Copilot Agentic SDLC handoff between
// prompt-driven stages. It is intentionally separate from the application's
// runtime documentation-sync pipeline, which remains owned by PipelineOrchestrator.
export class SDLCOrchestrator {

  constructor(
    private readonly requirementsAgent: SDLCAgent,
    private readonly architectureAgent: SDLCAgent,
    private readonly designReviewAgent: SDLCAgent,
    private readonly implementationPlanningAgent: SDLCAgent,
    private readonly implementationAgent: SDLCAgent,
    private readonly verificationAgent: SDLCAgent,
    private readonly prAgent: SDLCAgent
  ) {}

  public async run(context: SDLCContext): Promise<SDLCContext> {

    const workflow: SDLCWorkflowStage[] = [
      { name: 'requirements-agent', agent: this.requirementsAgent },
      { name: 'architecture-agent', agent: this.architectureAgent },
      { name: 'design-review-agent', agent: this.designReviewAgent },
      { name: 'implementation-planner-agent', agent: this.implementationPlanningAgent },
      { name: 'implementation-agent', agent: this.implementationAgent },
      { name: 'verification-agent', agent: this.verificationAgent },
      { name: 'pr-agent', agent: this.prAgent },
    ];

    context.requiresUserInput = false;
    context.questions = [];
    context.failedStage = undefined;

    for (const stage of workflow) {

      context.currentStage = stage.name;

      const result = await stage.agent.execute(context);

      if (result.context && typeof result.context === 'object') {
        Object.assign(context, result.context);
      }

      if (!result.success) {

        context.failedStage = stage.name;

        return context;

      }

      if (result.requiresUserInput) {

        context.requiresUserInput = true;

        context.questions = result.questions ?? [];

        return context;

      }

      context.completedStages.push(stage.name);

    }

    return context;

  }

}