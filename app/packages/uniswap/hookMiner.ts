import { numberToHex } from "viem";

export const UNISWAP_V4_DEFAULT_CREATE2_DEPLOYER_ADDRESS =
  "0x4e59b44847b379578588920ca78fbf26c0b4956c" as const;

export const UNISWAP_V4_HOOK_PERMISSION_FLAGS = {
  beforeInitialize: 1n << 13n,
  afterInitialize: 1n << 12n,
  beforeAddLiquidity: 1n << 11n,
  afterAddLiquidity: 1n << 10n,
  beforeRemoveLiquidity: 1n << 9n,
  afterRemoveLiquidity: 1n << 8n,
  beforeSwap: 1n << 7n,
  afterSwap: 1n << 6n,
  beforeDonate: 1n << 5n,
  afterDonate: 1n << 4n,
  beforeSwapReturnDelta: 1n << 3n,
  afterSwapReturnDelta: 1n << 2n,
  afterAddLiquidityReturnDelta: 1n << 1n,
  afterRemoveLiquidityReturnDelta: 1n << 0n,
} as const;

export const UNISWAP_V4_HOOK_PERMISSION_ORDER = [
  "beforeInitialize",
  "afterInitialize",
  "beforeAddLiquidity",
  "beforeRemoveLiquidity",
  "afterAddLiquidity",
  "afterRemoveLiquidity",
  "beforeSwap",
  "afterSwap",
  "beforeDonate",
  "afterDonate",
  "beforeSwapReturnDelta",
  "afterSwapReturnDelta",
  "afterAddLiquidityReturnDelta",
  "afterRemoveLiquidityReturnDelta",
] as const satisfies ReadonlyArray<keyof typeof UNISWAP_V4_HOOK_PERMISSION_FLAGS>;

export type UniswapV4HookPermission =
  (typeof UNISWAP_V4_HOOK_PERMISSION_ORDER)[number];

export function buildUniswapV4HookPermissionsMask(
  permissions: Iterable<UniswapV4HookPermission>,
): bigint {
  let mask = 0n;

  for (const permission of permissions) {
    mask |= UNISWAP_V4_HOOK_PERMISSION_FLAGS[permission];
  }

  return mask;
}

export function formatUniswapV4HookPermissionsMaskAddress(
  mask: bigint,
): `0x${string}` {
  return numberToHex(mask, { size: 20 }) as `0x${string}`;
}

export function buildUniswapV4HookPermissionsMaskAddress(
  permissions: Iterable<UniswapV4HookPermission>,
): `0x${string}` {
  return formatUniswapV4HookPermissionsMaskAddress(
    buildUniswapV4HookPermissionsMask(permissions),
  );
}
