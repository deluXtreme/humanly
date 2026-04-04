import {
  createHybridWorldIdRequest,
  createSignedWorldRpContext,
  createWorldVerifyRequestPayload,
  verifyWorldProof,
} from "world";

import { assertWorldActionAllowed } from "./config.ts";
import type {
  HandleApiWorldRequestOptions,
  WorldRpContextRequestBody,
  WorldRpContextResponse,
  WorldVerifyRequestBody,
} from "./types.ts";

const CORS_HEADERS = {
  "access-control-allow-origin": "*",
  "access-control-allow-methods": "POST, OPTIONS",
  "access-control-allow-headers": "content-type",
};

function createJsonResponse(body: unknown, status: number): Response {
  return Response.json(body, {
    status,
    headers: CORS_HEADERS,
  });
}

function createNoContentResponse(): Response {
  return new Response(null, {
    status: 204,
    headers: CORS_HEADERS,
  });
}

function createMethodNotAllowedResponse(): Response {
  return createJsonResponse(
    { error: "Method not allowed. Use POST." },
    405,
  );
}

function createBadRequestResponse(message: string): Response {
  return createJsonResponse({ error: message }, 400);
}

async function parseJsonBody<T>(request: Request): Promise<T> {
  try {
    return (await request.json()) as T;
  } catch {
    throw new Error("Request body must be valid JSON.");
  }
}

function assertHasAction(
  body: Partial<Pick<WorldRpContextRequestBody, "action">>,
): asserts body is Pick<WorldRpContextRequestBody, "action"> {
  if (!body.action || body.action.trim().length === 0) {
    throw new Error("Request body must include a non-empty `action`.");
  }
}

export async function handleWorldRpContextRequest(
  request: Request,
  options: HandleApiWorldRequestOptions,
): Promise<Response> {
  if (request.method === "OPTIONS") {
    return createNoContentResponse();
  }

  if (request.method !== "POST") {
    return createMethodNotAllowedResponse();
  }

  try {
    const body = await parseJsonBody<WorldRpContextRequestBody>(request);
    assertHasAction(body);
    assertWorldActionAllowed(body.action, options.config);

    const rpContext = await createSignedWorldRpContext(
      {
        rpId: options.config.rpId,
        signingKeyHex: options.config.signingKeyHex,
        action: body.action,
        ttl: body.ttl ?? options.config.rpContextTtlSeconds,
      },
      {
        signRequestImplementation: options.signRequestImplementation,
      },
    );

    const response: WorldRpContextResponse = createHybridWorldIdRequest({
      appId: options.config.appId,
      action: body.action,
      signal: body.signal,
      verificationLevel: body.verificationLevel,
      rpContext,
    });

    return createJsonResponse(response, 200);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to create RP context.";
    return createBadRequestResponse(message);
  }
}

export async function handleWorldVerifyRequest(
  request: Request,
  options: HandleApiWorldRequestOptions,
): Promise<Response> {
  if (request.method === "OPTIONS") {
    return createNoContentResponse();
  }

  if (request.method !== "POST") {
    return createMethodNotAllowedResponse();
  }

  try {
    const body = await parseJsonBody<WorldVerifyRequestBody>(request);
    assertHasAction(body);
    assertWorldActionAllowed(body.action, options.config);

    const payload = createWorldVerifyRequestPayload({
      nonce: body.nonce,
      action: body.action,
      responses: body.responses,
      protocolVersion: body.protocolVersion,
    });

    const response = await verifyWorldProof(payload, {
      rpId: options.config.rpId,
      apiBaseUrl: options.config.verifyApiBaseUrl,
      fetchImplementation: options.fetchImplementation,
    });

    return createJsonResponse(response, 200);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to verify World proof.";
    return createBadRequestResponse(message);
  }
}
