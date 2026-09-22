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

const supabase = createClient(
  envVars["NEXT_PUBLIC_SUPABASE_URL"],
  envVars["NEXT_PUBLIC_SUPABASE_ANON_KEY"]
);

async function testLogin() {
  const { data, error } = await supabase.auth.signInWithPassword({
    email: "waiter@palakaluru.com",
    password: "Waiter@123",
  });

  if (error) {
    console.error("Sign-in failed:", error.message);
    process.exit(1);
  }

  console.log("=========================================");
  console.log("   WAITER AUTH SIGN-IN VERIFIED SUCCESS  ");
  console.log("=========================================");
  console.log("Logged in user email:", data.user.email);
  console.log("Assigned role:", data.user.user_metadata?.role);
  console.log("Full Name:", data.user.user_metadata?.name);
  console.log("Token received successfully:", data.session ? "YES" : "NO");
  console.log("=========================================");
}

testLogin().catch(console.error);
