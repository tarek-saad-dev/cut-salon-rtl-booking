#!/usr/bin/env node
/**
 * Read-only local stand-in for the public booking API.
 *
 * casher-five.vercel.app currently returns DEPLOYMENT_NOT_FOUND. Production
 * cutsaloon.com serves the same public JSON on the same origin, but it does
 * not allow browser calls from http://localhost:3000. This proxy lets `next dev`
 * load catalog and availability without sending booking mutations upstream.
 */
import http from "node:http";
import https from "node:https";

const PORT = Number(process.env.CUT_DEV_API_PROXY_PORT || 5500);
const HOST = process.env.CUT_DEV_API_PROXY_HOST || "127.0.0.1";
const UPSTREAM = process.env.CUT_DEV_API_PROXY_UPSTREAM || "https://cutsaloon.com";

const ALLOWED_ORIGINS = new Set([
  "http://localhost:3000",
  "http://127.0.0.1:3000",
]);

const READ_POST_EXACT = new Set([
  "/api/public/booking/v2/availability",
  "/api/public/booking/check-slot",
]);

function isReadPost(pathname) {
  if (READ_POST_EXACT.has(pathname)) return true;
  if (pathname.includes("/cross-branch-availability")) return true;
  return /^\/api\/public\/booking\/barbers\/[^/]+\/availability(?:\/|$)/.test(pathname);
}

function corsHeaders(origin) {
  const headers = {
    "Access-Control-Allow-Methods": "GET, HEAD, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Accept, Content-Type, If-None-Match, If-Match",
    "Access-Control-Expose-Headers":
      "ETag, X-Booking-Contract-Version, X-Request-Id, Retry-After, X-RateLimit-Limit, X-RateLimit-Remaining, X-RateLimit-Reset",
    "Access-Control-Max-Age": "600",
    Vary: "Origin",
  };
  if (origin && ALLOWED_ORIGINS.has(origin)) {
    headers["Access-Control-Allow-Origin"] = origin;
  }
  return headers;
}

function sendJson(res, status, origin, body, extra = {}) {
  const payload = JSON.stringify(body);
  res.writeHead(status, {
    ...corsHeaders(origin),
    ...extra,
    "Content-Type": "application/json; charset=utf-8",
    "Content-Length": Buffer.byteLength(payload),
  });
  res.end(payload);
}

const server = http.createServer((req, res) => {
  const origin = typeof req.headers.origin === "string" ? req.headers.origin : "";
  const requestUrl = new URL(req.url || "/", "http://127.0.0.1");
  const pathname = requestUrl.pathname;

  if (req.method === "OPTIONS") {
    res.writeHead(204, corsHeaders(origin));
    res.end();
    return;
  }

  const method = req.method || "GET";
  const allowed =
    method === "GET" || method === "HEAD" || (method === "POST" && isReadPost(pathname));
  if (!allowed) {
    sendJson(
      res,
      405,
      origin,
      {
        ok: false,
        error: "read_only_proxy",
        message: "Cloud Agent dev proxy blocks booking and profile mutations.",
      },
      { Allow: "GET, HEAD, OPTIONS" },
    );
    return;
  }

  const target = new URL(`${pathname}${requestUrl.search}`, UPSTREAM);
  const headers = {
    accept: req.headers.accept || "application/json",
    "user-agent": "cut-salon-cloud-readonly-proxy",
  };
  if (req.headers["content-type"]) headers["content-type"] = req.headers["content-type"];
  if (req.headers["if-none-match"]) headers["if-none-match"] = req.headers["if-none-match"];

  const upstreamReq = https.request(
    target,
    { method, headers },
    (upstreamRes) => {
      const responseHeaders = { ...corsHeaders(origin) };
      for (const name of [
        "content-type",
        "cache-control",
        "etag",
        "x-booking-contract-version",
        "x-request-id",
        "retry-after",
        "x-ratelimit-limit",
        "x-ratelimit-remaining",
        "x-ratelimit-reset",
      ]) {
        const value = upstreamRes.headers[name];
        if (value) responseHeaders[name] = value;
      }
      res.writeHead(upstreamRes.statusCode || 502, responseHeaders);
      if (method === "HEAD") {
        upstreamRes.resume();
        res.end();
        return;
      }
      upstreamRes.pipe(res);
    },
  );

  upstreamReq.on("error", (error) => {
    if (res.headersSent) {
      res.destroy(error);
      return;
    }
    sendJson(res, 502, origin, { ok: false, error: "upstream_unreachable", message: error.message });
  });

  if (method === "POST") {
    req.pipe(upstreamReq);
  } else {
    upstreamReq.end();
  }
});

server.listen(PORT, HOST, () => {
  console.log(`readonly api proxy http://${HOST}:${PORT} -> ${UPSTREAM}`);
});
