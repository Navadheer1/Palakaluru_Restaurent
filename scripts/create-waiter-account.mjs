import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";

// Read .env.local
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

const supabaseUrl = envVars["NEXT_PUBLIC_SUPABASE_URL"];
const supabaseServiceKey = envVars["SUPABASE_SERVICE_ROLE_KEY"];

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("Missing Supabase credentials in .env.local");
  process.exit(1);
}

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function main() {
  const accounts = [
    {
      email: "waiter@palakaluru.com",
      password: "Waiter@123",
      role: "waiter",
      name: "R. Naresh (Waiter)",
      phone: "+91 98480 34567",
    },
    {
      email: "admin@palakaluru.com",
      password: "Admin@123",
      role: "admin",
      name: "Nayudu Garu (Admin)",
      phone: "+91 98480 12345",
    },
    {
      email: "cashier@palakaluru.com",
      password: "Cashier@123",
      role: "cashier",
      name: "V. Lakshmi (Cashier)",
      phone: "+91 98480 23456",
    },
    {
      email: "kitchen@palakaluru.com",
      password: "Kitchen@123",
      role: "kitchen",
      name: "Chef Subba Rao (Kitchen)",
      phone: "+91 98480 45678",
    },
  ];

  const restaurantId = "a0000000-0000-0000-0000-000000000001";
  const branchId = "b0000000-0000-0000-0000-000000000001";

  const { data: usersData } = await supabaseAdmin.auth.admin.listUsers();
  const existingUsers = usersData?.users || [];

  for (const acc of accounts) {
    console.log(`Setting up ${acc.role.toUpperCase()} account: ${acc.email}...`);
    let user = existingUsers.find((u) => u.email === acc.email);

    if (!user) {
      const { data: created, error } = await supabaseAdmin.auth.admin.createUser({
        email: acc.email,
        password: acc.password,
        email_confirm: true,
        user_metadata: {
          name: acc.name,
          full_name: acc.name,
          role: acc.role,
        },
      });
      if (error) {
        console.error(`Error creating ${acc.email}:`, error.message);
        continue;
      }
      user = created.user;
      console.log(`Created ${acc.role} user (${user.id})`);
    } else {
      await supabaseAdmin.auth.admin.updateUserById(user.id, {
        password: acc.password,
        email_confirm: true,
        user_metadata: {
          name: acc.name,
          full_name: acc.name,
          role: acc.role,
        },
      });
      console.log(`Updated existing ${acc.role} user (${user.id})`);
    }
  }

  console.log("\n========================================================");
  console.log("             SYSTEM ACCOUNTS READY                      ");
  console.log("========================================================");
  for (const acc of accounts) {
    console.log(`ROLE: ${acc.role.toUpperCase()}`);
    console.log(`  Name:     ${acc.name}`);
    console.log(`  Email:    ${acc.email}`);
    console.log(`  Password: ${acc.password}\n`);
  }
  console.log("========================================================\n");
}

main().catch(console.error);
