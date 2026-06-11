import { Elysia, status } from "elysia";
import { redis } from "bun";
import { z } from "zod";

const CODE_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
const CODE_LENGTH = 6;
const SAVE_TTL_SECONDS = 60 * 60 * 24 * 7; // 7 days
const KEY_PREFIX = "save:";

// Same shape as the file-based export payload produced by the data manager.
const pushSchema = z.object({
  version: z.number().optional(),
  exportedAt: z.string().optional(),
  entries: z
    .array(
      z.object({
        key: z.string().min(1),
        value: z.string(),
      }),
    )
    .min(1),
});

const codeParamSchema = z.object({
  code: z
    .string()
    .length(CODE_LENGTH)
    .regex(/^[A-Z0-9]+$/),
});

function generateCode(): string {
  const bytes = new Uint8Array(CODE_LENGTH);
  crypto.getRandomValues(bytes);
  let code = "";
  for (let i = 0; i < CODE_LENGTH; i++) {
    code += CODE_ALPHABET[bytes[i] % CODE_ALPHABET.length];
  }
  return code;
}

async function generateUniqueCode(): Promise<string> {
  for (let attempt = 0; attempt < 10; attempt++) {
    const code = generateCode();
    if (!(await redis.exists(KEY_PREFIX + code))) {
      return code;
    }
  }
  throw new Error("Failed to generate a unique code");
}

const app = new Elysia({ prefix: "/api" })
  .get("/healthcheck", async () => {
    try {
      await redis.send("PING", []);
      return { status: "ok" };
    } catch {
      return status(503, { status: "unavailable" });
    }
  })
  .post(
    "/push",
    async ({ body }) => {
      const code = await generateUniqueCode();
      await redis.set(KEY_PREFIX + code, JSON.stringify(body));
      await redis.expire(KEY_PREFIX + code, SAVE_TTL_SECONDS);
      return { code };
    },
    { body: pushSchema },
  )
  .get(
    "/pull/:code",
    async ({ params: { code } }) => {
      const stored = await redis.get(KEY_PREFIX + code);
      if (stored === null) {
        return status(404, { error: "not found" });
      }
      return JSON.parse(stored);
    },
    { params: codeParamSchema },
  );

app.listen(3000);

console.log(`API server listening on http://localhost:3000`);
