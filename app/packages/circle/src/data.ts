import type { Chain } from "viem";
import {
  // Testnets
  sepolia,
  avalancheFuji,
  optimismSepolia,
  arbitrumSepolia,
  baseSepolia,
  polygonAmoy,
  unichainSepolia,
  // Mainnets
  mainnet,
  avalanche,
  optimism,
  arbitrum,
  base,
  polygon,
  unichain,
  linea,
  codex,
  sonic,
  worldchain,
} from "viem/chains";

export interface ChainConfig {
  name: string;
  domain: number;
  chain: Chain;
  usdc: `0x${string}`;
  tokenMessenger: `0x${string}`;
  messageTransmitter: `0x${string}`;
}

// CCTP V2 testnet contracts (same on all chains)
const TESTNET_TOKEN_MESSENGER =
  "0x8FE6B999Dc680CcFDD5Bf7EB0974218be2542DAA" as const;
const TESTNET_MESSAGE_TRANSMITTER =
  "0xE737e5cEBEEBa77EFE34D4aa090756590b1CE275" as const;

// CCTP V2 mainnet contracts (same on all chains)
const MAINNET_TOKEN_MESSENGER =
  "0x28b5a0e9C621a5BadaA536219b3a228C8168cf5d" as const;
const MAINNET_MESSAGE_TRANSMITTER =
  "0x81D40F21F12A8F0E3252Bccb954D722d4c464B64" as const;

const TESTNET_CHAINS: Record<string, ChainConfig> = {
  ethereumSepolia: {
    name: "Ethereum Sepolia",
    domain: 0,
    chain: sepolia,
    usdc: "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238",
    tokenMessenger: TESTNET_TOKEN_MESSENGER,
    messageTransmitter: TESTNET_MESSAGE_TRANSMITTER,
  },
  avalancheFuji: {
    name: "Avalanche Fuji",
    domain: 1,
    chain: avalancheFuji,
    usdc: "0x5425890298aed601595a70AB815c96711a31Bc65",
    tokenMessenger: TESTNET_TOKEN_MESSENGER,
    messageTransmitter: TESTNET_MESSAGE_TRANSMITTER,
  },
  opSepolia: {
    name: "OP Sepolia",
    domain: 2,
    chain: optimismSepolia,
    usdc: "0x5fd84259d66Cd46123540766Be93DFE6D43130D7",
    tokenMessenger: TESTNET_TOKEN_MESSENGER,
    messageTransmitter: TESTNET_MESSAGE_TRANSMITTER,
  },
  arbitrumSepolia: {
    name: "Arbitrum Sepolia",
    domain: 3,
    chain: arbitrumSepolia,
    usdc: "0x75faf114eafb1BDbe2F0316DF893fd58CE46AA4d",
    tokenMessenger: TESTNET_TOKEN_MESSENGER,
    messageTransmitter: TESTNET_MESSAGE_TRANSMITTER,
  },
  baseSepolia: {
    name: "Base Sepolia",
    domain: 6,
    chain: baseSepolia,
    usdc: "0x036CbD53842c5426634e7929541eC2318f3dCF7e",
    tokenMessenger: TESTNET_TOKEN_MESSENGER,
    messageTransmitter: TESTNET_MESSAGE_TRANSMITTER,
  },
  polygonAmoy: {
    name: "Polygon PoS Amoy",
    domain: 7,
    chain: polygonAmoy,
    usdc: "0x41E94Eb019C0762f9Bfcf9Fb1E58725BfB0e7582",
    tokenMessenger: TESTNET_TOKEN_MESSENGER,
    messageTransmitter: TESTNET_MESSAGE_TRANSMITTER,
  },
  unichainSepolia: {
    name: "Unichain Sepolia",
    domain: 10,
    chain: unichainSepolia,
    usdc: "0x31d0220469e10c4E71834a79b1f276d740d3768F",
    tokenMessenger: TESTNET_TOKEN_MESSENGER,
    messageTransmitter: TESTNET_MESSAGE_TRANSMITTER,
  },
};

const MAINNET_CHAINS: Record<string, ChainConfig> = {
  ethereum: {
    name: "Ethereum",
    domain: 0,
    chain: mainnet,
    usdc: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
    tokenMessenger: MAINNET_TOKEN_MESSENGER,
    messageTransmitter: MAINNET_MESSAGE_TRANSMITTER,
  },
  avalanche: {
    name: "Avalanche",
    domain: 1,
    chain: avalanche,
    usdc: "0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E",
    tokenMessenger: MAINNET_TOKEN_MESSENGER,
    messageTransmitter: MAINNET_MESSAGE_TRANSMITTER,
  },
  optimism: {
    name: "OP Mainnet",
    domain: 2,
    chain: optimism,
    usdc: "0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85",
    tokenMessenger: MAINNET_TOKEN_MESSENGER,
    messageTransmitter: MAINNET_MESSAGE_TRANSMITTER,
  },
  arbitrum: {
    name: "Arbitrum",
    domain: 3,
    chain: arbitrum,
    usdc: "0xaf88d065e77c8cC2239327C5EDb3A432268e5831",
    tokenMessenger: MAINNET_TOKEN_MESSENGER,
    messageTransmitter: MAINNET_MESSAGE_TRANSMITTER,
  },
  base: {
    name: "Base",
    domain: 6,
    chain: base,
    usdc: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
    tokenMessenger: MAINNET_TOKEN_MESSENGER,
    messageTransmitter: MAINNET_MESSAGE_TRANSMITTER,
  },
  polygon: {
    name: "Polygon PoS",
    domain: 7,
    chain: polygon,
    usdc: "0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359",
    tokenMessenger: MAINNET_TOKEN_MESSENGER,
    messageTransmitter: MAINNET_MESSAGE_TRANSMITTER,
  },
  unichain: {
    name: "Unichain",
    domain: 10,
    chain: unichain,
    usdc: "0x078D782b760474a361dDA0AF3839290b0EF57AD6",
    tokenMessenger: MAINNET_TOKEN_MESSENGER,
    messageTransmitter: MAINNET_MESSAGE_TRANSMITTER,
  },
  linea: {
    name: "Linea",
    domain: 11,
    chain: linea,
    usdc: "0x176211869cA2b568f2A7D4EE941E073a821EE1ff",
    tokenMessenger: MAINNET_TOKEN_MESSENGER,
    messageTransmitter: MAINNET_MESSAGE_TRANSMITTER,
  },
  codex: {
    name: "Codex",
    domain: 12,
    chain: codex,
    usdc: "0xd996633a415985DBd7D6D12f4A4343E31f5037cf",
    tokenMessenger: MAINNET_TOKEN_MESSENGER,
    messageTransmitter: MAINNET_MESSAGE_TRANSMITTER,
  },
  sonic: {
    name: "Sonic",
    domain: 13,
    chain: sonic,
    usdc: "0x29219dd400f2Bf60E5a23d13be72b486d4038894",
    tokenMessenger: MAINNET_TOKEN_MESSENGER,
    messageTransmitter: MAINNET_MESSAGE_TRANSMITTER,
  },
  worldchain: {
    name: "World Chain",
    domain: 14,
    chain: worldchain,
    usdc: "0x79A02482A880bCe3F13E09da970dC34dB4cD24D1",
    tokenMessenger: MAINNET_TOKEN_MESSENGER,
    messageTransmitter: MAINNET_MESSAGE_TRANSMITTER,
  },
};

export type Network = "testnet" | "mainnet";

const IRIS_API_BASE: Record<Network, string> = {
  testnet: "https://iris-api-sandbox.circle.com",
  mainnet: "https://iris-api.circle.com",
};

export function getIrisApiBase(network: Network): string {
  return IRIS_API_BASE[network];
}

function getChains(network: Network): Record<string, ChainConfig> {
  return network === "mainnet" ? MAINNET_CHAINS : TESTNET_CHAINS;
}

export function getChainByDomain(
  network: Network,
  domain: number,
): ChainConfig | undefined {
  return Object.values(getChains(network)).find((c) => c.domain === domain);
}
