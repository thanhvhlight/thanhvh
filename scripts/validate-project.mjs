import { existsSync, readFileSync } from "node:fs";
const required = [
  "app/page.tsx",
  "app/api/telegram/route.ts",
  "app/api/admin/dashboard/route.ts",
  "app/api/admin/banks/route.ts",
  "components/Dashboard.tsx",
  "components/BankManager.tsx",
  "lib/dates.ts",
  "lib/vietqr.ts",
  "supabase/schema.sql",
  "supabase/upgrade-v1.1-to-v1.2.sql",
  "package.json",
];
for (const file of required) if (!existsSync(file)) throw new Error(`Thiếu file: ${file}`);
const pkg = JSON.parse(readFileSync("package.json","utf8"));
if (pkg.engines?.node !== "24.x") throw new Error("Node engine phải là 24.x");
if (!pkg.dependencies?.next || !pkg.dependencies?.["@supabase/supabase-js"]) throw new Error("Thiếu dependency chính");
console.log("Project structure OK");
