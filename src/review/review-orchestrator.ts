import type { SynchronizationReport } from '../models/report-model';
import type { ReviewDecision, ReviewState } from '../models/review-model';

export class ReviewOrchestrator {
  private state: ReviewState = 'Pending Review';

  constructor(private readonly report: SynchronizationReport) {}

  getCurrentState(): ReviewDecision {
    return {
      state: this.state,
      reviewState: this.state,
      canProceed: this.state === 'Approved',
      reason: this.state === 'Approved'
        ? 'Report approved for next stage.'
        : 'Report is pending review and cannot progress to the next stage.',
    };
  }

  transition(nextState: ReviewState): ReviewDecision {
    if (nextState === 'Approved') {
      this.state = 'Approved';
      return {
        state: this.state,
        reviewState: this.state,
        canProceed: true,
        reason: 'Report approved for next stage.',
      };
    }

    this.state = 'Rejected';
    return {
      state: this.state,
      reviewState: this.state,
      canProceed: false,
      reason: 'Report rejected and cannot progress to the next stage.',
    };
  }

  canProceed(): boolean {
    return this.state === 'Approved';
  }
}
