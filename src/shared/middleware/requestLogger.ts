import { Request, Response, NextFunction } from "express";
import { randomUUID } from "crypto";

// Logs request/response payloads to help debug API traffic.
export const requestLogger = (req: Request, res: Response, next: NextFunction) => {
  const requestId = randomUUID();
  const start = Date.now();

  // Capture request context for traceability.
  const context = {
    requestId,
    method: req.method,
    path: req.originalUrl,
    params: req.params,
    query: req.query,
    headers: req.headers,
    body: req.body,
  };

  console.log("[request]", context);

  // Wrap response writers to log output payloads.
  const originalJson = res.json.bind(res);
  const originalSend = res.send.bind(res);

  res.json = (body: unknown) => {
    const durationMs = Date.now() - start;
    console.log("[response]", { requestId, status: res.statusCode, durationMs, body });
    return originalJson(body);
  };

  res.send = (body: unknown) => {
    const durationMs = Date.now() - start;
    console.log("[response]", { requestId, status: res.statusCode, durationMs, body });
    return originalSend(body);
  };

  res.on("finish", () => {
    if (!res.headersSent) {
      const durationMs = Date.now() - start;
      console.log("[response]", { requestId, status: res.statusCode, durationMs });
    }
  });

  // Attach requestId so error handler can correlate logs.
  res.locals.requestId = requestId;
  return next();
};
