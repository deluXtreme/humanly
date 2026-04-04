import { IDKit, orbLegacy } from "@worldcoin/idkit-core";
import QRCode from "qrcode";
import {
  buildHumanlyEncodedLaunchArtifacts,
  buildHumanlyFullRangeLaunchPlan,
  createDefaultHumanlyFullRangeLaunchInput,
  type HumanlyAbiEncodedLaunchArtifacts,
  type HumanlyBuiltFullRangeLaunchPlan,
  type HumanlyFullRangeLaunchInput,
  HUMANLY_ALLOWED_POOL_LP_FEES,
  HUMANLY_ALLOWED_POOL_TICK_SPACINGS,
  HUMANLY_SUPPORTED_LAUNCH_NETWORKS,
  type HumanlyBuildLaunchContext,
  type HumanlyLaunchNetwork,
  type HumanlyUniswapLaunchAddressBook,
  validateHumanlyFullRangeLaunchInput,
} from "uniswap";
import { createPublicClient, createWalletClient, custom, getAddress, http } from "viem";
import type { BrowserWebConfig } from "./types.ts";

interface RpContextResponse {
  app_id: `app_${string}`;
  action: string;
  allow_legacy_proofs: true;
  rp_context: {
    rp_id: string;
    nonce: string;
    created_at: number;
    expires_at: number;
    signature: string;
  };
}

interface VerificationResponse {
  success: boolean;
  action?: string;
  nullifier?: string;
  message?: string;
}

interface IdKitCompletionSuccess {
  success: true;
  result: unknown;
}

interface IdKitCompletionFailure {
  success: false;
  error?: string;
}

type IdKitCompletion = IdKitCompletionSuccess | IdKitCompletionFailure;

interface WalletState {
  address?: `0x${string}`;
  chainId?: number;
}

interface LaunchPreview {
  network: HumanlyLaunchNetwork;
  currentBlock: bigint;
  launchInput: HumanlyFullRangeLaunchInput;
  plan: HumanlyBuiltFullRangeLaunchPlan;
  encodedArtifacts: HumanlyAbiEncodedLaunchArtifacts;
  previewAddresses: HumanlyUniswapLaunchAddressBook;
}

interface WorldLegacyProofResponse {
  identifier: string;
  merkle_root: `0x${string}`;
  nullifier: `0x${string}`;
  proof: `0x${string}`;
  signal_hash: `0x${string}`;
  max_age?: number;
}

interface WorldLegacyIdKitResult {
  nonce: `0x${string}`;
  action?: string;
  responses: WorldLegacyProofResponse[];
  protocol_version?: "3.0" | "4.0";
  environment?: string;
}

interface HumanlyFutureWorldProofPreview {
  verificationMode: "legacy_orb_v3";
  action: string;
  signal: `0x${string}`;
  nonce: `0x${string}`;
  merkleRoot: `0x${string}`;
  nullifierHash: `0x${string}`;
  signalHash: `0x${string}`;
  proof: `0x${string}`;
  contractNotes: {
    groupId: 1;
    externalNullifierHash: "derived_in_contract";
  };
}

interface HumanlyFutureLaunchPayloadPreview {
  network: HumanlyLaunchNetwork;
  previewAddresses: HumanlyUniswapLaunchAddressBook;
  createToken: HumanlyBuiltFullRangeLaunchPlan["createToken"];
  distribution: HumanlyBuiltFullRangeLaunchPlan["distribution"];
  encodedArtifacts: HumanlyAbiEncodedLaunchArtifacts;
}

interface HumanlyFutureContractPayloadPreview {
  creator: `0x${string}` | undefined;
  worldAction: string | undefined;
  worldSignal: `0x${string}` | undefined;
  proofOfHuman: HumanlyFutureWorldProofPreview | null;
  liquidityLauncherParameters: HumanlyFutureLaunchPayloadPreview | null;
  note: string;
}

interface LaunchState {
  browserConfig?: BrowserWebConfig;
  wallet: WalletState;
  launchInput: HumanlyFullRangeLaunchInput;
  launchPreview?: LaunchPreview;
  worldProof?: unknown;
  worldVerification?: VerificationResponse;
}

const state: LaunchState = {
  wallet: {},
  launchInput: createDefaultHumanlyFullRangeLaunchInput(),
};

let browserConfigPromise: Promise<BrowserWebConfig> | undefined;

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
      typeof currentValue === "bigint"
        ? currentValue.toString()
        : currentValue,
    2,
  );
}

function setStatus(message: string, kind: "idle" | "success" | "error" = "idle") {
  const status = requireElement<HTMLElement>("[data-status]");
  status.textContent = message;
  status.dataset.kind = kind;
}

function setJsonOutput(title: string, value: unknown) {
  const label = requireElement<HTMLElement>("[data-output-label]");
  const output = requireElement<HTMLElement>("[data-output]");
  label.textContent = title;
  output.textContent = stringifyJson(value);
}

async function loadBrowserConfig(): Promise<BrowserWebConfig> {
  if (window.__HUMANLY_WEB_CONFIG__) {
    return window.__HUMANLY_WEB_CONFIG__;
  }

  const response = await fetch("/config.json");
  const json = await response.json();

  if (!response.ok) {
    throw new Error(
      (json as { error?: string }).error ??
        "Failed to load browser runtime config.",
    );
  }

  return json as BrowserWebConfig;
}

async function getBrowserConfig(): Promise<BrowserWebConfig> {
  browserConfigPromise ??= loadBrowserConfig().then((config) => {
    state.browserConfig = config;
    return config;
  });

  return browserConfigPromise;
}

function isHexString(value: unknown): value is `0x${string}` {
  return typeof value === "string" && /^0x[0-9a-fA-F]+$/.test(value);
}

function isWorldLegacyProofResponse(value: unknown): value is WorldLegacyProofResponse {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Partial<WorldLegacyProofResponse>;

  return (
    typeof candidate.identifier === "string" &&
    isHexString(candidate.merkle_root) &&
    isHexString(candidate.nullifier) &&
    isHexString(candidate.proof) &&
    isHexString(candidate.signal_hash)
  );
}

function isWorldLegacyIdKitResult(value: unknown): value is WorldLegacyIdKitResult {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Partial<WorldLegacyIdKitResult>;

  return (
    isHexString(candidate.nonce) &&
    Array.isArray(candidate.responses) &&
    candidate.responses.every((response) => isWorldLegacyProofResponse(response))
  );
}

function normalizeVerificationPayload(
  proofResult: unknown,
  fallbackAction: string,
): unknown {
  if (!proofResult || typeof proofResult !== "object") {
    return proofResult;
  }

  const candidate = proofResult as Record<string, unknown>;

  return {
    ...candidate,
    action:
      typeof candidate.action === "string" && candidate.action.trim().length > 0
        ? candidate.action
        : fallbackAction,
  };
}

function clearConnectorUi() {
  const connectorAnchor = requireElement<HTMLAnchorElement>("[data-connector]");
  const connectorPanel = requireElement<HTMLElement>("[data-connector-panel]");
  const connectorQr = requireElement<HTMLImageElement>("[data-connector-qr]");

  connectorAnchor.href = "#";
  connectorAnchor.hidden = true;
  connectorQr.removeAttribute("src");
  connectorPanel.hidden = true;
}

async function renderConnectorUi(connectorUri: string) {
  const connectorAnchor = requireElement<HTMLAnchorElement>("[data-connector]");
  const connectorPanel = requireElement<HTMLElement>("[data-connector-panel]");
  const connectorQr = requireElement<HTMLImageElement>("[data-connector-qr]");

  const qrDataUrl = await QRCode.toDataURL(connectorUri, {
    width: 420,
    margin: 2,
    color: {
      dark: "#18211f",
      light: "#fffaf0",
    },
  });

  connectorAnchor.href = connectorUri;
  connectorAnchor.hidden = false;
  connectorQr.src = qrDataUrl;
  connectorPanel.hidden = false;
}

function getInjectedProvider() {
  if (!window.ethereum) {
    throw new Error("No injected wallet was found in this browser.");
  }

  return window.ethereum;
}

function getWalletSummary(): string {
  const walletSummary = requireElement<HTMLElement>("[data-wallet-summary]");

  if (!state.wallet.address) {
    walletSummary.textContent = "No wallet connected.";
    return "No wallet connected.";
  }

  const selectedNetwork = HUMANLY_SUPPORTED_LAUNCH_NETWORKS[state.launchInput.network];
  const walletChainId = state.wallet.chainId;
  const matchesNetwork = walletChainId === selectedNetwork.chainId;

  const summary = `${state.wallet.address} on chain ${walletChainId ?? "unknown"}${
    matchesNetwork ? "" : ` (selected launch network is ${selectedNetwork.name})`
  }`;
  walletSummary.textContent = summary;
  return summary;
}

async function requestRpContext(
  apiBaseUrl: string,
  action: string,
  signal: string,
): Promise<RpContextResponse> {
  const response = await fetch(`${apiBaseUrl}/api/worldid/rp-context`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify({
      action,
      signal,
    }),
  });

  const json = await response.json();

  if (!response.ok) {
    throw new Error(json.error ?? "Failed to request World RP context.");
  }

  const rpContext = json as RpContextResponse;

  return {
    ...rpContext,
    rp_context: {
      ...rpContext.rp_context,
      created_at: Number(rpContext.rp_context.created_at),
      expires_at: Number(rpContext.rp_context.expires_at),
    },
  };
}

async function verifyProof(
  apiBaseUrl: string,
  proofResult: unknown,
): Promise<VerificationResponse> {
  const response = await fetch(`${apiBaseUrl}/api/worldid/verify`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify(proofResult),
  });

  const rawBody = await response.text();
  let json: { error?: string } | VerificationResponse | undefined;

  try {
    json = JSON.parse(rawBody) as { error?: string } | VerificationResponse;
  } catch {
    if (!response.ok) {
      throw new Error(
        `World proof verification failed with status ${response.status}.`,
      );
    }

    throw new Error("World proof verification returned a non-JSON response.");
  }

  if (!response.ok) {
    throw new Error(
      ("error" in json ? json.error : undefined) ??
        "World proof verification failed.",
    );
  }

  return json as VerificationResponse;
}

function getIdKitFailureMessage(completion: IdKitCompletionFailure): string {
  if (completion.error === "credential_unavailable") {
    return "This World account does not have the required Orb credential. This flow currently requests an Orb-only proof, so you need a World account that has already completed Orb verification.";
  }

  if (completion.error) {
    return `World verification was not completed: ${completion.error}`;
  }

  return "World verification was not completed.";
}

function readNumber(selector: string): number {
  const value = requireElement<HTMLInputElement>(selector).value.trim();
  return Number.parseInt(value, 10);
}

function readString(selector: string): string {
  return requireElement<HTMLInputElement | HTMLTextAreaElement>(selector).value.trim();
}

function readSelectValue<T extends string>(selector: string): T {
  return requireElement<HTMLSelectElement>(selector).value as T;
}

function readLaunchInputFromForm(): HumanlyFullRangeLaunchInput {
  return {
    ...state.launchInput,
    network: readSelectValue<HumanlyFullRangeLaunchInput["network"]>(
      "[data-network-input]",
    ),
    token: {
      name: readString("[data-token-name-input]"),
      symbol: readString("[data-token-symbol-input]"),
      description: readString("[data-token-description-input]"),
      website: readString("[data-token-website-input]"),
      image: readString("[data-token-image-input]"),
      initialSupply: readString("[data-token-supply-input]"),
    },
    auction: {
      startDelayBlocks: readNumber("[data-start-delay-input]"),
      prebidBlocks: readNumber("[data-prebid-blocks-input]"),
      auctionBlocks: readNumber("[data-auction-blocks-input]"),
      migrationDelayBlocks: readNumber("[data-migration-delay-input]"),
      sweepDelayBlocks: readNumber("[data-sweep-delay-input]"),
      floorPriceUsdc: readString("[data-floor-price-input]"),
      tickSizeUsdc: readString("[data-tick-size-input]"),
      requiredUsdcRaised: readString("[data-required-raised-input]"),
    },
    liquidity: {
      auctionTokenPercentage: Number.parseFloat(
        readString("[data-auction-token-percentage-input]"),
      ),
      poolLpFee: Number.parseInt(
        readSelectValue("[data-pool-lp-fee-input]"),
        10,
      ) as HumanlyFullRangeLaunchInput["liquidity"]["poolLpFee"],
      poolTickSpacing: Number.parseInt(
        readSelectValue("[data-pool-tick-spacing-input]"),
        10,
      ) as HumanlyFullRangeLaunchInput["liquidity"]["poolTickSpacing"],
      maxUsdcForLp: readString("[data-max-usdc-for-lp-input]"),
    },
  };
}

function setValidationSummary(issues: ReturnType<typeof validateHumanlyFullRangeLaunchInput>) {
  const validationSummary = requireElement<HTMLElement>("[data-validation-summary]");

  if (issues.length === 0) {
    validationSummary.textContent =
      "Launch parameters are valid for the current Humanly v1 launch surface.";
    return;
  }

  validationSummary.textContent = issues
    .map((issue) => `${issue.field}: ${issue.message}`)
    .join(" ");
}

function populateForm() {
  const defaults = state.launchInput;

  requireElement<HTMLSelectElement>("[data-network-input]").value =
    defaults.network;
  requireElement<HTMLInputElement>("[data-token-name-input]").value =
    defaults.token.name;
  requireElement<HTMLInputElement>("[data-token-symbol-input]").value =
    defaults.token.symbol;
  requireElement<HTMLTextAreaElement>("[data-token-description-input]").value =
    defaults.token.description;
  requireElement<HTMLInputElement>("[data-token-website-input]").value =
    defaults.token.website ?? "";
  requireElement<HTMLInputElement>("[data-token-image-input]").value =
    defaults.token.image ?? "";
  requireElement<HTMLInputElement>("[data-token-supply-input]").value =
    defaults.token.initialSupply;
  requireElement<HTMLInputElement>("[data-start-delay-input]").value = String(
    defaults.auction.startDelayBlocks,
  );
  requireElement<HTMLInputElement>("[data-prebid-blocks-input]").value = String(
    defaults.auction.prebidBlocks,
  );
  requireElement<HTMLInputElement>("[data-auction-blocks-input]").value = String(
    defaults.auction.auctionBlocks,
  );
  requireElement<HTMLInputElement>("[data-migration-delay-input]").value = String(
    defaults.auction.migrationDelayBlocks,
  );
  requireElement<HTMLInputElement>("[data-sweep-delay-input]").value = String(
    defaults.auction.sweepDelayBlocks,
  );
  requireElement<HTMLInputElement>("[data-floor-price-input]").value =
    defaults.auction.floorPriceUsdc;
  requireElement<HTMLInputElement>("[data-tick-size-input]").value =
    defaults.auction.tickSizeUsdc;
  requireElement<HTMLInputElement>("[data-required-raised-input]").value =
    defaults.auction.requiredUsdcRaised;
  requireElement<HTMLInputElement>("[data-auction-token-percentage-input]").value =
    String(defaults.liquidity.auctionTokenPercentage);
  requireElement<HTMLSelectElement>("[data-pool-lp-fee-input]").value = String(
    defaults.liquidity.poolLpFee,
  );
  requireElement<HTMLSelectElement>("[data-pool-tick-spacing-input]").value =
    String(defaults.liquidity.poolTickSpacing);
  requireElement<HTMLInputElement>("[data-max-usdc-for-lp-input]").value =
    defaults.liquidity.maxUsdcForLp ?? "";

  setValidationSummary(validateHumanlyFullRangeLaunchInput(defaults));
}

function buildWorldProofPreview(): HumanlyFutureWorldProofPreview | null {
  if (!state.wallet.address || !isWorldLegacyIdKitResult(state.worldProof)) {
    return null;
  }

  const [primaryResponse] = state.worldProof.responses;

  if (!primaryResponse) {
    return null;
  }

  const action = state.worldProof.action ?? state.browserConfig?.worldAction;

  if (!action) {
    return null;
  }

  return {
    verificationMode: "legacy_orb_v3",
    action,
    signal: state.wallet.address,
    nonce: state.worldProof.nonce,
    merkleRoot: primaryResponse.merkle_root,
    nullifierHash: primaryResponse.nullifier,
    signalHash: primaryResponse.signal_hash,
    proof: primaryResponse.proof,
    contractNotes: {
      groupId: 1,
      externalNullifierHash: "derived_in_contract",
    },
  };
}

function buildLaunchPayloadPreview(): HumanlyFutureLaunchPayloadPreview | null {
  if (!state.launchPreview) {
    return null;
  }

  return {
    network: state.launchPreview.network,
    previewAddresses: state.launchPreview.previewAddresses,
    createToken: state.launchPreview.plan.createToken,
    distribution: state.launchPreview.plan.distribution,
    encodedArtifacts: state.launchPreview.encodedArtifacts,
  };
}

function buildContractPayloadPreview(): HumanlyFutureContractPayloadPreview {
  return {
    creator: state.wallet.address,
    worldAction: state.browserConfig?.worldAction,
    worldSignal: state.wallet.address,
    proofOfHuman: buildWorldProofPreview(),
    liquidityLauncherParameters: buildLaunchPayloadPreview(),
    note: "Preview only. The final Humanly create-auction contract is not merged yet.",
  };
}

async function connectWallet() {
  const provider = getInjectedProvider();
  await provider.request({ method: "eth_requestAccounts" });

  const walletClient = createWalletClient({
    transport: custom(provider),
  });

  const [address] = await walletClient.getAddresses();
  const chainId = await walletClient.getChainId();

  if (!address) {
    throw new Error("No account was returned by the wallet.");
  }

  state.wallet = {
    address: getAddress(address),
    chainId,
  };

  getWalletSummary();
}

async function buildLaunchPreview() {
  const config = await getBrowserConfig();

  if (!state.wallet.address) {
    throw new Error("Connect a wallet before building a launch preview.");
  }

  state.launchInput = readLaunchInputFromForm();
  const issues = validateHumanlyFullRangeLaunchInput(state.launchInput);
  setValidationSummary(issues);

  if (issues.length > 0) {
    throw new Error("Fix the invalid launch fields before continuing.");
  }

  const selectedNetwork = HUMANLY_SUPPORTED_LAUNCH_NETWORKS[state.launchInput.network];
  const publicClient = createPublicClient({
    transport: http(selectedNetwork.rpcUrl),
  });
  const currentBlock = await publicClient.getBlockNumber();

  const context: HumanlyBuildLaunchContext = {
    creator: state.wallet.address,
    currentBlock,
    addresses: config.previewAddresses,
  };

  const plan = buildHumanlyFullRangeLaunchPlan(state.launchInput, context);
  const encodedArtifacts = buildHumanlyEncodedLaunchArtifacts(
    state.launchInput,
    context,
  );

  state.launchPreview = {
    network: state.launchInput.network,
    currentBlock,
    launchInput: state.launchInput,
    plan,
    encodedArtifacts,
    previewAddresses: config.previewAddresses,
  };

  setJsonOutput("Launch Preview", state.launchPreview);
}

async function runWorldFlow() {
  const config = await getBrowserConfig();

  if (!state.wallet.address) {
    throw new Error("Connect a wallet before verifying with World ID.");
  }

  clearConnectorUi();

  setStatus("Requesting RP context from the API...");
  const rpContext = await requestRpContext(
    config.apiBaseUrl,
    config.worldAction,
    state.wallet.address,
  );
  setJsonOutput("RP Context", rpContext);

  setStatus("Opening World IDKit flow...");
  const builder = IDKit.request({
    app_id: rpContext.app_id,
    action: rpContext.action,
    rp_context: rpContext.rp_context,
    allow_legacy_proofs: true,
    environment: "production",
  });

  const request = await builder.preset(orbLegacy({ signal: state.wallet.address }));

  await renderConnectorUi(request.connectorURI);
  setStatus("Waiting for the World App / Orb flow to complete...");
  const completion = (await request.pollUntilCompletion()) as IdKitCompletion;
  setJsonOutput("IDKit Result", completion);

  if (!completion.success) {
    throw new Error(getIdKitFailureMessage(completion));
  }

  setStatus("Verifying proof with the API...");
  const verificationResult = await verifyProof(
    config.apiBaseUrl,
    normalizeVerificationPayload(completion.result, config.worldAction),
  );

  state.worldProof = completion.result;
  state.worldVerification = verificationResult;

  setJsonOutput("Future Contract Payload Preview", buildContractPayloadPreview());
  setStatus("World verification succeeded.", "success");
}

function attachFieldValidation() {
  const fields = document.querySelectorAll<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>(
    "[data-launch-input]",
  );

  for (const field of Array.from(fields)) {
    field.addEventListener("input", () => {
      try {
        const launchInput = readLaunchInputFromForm();
        state.launchInput = launchInput;
        setValidationSummary(validateHumanlyFullRangeLaunchInput(launchInput));
      } catch {
        setValidationSummary([
          {
            field: "token.name",
            message: "Complete the form to validate the launch draft.",
          },
        ]);
      }
    });
  }
}

function attachHandlers() {
  const connectButton = requireElement<HTMLButtonElement>("[data-connect-button]");
  const previewButton = requireElement<HTMLButtonElement>("[data-preview-button]");
  const verifyButton = requireElement<HTMLButtonElement>("[data-verify-button]");

  connectButton.addEventListener("click", async () => {
    connectButton.disabled = true;
    setStatus("Connecting wallet...");

    try {
      await connectWallet();
      setStatus("Wallet connected.", "success");
      setJsonOutput("Wallet", {
        wallet: state.wallet,
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Wallet connection failed.";
      setStatus(message, "error");
    } finally {
      connectButton.disabled = false;
    }
  });

  previewButton.addEventListener("click", async () => {
    previewButton.disabled = true;
    setStatus("Building launch preview...");

    try {
      await buildLaunchPreview();
      setStatus("Launch preview is ready.", "success");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to build launch preview.";
      setStatus(message, "error");
    } finally {
      previewButton.disabled = false;
    }
  });

  verifyButton.addEventListener("click", async () => {
    verifyButton.disabled = true;
    setStatus("Starting World verification...");

    try {
      await runWorldFlow();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "World verification failed.";
      setStatus(message, "error");
    } finally {
      verifyButton.disabled = false;
    }
  });
}

async function initializeApp() {
  populateForm();
  getWalletSummary();
  attachFieldValidation();
  attachHandlers();

  try {
    const config = await getBrowserConfig();
    setJsonOutput("Browser Config", config);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to load browser config.";
    setStatus(message, "error");
  }
}

void initializeApp();
