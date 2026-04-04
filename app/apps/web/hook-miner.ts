import {
  buildUniswapV4HookPermissionsMask,
  buildUniswapV4HookPermissionsMaskAddress,
  UNISWAP_V4_DEFAULT_CREATE2_DEPLOYER_ADDRESS,
  UNISWAP_V4_HOOK_PERMISSION_ORDER,
  type UniswapV4HookPermission,
} from "uniswap";
import { getAddress, isAddress, isHex } from "viem";

interface MinerState {
  mining: boolean;
  completed: boolean;
  workers: Worker[];
  resolvedJobId?: number;
  resultSalt?: `0x${string}`;
  resultAddress?: `0x${string}`;
}

interface HookMinerJobInputs {
  jobId: number;
  type: "mine";
  deployerAddress: `0x${string}`;
  initCodeHash: `0x${string}`;
  hookPermissionsMask: `0x${string}`;
  vanityPrefix: string;
  caseSensitive: boolean;
}

interface HookMinerResultMessage {
  type: "result";
  jobId: number;
  salt: `0x${string}`;
  address: `0x${string}`;
}

interface HookMinerErrorMessage {
  type: "error";
  jobId: number;
  message: string;
}

type HookMinerWorkerMessage = HookMinerResultMessage | HookMinerErrorMessage;

const state: MinerState = {
  mining: false,
  completed: false,
  workers: [],
};

let nextJobId = 1;

function requireElement<T extends Element>(selector: string): T {
  const element = document.querySelector(selector);

  if (!element) {
    throw new Error(`Missing required element: ${selector}`);
  }

  return element as T;
}

function stringifyJson(value: unknown): string {
  return JSON.stringify(
    value,
    (_, currentValue) =>
      typeof currentValue === "bigint" ? currentValue.toString() : currentValue,
    2,
  );
}

function setStatus(message: string, kind: "idle" | "success" | "error" = "idle") {
  const status = requireElement<HTMLElement>("[data-status]");
  status.textContent = message;
  status.dataset.kind = kind;
}

function setOutput(title: string, value: unknown) {
  const label = requireElement<HTMLElement>("[data-output-label]");
  const output = requireElement<HTMLElement>("[data-output]");
  label.textContent = title;
  output.textContent = stringifyJson(value);
}

function setResultField(selector: string, value: string) {
  requireElement<HTMLElement>(selector).textContent = value;
}

function setButtonState() {
  requireElement<HTMLButtonElement>("[data-start-button]").disabled = state.mining;
  requireElement<HTMLButtonElement>("[data-stop-button]").disabled = !state.mining;
}

function getSelectedPermissions(): UniswapV4HookPermission[] {
  return UNISWAP_V4_HOOK_PERMISSION_ORDER.filter((permission) => {
    return requireElement<HTMLInputElement>(
      `[data-hook-permission="${permission}"]`,
    ).checked;
  });
}

function readThreadCount(): number {
  const rawValue = requireElement<HTMLInputElement>("[data-thread-input]").value;
  const parsedValue = Number.parseInt(rawValue, 10);

  if (!Number.isInteger(parsedValue) || parsedValue < 1 || parsedValue > 32) {
    throw new Error("Threads must be an integer between 1 and 32.");
  }

  return parsedValue;
}

function readFormInputs() {
  const deployerAddressValue = requireElement<HTMLInputElement>(
    "[data-deployer-address-input]",
  ).value.trim();
  const initCodeHashValue = requireElement<HTMLInputElement>(
    "[data-init-code-hash-input]",
  ).value.trim();
  const vanityPrefix = requireElement<HTMLInputElement>(
    "[data-vanity-prefix-input]",
  ).value.trim();
  const caseSensitive = requireElement<HTMLInputElement>(
    "[data-case-sensitive-input]",
  ).checked;
  const permissions = getSelectedPermissions();

  if (!isAddress(deployerAddressValue)) {
    throw new Error("Deployer address must be a valid 0x-prefixed EVM address.");
  }

  if (!isHex(initCodeHashValue, { strict: true }) || initCodeHashValue.length !== 66) {
    throw new Error("Init code hash must be a 32-byte 0x-prefixed hex string.");
  }

  if (!/^[0-9a-fA-F]*$/.test(vanityPrefix)) {
    throw new Error("Vanity prefix must only contain hexadecimal characters.");
  }

  if (vanityPrefix.length > 36) {
    throw new Error("Vanity prefix cannot exceed 36 characters.");
  }

  const threadCount = readThreadCount();
  const mask = buildUniswapV4HookPermissionsMask(permissions);
  const hookPermissionsMask = buildUniswapV4HookPermissionsMaskAddress(permissions);

  return {
    deployerAddress: getAddress(deployerAddressValue),
    initCodeHash: initCodeHashValue as `0x${string}`,
    vanityPrefix,
    caseSensitive,
    permissions,
    mask,
    hookPermissionsMask,
    threadCount,
  };
}

function updateDerivedPreview() {
  try {
    const inputs = readFormInputs();

    setResultField("[data-mask-value]", inputs.hookPermissionsMask);
    setResultField(
      "[data-permissions-value]",
      inputs.permissions.length > 0 ? inputs.permissions.join(", ") : "none selected",
    );

    setOutput("Hook Miner Draft", {
      deployerAddress: inputs.deployerAddress,
      initCodeHash: inputs.initCodeHash,
      hookPermissionsMask: inputs.hookPermissionsMask,
      maskBits: inputs.mask,
      vanityPrefix: inputs.vanityPrefix,
      caseSensitive: inputs.caseSensitive,
      threadCount: inputs.threadCount,
    });
  } catch (error) {
    setOutput("Hook Miner Draft", {
      error: error instanceof Error ? error.message : "Unable to parse miner draft.",
    });
  }
}

function terminateWorkers() {
  for (const worker of state.workers) {
    worker.terminate();
  }

  state.workers = [];
  state.mining = false;
  setButtonState();
}

function handleWorkerMessage(message: HookMinerWorkerMessage) {
  if (state.resolvedJobId !== undefined && message.jobId !== state.resolvedJobId) {
    return;
  }

  if (message.type === "error") {
    terminateWorkers();
    setStatus(message.message, "error");
    return;
  }

  state.completed = true;
  state.resultSalt = message.salt;
  state.resultAddress = message.address;
  state.resolvedJobId = message.jobId;
  terminateWorkers();

  setResultField("[data-salt-value]", message.salt);
  setResultField("[data-address-value]", message.address);
  setOutput("Hook Miner Result", {
    salt: message.salt,
    address: message.address,
  });
  setStatus("Salt mined successfully.", "success");
}

function startMining() {
  const inputs = readFormInputs();
  const jobId = nextJobId++;

  terminateWorkers();
  state.completed = false;
  state.resultSalt = undefined;
  state.resultAddress = undefined;
  state.resolvedJobId = jobId;
  state.mining = true;
  setButtonState();
  setResultField("[data-salt-value]", "searching...");
  setResultField("[data-address-value]", "searching...");
  setStatus(
    `Mining with ${inputs.threadCount} browser worker${
      inputs.threadCount === 1 ? "" : "s"
    }...`,
  );
  setOutput("Hook Miner Draft", {
    deployerAddress: inputs.deployerAddress,
    initCodeHash: inputs.initCodeHash,
    hookPermissionsMask: inputs.hookPermissionsMask,
    vanityPrefix: inputs.vanityPrefix,
    caseSensitive: inputs.caseSensitive,
    threadCount: inputs.threadCount,
  });

  for (let index = 0; index < inputs.threadCount; index += 1) {
    const worker = new Worker("/hook-miner-worker.js", { type: "module" });
    worker.onmessage = (event: MessageEvent<HookMinerWorkerMessage>) => {
      handleWorkerMessage(event.data);
    };
    worker.onerror = (event) => {
      terminateWorkers();
      setStatus(event.message || "Hook miner worker failed.", "error");
    };
    worker.postMessage({
      type: "mine",
      jobId,
      deployerAddress: inputs.deployerAddress,
      initCodeHash: inputs.initCodeHash,
      hookPermissionsMask: inputs.hookPermissionsMask,
      vanityPrefix: inputs.vanityPrefix,
      caseSensitive: inputs.caseSensitive,
    } satisfies HookMinerJobInputs);
    state.workers.push(worker);
  }
}

function stopMining() {
  terminateWorkers();
  setStatus("Mining stopped.", "idle");
}

function copyValue(selector: string) {
  const value = requireElement<HTMLElement>(selector).textContent?.trim();

  if (!value) {
    return;
  }

  void navigator.clipboard.writeText(value);
}

function attachHandlers() {
  requireElement<HTMLButtonElement>("[data-start-button]").addEventListener(
    "click",
    () => {
      try {
        startMining();
      } catch (error) {
        setStatus(
          error instanceof Error ? error.message : "Unable to start mining.",
          "error",
        );
      }
    },
  );

  requireElement<HTMLButtonElement>("[data-stop-button]").addEventListener(
    "click",
    () => {
      stopMining();
    },
  );

  requireElement<HTMLButtonElement>("[data-copy-salt-button]").addEventListener(
    "click",
    () => copyValue("[data-salt-value]"),
  );

  requireElement<HTMLButtonElement>("[data-copy-address-button]").addEventListener(
    "click",
    () => copyValue("[data-address-value]"),
  );

  const watchedFields = document.querySelectorAll<HTMLInputElement>(
    "[data-miner-input]",
  );

  for (const field of Array.from(watchedFields)) {
    field.addEventListener("input", updateDerivedPreview);
    field.addEventListener("change", updateDerivedPreview);
  }
}

function initializeDefaults() {
  const suggestedThreads = Math.max(
    1,
    Math.min(8, navigator.hardwareConcurrency ?? 4),
  );

  requireElement<HTMLInputElement>("[data-deployer-address-input]").value =
    UNISWAP_V4_DEFAULT_CREATE2_DEPLOYER_ADDRESS;
  requireElement<HTMLInputElement>("[data-thread-input]").value =
    String(suggestedThreads);
  setResultField("[data-mask-value]", "0x0000000000000000000000000000000000000000");
  setResultField("[data-permissions-value]", "none selected");
  setResultField("[data-salt-value]", "not mined yet");
  setResultField("[data-address-value]", "not mined yet");
  setButtonState();
  updateDerivedPreview();
}

function initializeApp() {
  initializeDefaults();
  attachHandlers();
  setStatus("Ready to mine a Uniswap v4 hook salt.");
}

initializeApp();
