// Jalankan: npm run sync   (cocok untuk crontab / GitHub Actions)
import { runSync } from "../lib/sources.js";
const r = await runSync();
console.log(JSON.stringify(r, null, 2));
process.exit(r.some(x => x.status === "error") ? 1 : 0);
