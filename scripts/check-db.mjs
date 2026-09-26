import { createClient } from "@supabase/supabase-js";
import fs from "fs";

const envContent = fs.readFileSync(".env.local", "utf8");
const envVars = {};
for (const line of envContent.split("\n")) {
  const match = line.match(/^\s*([\w_]+)\s*=\s*(.*)?\s*$/);
  if (match) {
    let value = match[2] || "";
    if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
    envVars[match[1]] = value.trim();
  }
}

const client = createClient(envVars.NEXT_PUBLIC_SUPABASE_URL, envVars.SUPABASE_SERVICE_ROLE_KEY);

async function check() {
  const tables = ["profiles", "staff", "users", "restaurants", "tables", "orders", "restaurant_tables"];
  for (const t of tables) {
    const { data: res, error: err } = await client.from(t).select("*").limit(1);
    console.log(`Table: ${t} -> ${err ? err.message : "OK"}`);
  }
}

check();
