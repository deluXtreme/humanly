import type { ParsedDepositForBurn } from "./types";

export function matchesDestinationCaller(
  destinationCaller: string,
  expectedCaller: string,
): boolean {
  return destinationCaller.toLowerCase() === expectedCaller.toLowerCase();
}

export function shouldRelayDepositForBurn(
  deposit: Pick<ParsedDepositForBurn, "mintRecipient">,
  expectedCaller: string,
): boolean {
  return matchesDestinationCaller(deposit.mintRecipient, expectedCaller);
}
