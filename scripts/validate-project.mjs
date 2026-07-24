import { existsSync, readFileSync } from "node:fs";
const required = ["package.json","app/api/telegram/route.ts","lib/repository.ts","supabase/schema.sql","README.md",".env.example"];
for (const file of required) if (!existsSync(file)) throw new Error(`Thiếu file: ${file}`);
const pkg = JSON.parse(readFileSync("package.json","utf8"));
if (pkg.engines?.node !== "24.x") throw new Error("Node engine phải là 24.x");
if (!pkg.dependencies?.next || !pkg.dependencies?.["@supabase/supabase-js"]) throw new Error("Thiếu dependency chính");
console.log("Project structure OK");
