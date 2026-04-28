import "dotenv/config";
import { formatCreditWarning, getApiCredit } from "./billing.js";

async function main(): Promise<void> {
  const credit = await getApiCredit();
  const warning = formatCreditWarning(credit);

  if (warning) {
    console.warn(warning);
  }

  console.log(`credit: ${credit.credit}`);
  console.log(`has_free_credit: ${credit.has_free_credit}`);
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(message);
  process.exitCode = 1;
});
