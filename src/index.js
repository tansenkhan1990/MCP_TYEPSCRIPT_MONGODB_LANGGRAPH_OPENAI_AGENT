import "./bootstrap.js";
import readline from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";
import { printBanner } from "./cli/banner.js";
import { handleQuery } from "./cli/handleQuery.js";
import { toErrorMessage } from "./lib/errors.js";

async function runInteractive() {
  const rl = readline.createInterface({ input, output });
  printBanner();

  while (true) {
    const query = (await rl.question("You> ")).trim();
    if (!query) continue;
    if (query.toLowerCase() === "exit" || query.toLowerCase() === "quit") break;

    try {
      await handleQuery(query);
    } catch (err) {
      console.error("Workflow failed:", toErrorMessage(err));
    }
  }

  rl.close();
  console.log("Goodbye.");
}

async function main() {
  const cliQuery = process.argv.slice(2).join(" ").trim();
  if (cliQuery) {
    await handleQuery(cliQuery);
    return;
  }

  await runInteractive();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
