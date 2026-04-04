import { encodeFunctionData, type Hex } from "viem";
import { MINT_AND_SUBMIT_BID_ABI } from "./constants";

export function encodeMintAndSubmitBidCalldata(
  message: Hex,
  attestation: Hex,
): Hex {
  return encodeFunctionData({
    abi: MINT_AND_SUBMIT_BID_ABI,
    functionName: "mintAndSubmitBid",
    args: [message, attestation],
  });
}
