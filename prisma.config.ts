import { config } from "dotenv";
import { defineConfig } from "prisma/config";

// Load environment variables from .env file
config();

export default defineConfig({
  migrations: {
    seed: `tsx prisma/seed.ts`,
  },
});
