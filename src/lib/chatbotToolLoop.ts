/** Fixed limits for the Gemini function-calling loop (Phase 2A). */
export const MAX_TOOL_ROUNDS = 4;
export const MAX_TOOL_CALLS_PER_ROUND = 4;
export const MAX_TOOL_CALLS_TOTAL = 8;

export interface ToolCall {
  name: string;
  args: Record<string, unknown>;
}

export interface ToolResponse {
  name: string;
  response: Record<string, unknown>;
}

/** What the loop needs from one model turn: the tool calls it asked for (empty when it answered). */
export interface ToolLoopStep {
  calls: ToolCall[];
}

export interface ToolLoopOutcome<TStep extends ToolLoopStep> {
  step: TStep;
  limitReached: boolean;
  rounds: number;
  callsExecuted: number;
}

export interface ToolLoopLimits {
  maxRounds?: number;
  maxCallsPerRound?: number;
  maxCallsTotal?: number;
}

export class ToolLoopLimitError extends Error {
  constructor() {
    super('TOOL_LOOP_LIMIT_REACHED');
    this.name = 'ToolLoopLimitError';
  }
}

/**
 * Runs the model's tool calls with hard limits. Calls beyond the per-round or total cap are not executed;
 * the model gets a tool_call_limit error for them. When the model still asks for tools after the last
 * allowed round, the loop stops and reports limitReached so the caller can answer deterministically.
 */
export async function runToolLoop<TStep extends ToolLoopStep>(options: {
  first: TStep;
  execute: (call: ToolCall) => Promise<unknown>;
  send: (responses: ToolResponse[]) => Promise<TStep>;
  limits?: ToolLoopLimits;
}): Promise<ToolLoopOutcome<TStep>> {
  const maxRounds = options.limits?.maxRounds ?? MAX_TOOL_ROUNDS;
  const maxCallsPerRound = options.limits?.maxCallsPerRound ?? MAX_TOOL_CALLS_PER_ROUND;
  const maxCallsTotal = options.limits?.maxCallsTotal ?? MAX_TOOL_CALLS_TOTAL;

  let step = options.first;
  let rounds = 0;
  let callsExecuted = 0;

  while (step.calls.length > 0) {
    if (rounds >= maxRounds || callsExecuted >= maxCallsTotal) {
      return { step, limitReached: true, rounds, callsExecuted };
    }

    rounds += 1;
    const responses: ToolResponse[] = [];
    let executedThisRound = 0;

    for (const call of step.calls) {
      if (executedThisRound >= maxCallsPerRound || callsExecuted >= maxCallsTotal) {
        responses.push({ name: call.name, response: { error: 'tool_call_limit' } });
        continue;
      }

      executedThisRound += 1;
      callsExecuted += 1;
      try {
        responses.push({ name: call.name, response: { result: await options.execute(call) } });
      } catch (error) {
        responses.push({ name: call.name, response: { error: String(error) } });
      }
    }

    step = await options.send(responses);
  }

  return { step, limitReached: false, rounds, callsExecuted };
}
