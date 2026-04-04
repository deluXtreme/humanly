import initWasm, { RunProperties } from "./vendor/hook-miner/miner_wasm_worker.js";

let initialized = false;

function hexToBytes(hex) {
  const normalized = hex.startsWith("0x") ? hex.slice(2) : hex;

  if (normalized.length % 2 !== 0) {
    throw new Error("Hex input must have an even number of characters.");
  }

  const bytes = new Uint8Array(normalized.length / 2);

  for (let index = 0; index < normalized.length; index += 2) {
    bytes[index / 2] = Number.parseInt(normalized.slice(index, index + 2), 16);
  }

  return bytes;
}

self.onmessage = async (event) => {
  const message = event.data;

  if (!message || message.type !== "mine") {
    return;
  }

  try {
    if (!initialized) {
      await initWasm();
      initialized = true;
    }

    const miner = RunProperties.new(
      hexToBytes(message.deployerAddress),
      hexToBytes(message.initCodeHash),
      hexToBytes(message.hookPermissionsMask),
      message.vanityPrefix,
      message.caseSensitive,
    );
    const result = miner.mine_salt();

    self.postMessage({
      type: "result",
      jobId: message.jobId,
      salt: result.salt(),
      address: result.address(),
    });
  } catch (error) {
    self.postMessage({
      type: "error",
      jobId: message.jobId,
      message: error instanceof Error ? error.message : "Mining failed.",
    });
  }
};
