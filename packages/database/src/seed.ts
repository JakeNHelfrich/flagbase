import { config } from "dotenv";
import { createDbClient } from "./client";
import { users, projects, environments, flags, flagEnvironmentConfigs } from "./schema/index";
import { createHash } from "crypto";

config({ path: "../../.env" });

async function seed() {
  const connectionString = process.env["DATABASE_URL"];
  if (!connectionString) {
    throw new Error("DATABASE_URL environment variable is required");
  }

  const { db, client } = createDbClient(connectionString);

  console.log("Starting seed...");

  // Create a simple password hash (in production, use bcrypt)
  // This is a SHA-256 hash for demonstration - real app should use bcrypt
  const passwordHash = createHash("sha256").update("password123").digest("hex");

  // Create test user
  const [testUser] = await db
    .insert(users)
    .values({
      email: "test@example.com",
      name: "Test User",
      passwordHash,
    })
    .returning();

  console.log("Created test user:", testUser?.email);

  // Create demo project
  const [demoProject] = await db
    .insert(projects)
    .values({
      key: "demo-project",
      name: "Demo Project",
      description: "A sample project to demonstrate Flagbase features",
    })
    .returning();

  console.log("Created demo project:", demoProject?.key);

  // Create environments
  const environmentData = [
    { key: "development", name: "Development", description: "Local development environment" },
    { key: "staging", name: "Staging", description: "Pre-production testing environment" },
    { key: "production", name: "Production", description: "Live production environment" },
  ];

  if (!demoProject) {
    throw new Error("Failed to create demo project");
  }

  const createdEnvironments = await db
    .insert(environments)
    .values(
      environmentData.map((env) => ({
        ...env,
        projectId: demoProject.id,
      }))
    )
    .returning();

  console.log(
    "Created environments:",
    createdEnvironments.map((e) => e.key).join(", ")
  );

  // Create sample boolean flag
  const [darkModeFlag] = await db
    .insert(flags)
    .values({
      projectId: demoProject.id,
      key: "enable-dark-mode",
      name: "Enable Dark Mode",
      description: "Enables the dark mode theme for users",
      type: "boolean",
      defaultValue: false,
    })
    .returning();

  console.log("Created flag:", darkModeFlag?.key);

  if (!darkModeFlag) {
    throw new Error("Failed to create dark mode flag");
  }

  // Create flag configs for each environment
  const flagConfigs = createdEnvironments.map((env) => ({
    flagId: darkModeFlag.id,
    environmentId: env.id,
    enabled: env.key === "development", // Only enabled in development
    value: env.key === "development", // true in dev, false elsewhere
    targetingRules: [],
  }));

  await db.insert(flagEnvironmentConfigs).values(flagConfigs);

  console.log("Created flag environment configs");

  // Close the connection
  await client.end();

  console.log("Seed completed successfully!");
}

seed().catch((error: unknown) => {
  console.error("Seed failed:", error);
  process.exit(1);
});
