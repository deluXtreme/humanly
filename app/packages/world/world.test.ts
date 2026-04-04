import { describe, expect, test } from "bun:test";

import {
  WORLD_LEGACY_PROTOCOL_VERSION,
  WORLD_ORB_GROUP_ID,
  createHybridWorldIdRequest,
  createLegacyWorldIdVerificationInput,
  createSignedWorldRpContext,
  createWorldRpContext,
  createWorldVerifyRequestPayload,
  decodeLegacyWorldProof,
  signWorldRpRequest,
} from "./index.ts";

function encodeUint256Array(values: bigint[]): `0x${string}` {
  const body = values
    .map((value) => value.toString(16).padStart(64, "0"))
    .join("");

  return `0x${body}`;
}

describe("world package", () => {
  test("creates a hybrid IDKit request with legacy-proof defaults", () => {
    const rpContext = createWorldRpContext({
      rpId: "rp_demo",
      signature: {
        sig: "0x1234",
        nonce: "0xabcd",
        createdAt: 1_775_186_400,
        expiresAt: 1_775_186_700,
      },
    });

    const request = createHybridWorldIdRequest({
      appId: "app_demo",
      action: "create-auction",
      signal: "0xCreator",
      rpContext,
    });

    expect(request.allow_legacy_proofs).toBe(true);
    expect(request.verification_level).toBe("orb");
    expect(request.rp_context.rp_id).toBe("rp_demo");
    expect(request.signal).toBe("0xCreator");
  });

  test("builds a verify payload with the legacy protocol by default", () => {
    const payload = createWorldVerifyRequestPayload({
      nonce: "0xabcd",
      action: "create-auction",
      responses: [],
    });

    expect(payload.protocol_version).toBe(WORLD_LEGACY_PROTOCOL_VERSION);
  });

  test("decodes a legacy uint256[8] proof into bigint values", () => {
    const encodedProof = encodeUint256Array([1n, 2n, 3n, 4n, 5n, 6n, 7n, 8n]);
    const decodedProof = decodeLegacyWorldProof(encodedProof);

    expect(decodedProof).toEqual([1n, 2n, 3n, 4n, 5n, 6n, 7n, 8n]);
  });

  test("creates an on-chain verification input for the Base router path", () => {
    const encodedProof = encodeUint256Array([11n, 12n, 13n, 14n, 15n, 16n, 17n, 18n]);
    const verificationInput = createLegacyWorldIdVerificationInput({
      root: "0x01",
      signalHash: "0x02",
      nullifierHash: "0x03",
      externalNullifierHash: "0x04",
      proof: encodedProof,
    });

    expect(verificationInput.groupId).toBe(WORLD_ORB_GROUP_ID);
    expect(verificationInput.root).toBe(1n);
    expect(verificationInput.signalHash).toBe(2n);
    expect(verificationInput.nullifierHash).toBe(3n);
    expect(verificationInput.externalNullifierHash).toBe(4n);
    expect(verificationInput.proof[0]).toBe(11n);
    expect(verificationInput.proof[7]).toBe(18n);
  });

  test("creates a signed RP context from the object-form signer", async () => {
    const rpContext = await createSignedWorldRpContext(
      {
        rpId: "rp_demo",
        action: "create-auction",
        signingKeyHex:
          "0x1111111111111111111111111111111111111111111111111111111111111111",
      },
      {
        signRequestImplementation: ({ action, signingKeyHex, ttl }) => {
          expect(action).toBe("create-auction");
          expect(signingKeyHex).toBe(
            "0x1111111111111111111111111111111111111111111111111111111111111111",
          );
          expect(ttl).toBeUndefined();

          return {
            sig: "0xaaaa",
            nonce: "0xbbbb",
            createdAt: 1_775_186_400,
            expiresAt: 1_775_186_700,
          };
        },
      },
    );

    expect(rpContext).toEqual({
      rp_id: "rp_demo",
      nonce: "0xbbbb",
      created_at: 1_775_186_400,
      expires_at: 1_775_186_700,
      signature: "0xaaaa",
    });
  });

  test("supports the legacy positional World signer signature", async () => {
    const signature = await signWorldRpRequest(
      {
        action: "create-auction",
        ttl: 300,
        signingKeyHex:
          "0x2222222222222222222222222222222222222222222222222222222222222222",
      },
      {
        signRequestImplementation: ((
          action: string | undefined,
          signingKeyHex: `0x${string}`,
          ttl?: number,
        ) => {
          expect(action).toBe("create-auction");
          expect(signingKeyHex).toBe(
            "0x2222222222222222222222222222222222222222222222222222222222222222",
          );
          expect(ttl).toBe(300);

          return {
            sig: "0xcccc",
            nonce: "0xdddd",
            createdAt: 1_775_186_400,
            expiresAt: 1_775_186_700,
          };
        }) as any,
      },
    );

    expect(signature).toEqual({
      sig: "0xcccc",
      nonce: "0xdddd",
      createdAt: 1_775_186_400,
      expiresAt: 1_775_186_700,
    });
  });
});
