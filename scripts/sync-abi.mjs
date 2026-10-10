import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const contract = process.argv[2] ?? "ProofBounty";
const artifactPath = join(root, "contracts", "out", `${contract}.sol`, `${contract}.json`);

let artifact;
try {
  artifact = JSON.parse(readFileSync(artifactPath, "utf8"));
} catch {
  console.error(`Missing ${artifactPath}. Run "npm run contracts:build" first.`);
  process.exit(1);
}

const target = join(root, "src", "lib", "contracts", "abi.ts");
mkdirSync(dirname(target), { recursive: true });
writeFileSync(
  target,
  `export const PROOFBOUNTY_ABI = ${JSON.stringify(artifact.abi, null, 2)} as const;\n`,
);
console.log(`Wrote ${target} from ${contract}`);
