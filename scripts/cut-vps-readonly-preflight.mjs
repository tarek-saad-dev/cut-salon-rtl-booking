/**
 * CUT Salon deployment source preflight. SOURCE INSPECTION ONLY.
 * Never connects to VPS, reads secrets/env, builds, deploys or mutates data.
 */
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";

const safeHash = (content) => createHash("sha256").update(content).digest("hex");

const NEXT_GOOGLE = /\bfrom\s*["']next\/font\/google["']/;
const ALEXANDRIA_LOADER = /\bAlexandria\s*\(/;
const ACTIVE_MAIN_DEPLOY = /on:\s*\n\s*push:\s*\n\s*branches:\s*\n\s*-\s*main\b/m;

export function evaluateReadiness({
  layoutSource,
  packageManifest,
  packageLock,
  deployWorkflow,
  runtimeVersion,
}) {
  const hasLayout = typeof layoutSource === "string";
  const hasManifest = packageManifest && typeof packageManifest === "object";
  const hasLock = packageLock && typeof packageLock === "object";
  const hasWorkflow = typeof deployWorkflow === "string";
  const buildTimeFontLoader = hasLayout && NEXT_GOOGLE.test(layoutSource) &&
    ALEXANDRIA_LOADER.test(layoutSource);
  const lockedNext = hasLock
    ? (packageLock.packages?.["node_modules/next"]?.version ?? null)
    : null;

  const sourceChecks = {
    rootLayoutInspected: hasLayout,
    buildTimeAlexandriaGoogleLoader: hasLayout ? buildTimeFontLoader : "unknown",
    declaredNextVersion: hasManifest ? (packageManifest.dependencies?.next ?? null) : null,
    lockedNextVersion: typeof lockedNext === "string" ? lockedNext : null,
    npmLockfileVersion: hasLock && Number.isInteger(packageLock.lockfileVersion)
      ? packageLock.lockfileVersion : null,
    mainPushTriggersDeploy: hasWorkflow ? ACTIVE_MAIN_DEPLOY.test(deployWorkflow) : "unknown",
  };

  const blockers = [
    "No verified read-only report from the effective VPS build toolchain",
    "External VPS deploy script and atomic rollback/cutover are not verified",
    "No successful isolated VPS-toolchain build/font rendering evidence",
    "Last known main VPS deployment failed; success needs an authorized recheck",
  ];
  if (!hasLayout || !hasManifest || !hasLock || !hasWorkflow) {
    blockers.unshift("Missing repository source inputs; the source preflight is incomplete");
  }
  if (buildTimeFontLoader) {
    blockers.unshift("Build-time Alexandria next/font/google loader is present in root layout");
  }

  return Object.freeze({
    scope: "SOURCE_ONLY_NON_PRODUCTION",
    prodDeploySafe: false,
    approval: "NOT_AUTHORIZED",
    runtime: { nodeVersion: typeof runtimeVersion === "string" ? runtimeVersion : "unknown" },
    sourceChecks,
    blockers,
    unknowns: [
      "actual VPS Node/npm binary and clean release directory",
      "VPS deployment script build-before-cutover and rollback mechanics",
      "current running VPS revision and complete health checks",
      "Arabic/English rendered font parity and asset availability",
    ],
    next: "Authorized operator must run the separate read-only VPS audit from issue #26. Do not merge/deploy based on this report.",
  });
}

async function readKnownFile(relative) {
  try {
    return await readFile(new URL(relative, import.meta.url), "utf8");
  } catch {
    return null;
  }
}

export async function collectSourceReadiness() {
  const [layoutSource, manifestText, lockText, deployWorkflow] = await Promise.all([
    readKnownFile("../src/app/layout.tsx"),
    readKnownFile("../package.json"),
    readKnownFile("../package-lock.json"),
    readKnownFile("../.github/workflows/deploy-vps.yml"),
  ]);

  // Parse known package metadata only. Never print or return file contents.
  const parseJson = (txt) => {
    if (typeof txt !== "string") return null;
    try { return JSON.parse(txt); } catch { return null; }
  };
  const report = evaluateReadiness({
    layoutSource,
    packageManifest: parseJson(manifestText),
    packageLock: parseJson(lockText),
    deployWorkflow,
    runtimeVersion: process.version,
  });
  return Object.freeze({
    ...report,
    checksums: {
      packageLockSha256: lockText ? safeHash(lockText) : null,
      layoutSourceSha256: layoutSource ? safeHash(layoutSource) : null,
    },
  });
}

if (process.argv[1] && import.meta.url === new URL("file://" + process.argv[1]).href) {
  if (process.argv.length > 2 && process.argv[2] !== "--json") {
    process.stderr.write("Usage: node scripts/cut-vps-readonly-preflight.mjs [--json]\n");
    process.exitCode = 2;
  } else {
    const report = await collectSourceReadiness();
    process.stdout.write(JSON.stringify(report, null, 2) + "\n");
  }
}
