import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const contracts = [
  { name: "ProofBounty", exportName: "PROOFBOUNTY_ABI" },
  { name: "SubmissionCredibility", exportName: "CREDIBILITY_ABI" },
];

const sections = contracts.map(({ name, exportName }) => {
  const artifactPath = join(root, "contracts", "out", `${name}.sol`, `${name}.json`);
  let artifact;
  try {
    artifact = JSON.parse(readFileSync(artifactPath, "utf8"));
  } catch {
    console.error(`Missing ${artifactPath}. Run "npm run contracts:build" first.`);
    process.exit(1);
  }
  return `export const ${exportName} = ${JSON.stringify(artifact.abi, null, 2)} as const;\n`;
});

const target = join(root, "src", "lib", "contracts", "abi.ts");
mkdirSync(dirname(target), { recursive: true });
writeFileSync(target, sections.join("\n"));
console.log(`Wrote ${target} (${contracts.map((c) => c.name).join(", ")})`);
