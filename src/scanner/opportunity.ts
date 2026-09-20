import { decimal } from "../utils/decimal.js";

export interface OpportunityObservation {
  key: string;
  netSpreadPct: string;
  netProfitUsd: string;
  observedAt: number;
}

export interface OpportunityEvent extends OpportunityObservation {
  status: "OPEN" | "UPDATED" | "CLOSED";
  firstSeenAt: number;
  lastSeenAt: number;
  durationMs: number;
}

export class OpportunityLifecycle {
  private readonly active = new Map<string, OpportunityEvent>();
  private readonly openThresholdPct: ReturnType<typeof decimal>;
  private readonly closeThresholdPct: ReturnType<typeof decimal>;

  constructor(options: { openThresholdPct: string; closeThresholdPct: string }) {
    this.openThresholdPct = decimal(options.openThresholdPct);
    this.closeThresholdPct = decimal(options.closeThresholdPct);
  }

  get size() {
    return this.active.size;
  }

  observe(observation: OpportunityObservation): OpportunityEvent | undefined {
    const current = this.active.get(observation.key);
    if (!current) {
      if (decimal(observation.netSpreadPct).lt(this.openThresholdPct)) return undefined;
      const event: OpportunityEvent = { ...observation, status: "OPEN", firstSeenAt: observation.observedAt, lastSeenAt: observation.observedAt, durationMs: 0 };
      this.active.set(observation.key, event);
      return event;
    }
    if (decimal(observation.netSpreadPct).lt(this.closeThresholdPct)) {
      const closed: OpportunityEvent = { ...observation, status: "CLOSED", firstSeenAt: current.firstSeenAt, lastSeenAt: observation.observedAt, durationMs: observation.observedAt - current.firstSeenAt };
      this.active.delete(observation.key);
      return closed;
    }
    const updated: OpportunityEvent = { ...observation, status: "UPDATED", firstSeenAt: current.firstSeenAt, lastSeenAt: observation.observedAt, durationMs: observation.observedAt - current.firstSeenAt };
    this.active.set(observation.key, updated);
    return updated;
  }
}
