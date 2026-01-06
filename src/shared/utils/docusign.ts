import { SignJWT } from "jose";
import { createPrivateKey } from "crypto";
import { config } from "../config";

type DocuSignTokenResponse = {
  access_token: string;
  token_type: string;
  expires_in: number;
};

export type DocuSignSendEnvelopePayload = {
  name: string;
  email: string;
  driverId: number;
};

export class DocuSignError extends Error {
  public readonly status?: number;
  public readonly code?: string;
  public readonly details?: unknown;
  public readonly traceToken?: string;

  constructor(message: string, options: { status?: number; code?: string; details?: unknown; traceToken?: string }) {
    super(message);
    this.name = "DocuSignError";
    this.status = options.status;
    this.code = options.code;
    this.details = options.details;
    this.traceToken = options.traceToken;
  }
}

const normalizePrivateKey = (raw: string): string => {
  const trimmed = raw.trim();
  if (trimmed.includes("BEGIN")) {
    return trimmed.replace(/\\n/g, "\n");
  }

  const compact = trimmed.replace(/\s+/g, "");
  const lines = compact.match(/.{1,64}/g)?.join("\n") ?? compact;
  return `-----BEGIN RSA PRIVATE KEY-----\n${lines}\n-----END RSA PRIVATE KEY-----`;
};

const getJwtAssertion = async (): Promise<string> => {
  const privateKey = createPrivateKey(normalizePrivateKey(config.docusign.privateKey));
  const now = Math.floor(Date.now() / 1000);

  return new SignJWT({ scope: "signature impersonation" })
    .setProtectedHeader({ alg: "RS256", typ: "JWT" })
    .setIssuer(config.docusign.clientId)
    .setSubject(config.docusign.userId)
    .setAudience(config.docusign.oauthBasePath)
    .setIssuedAt(now)
    .setExpirationTime(now + 10 * 60)
    .sign(privateKey);
};

const parseResponseBody = async (res: Response): Promise<unknown> => {
  const text = await res.text();
  if (!text) {
    return undefined;
  }
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
};

const requestAccessToken = async (): Promise<DocuSignTokenResponse> => {
  const assertion = await getJwtAssertion();
  const body = new URLSearchParams({
    grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
    assertion,
  });

  const res = await fetch(`https://${config.docusign.oauthBasePath}/oauth/token`, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body,
  });

  const details = await parseResponseBody(res);
  if (!res.ok) {
    const errorCode =
      typeof details === "object" && details
        ? (details as { error?: string; errorCode?: string }).error ||
          (details as { error?: string; errorCode?: string }).errorCode
        : undefined;
    throw new DocuSignError("DocuSign token request failed", {
      status: res.status,
      code: errorCode,
      details,
      traceToken: res.headers.get("x-docusign-tracetoken") ?? undefined,
    });
  }

  if (!details || typeof details !== "object" || !("access_token" in details)) {
    throw new DocuSignError("DocuSign token response malformed", {
      details,
    });
  }

  return details as DocuSignTokenResponse;
};

export const sendDocusignEnvelope = async (payload: DocuSignSendEnvelopePayload): Promise<void> => {
  const token = await requestAccessToken();
  const res = await fetch(
    `${config.docusign.apiBasePath}/v2.1/accounts/${config.docusign.accountId}/envelopes`,
    {
      method: "POST",
      headers: {
        authorization: `Bearer ${token.access_token}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        templateId: config.docusign.templateId,
        status: "sent",
        templateRoles: [
          {
            roleName: config.docusign.signerRoleName,
            name: payload.name,
            email: payload.email,
          },
        ],
      }),
    }
  );

  const details = await parseResponseBody(res);
  if (!res.ok) {
    const errorCode =
      typeof details === "object" && details
        ? (details as { error?: string; errorCode?: string }).error ||
          (details as { error?: string; errorCode?: string }).errorCode
        : undefined;
    throw new DocuSignError("DocuSign envelope send failed", {
      status: res.status,
      code: errorCode,
      details,
      traceToken: res.headers.get("x-docusign-tracetoken") ?? undefined,
    });
  }
};
