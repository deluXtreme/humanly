import {
  HUMANLY_MIN_TICK_SPACING_Q96,
  HUMANLY_Q96,
} from "./constants.ts";
import type { DecimalString } from "./types.ts";

function parseDecimal(value: DecimalString): { numerator: bigint; scale: bigint } {
  const trimmed = value.trim();

  if (!/^(0|[1-9]\d*)(\.\d+)?$/.test(trimmed)) {
    throw new Error(`Invalid decimal string: ${value}`);
  }

  const [integerPart, fractionPart = ""] = trimmed.split(".");
  const numerator = BigInt(`${integerPart}${fractionPart}`);
  const scale = 10n ** BigInt(fractionPart.length);

  return { numerator, scale };
}

export function parseDecimalToUnits(
  value: DecimalString,
  decimals: number,
): bigint {
  const { numerator, scale } = parseDecimal(value);
  const multiplier = 10n ** BigInt(decimals);

  return (numerator * multiplier) / scale;
}

export function decimalPriceToQ96(
  value: DecimalString,
  tokenDecimals: number,
  currencyDecimals: number,
): bigint {
  const { numerator, scale } = parseDecimal(value);
  const decimalAdjustment = 10n ** BigInt(tokenDecimals - currencyDecimals);
  return (HUMANLY_Q96 * numerator) / (scale * decimalAdjustment);
}

export function roundFloorPriceToTickSpacing(
  floorPriceQ96: bigint,
  tickSpacingQ96: bigint,
): bigint {
  if (tickSpacingQ96 < HUMANLY_MIN_TICK_SPACING_Q96) {
    throw new Error("Tick spacing must be at least 2 in Q96 space.");
  }

  if (tickSpacingQ96 >= floorPriceQ96) {
    throw new Error("Tick spacing must be smaller than the floor price.");
  }

  return (floorPriceQ96 / tickSpacingQ96) * tickSpacingQ96;
}

export function percentageToMps(percentage: number): bigint {
  return BigInt(Math.round(percentage * 100_000));
}
