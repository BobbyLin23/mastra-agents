import "dotenv/config";
import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";

export const env = createEnv({
  server: {
    // Comma-separated list of allowed origins, e.g. "http://localhost:3001,http://localhost:4111"
    CORS_ORIGIN: z
      .string()
      .transform((value) => value.split(",").map((origin) => origin.trim()).filter(Boolean)),
    NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  },
  runtimeEnv: process.env,
  skipValidation: !!process.env.SKIP_ENV_VALIDATION,
  emptyStringAsUndefined: true,
});
