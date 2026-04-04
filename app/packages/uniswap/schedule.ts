import {
  HUMANLY_CCA_MPS,
  HUMANLY_DEFAULT_MAIN_SUPPLY_PERCENT,
  HUMANLY_DEFAULT_SCHEDULE_ALPHA,
  HUMANLY_DEFAULT_SCHEDULE_STEP_COUNT,
} from "./constants.ts";
import type {
  Hex,
  HumanlyGenerateSupplyScheduleInput,
  HumanlyGeneratedSupplySchedule,
  HumanlySupplyScheduleEntry,
} from "./types.ts";

function assertPositiveInteger(value: number, label: string): void {
  if (!Number.isInteger(value) || value <= 0) {
    throw new Error(`${label} must be a positive integer.`);
  }
}

function assertZeroOrPositiveInteger(value: number, label: string): void {
  if (!Number.isInteger(value) || value < 0) {
    throw new Error(`${label} must be zero or a positive integer.`);
  }
}

function createConvexBlockDurations(
  totalBlocks: number,
  numSteps: number,
  alpha: number,
): number[] {
  const boundaries = [0];

  for (let index = 1; index <= numSteps; index += 1) {
    const normalized = index / numSteps;
    boundaries.push(Math.round(totalBlocks * normalized ** (1 / alpha)));
  }

  const deltas: number[] = [];

  for (let index = 1; index < boundaries.length; index += 1) {
    deltas.push(Math.max(1, boundaries[index]! - boundaries[index - 1]!));
  }

  const sum = deltas.reduce((accumulator, value) => accumulator + value, 0);
  const difference = totalBlocks - sum;
  deltas[deltas.length - 1] = (deltas[deltas.length - 1] ?? 0) + difference;

  if ((deltas[deltas.length - 1] ?? 0) <= 0) {
    throw new Error("Generated schedule has a non-positive final step.");
  }

  return deltas;
}

export function generateHumanlySupplySchedule(
  input: HumanlyGenerateSupplyScheduleInput,
): HumanlyGeneratedSupplySchedule {
  assertPositiveInteger(input.auctionBlocks, "auctionBlocks");
  assertZeroOrPositiveInteger(input.prebidBlocks ?? 0, "prebidBlocks");

  const numSteps = input.numSteps ?? HUMANLY_DEFAULT_SCHEDULE_STEP_COUNT;
  const alpha = input.alpha ?? HUMANLY_DEFAULT_SCHEDULE_ALPHA;
  const mainSupplyPct =
    input.mainSupplyPct ?? HUMANLY_DEFAULT_MAIN_SUPPLY_PERCENT;

  assertPositiveInteger(numSteps, "numSteps");

  if (!(alpha > 1)) {
    throw new Error("alpha must be greater than 1 for a convex schedule.");
  }

  if (!(mainSupplyPct > 0 && mainSupplyPct < 100)) {
    throw new Error("mainSupplyPct must be greater than 0 and less than 100.");
  }

  const prebidBlocks = input.prebidBlocks ?? 0;
  const finalBlockDelta = 1;
  const mainPhaseBlocks = Math.max(1, input.auctionBlocks - finalBlockDelta);
  const blockDeltas = createConvexBlockDurations(mainPhaseBlocks, numSteps, alpha);

  const mainSupplyTarget = Number(
    (HUMANLY_CCA_MPS * BigInt(Math.round(mainSupplyPct * 100))) / 10_000n,
  );
  const targetPerStep = mainSupplyTarget / numSteps;

  const schedule: HumanlySupplyScheduleEntry[] = [];

  if (prebidBlocks > 0) {
    schedule.push({ mps: 0, blockDelta: prebidBlocks });
  }

  let runningMainMps = 0;
  for (const blockDelta of blockDeltas) {
    const mps = Math.max(1, Math.round(targetPerStep / blockDelta));
    schedule.push({ mps, blockDelta });
    runningMainMps += mps * blockDelta;
  }

  const finalBlockMps = Number(HUMANLY_CCA_MPS) - runningMainMps;

  if (finalBlockMps <= 0) {
    throw new Error("Generated final block MPS is not positive.");
  }

  schedule.push({ mps: finalBlockMps, blockDelta: finalBlockDelta });

  const totalMps = schedule.reduce(
    (accumulator, entry) => accumulator + entry.mps * entry.blockDelta,
    0,
  );

  if (totalMps !== Number(HUMANLY_CCA_MPS)) {
    throw new Error("Generated schedule does not sum to the required total MPS.");
  }

  const totalAuctionBlocks = schedule.reduce(
    (accumulator, entry) => accumulator + entry.blockDelta,
    0,
  );

  if (totalAuctionBlocks !== input.auctionBlocks + prebidBlocks) {
    throw new Error("Generated schedule does not match the requested block count.");
  }

  return {
    schedule,
    auctionBlocks: input.auctionBlocks,
    prebidBlocks,
    totalPhases: schedule.length,
    summary: {
      totalMps,
      targetMps: Number(HUMANLY_CCA_MPS),
      finalBlockMps,
      finalBlockPercentage: Number(
        ((BigInt(finalBlockMps) * 10_000n) / HUMANLY_CCA_MPS),
      ) / 100,
      numSteps,
      alpha,
      mainSupplyPct,
      stepTokensPct: mainSupplyPct / numSteps,
    },
  };
}

export function encodeHumanlySupplySchedule(
  schedule: readonly HumanlySupplyScheduleEntry[],
): Hex {
  let encoded = "0x";

  for (const { mps, blockDelta } of schedule) {
    if (mps < 0 || mps >= 2 ** 24) {
      throw new Error(`mps ${mps} exceeds uint24 bounds.`);
    }

    if (blockDelta < 0 || blockDelta >= 2 ** 40) {
      throw new Error(`blockDelta ${blockDelta} exceeds uint40 bounds.`);
    }

    const packed = (BigInt(mps) << 40n) | BigInt(blockDelta);
    encoded += packed.toString(16).padStart(16, "0");
  }

  return encoded as Hex;
}
