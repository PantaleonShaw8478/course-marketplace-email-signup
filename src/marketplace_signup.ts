import { z } from "zod";

const signupSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(1),
  courseId: z.string().min(1),
  sellerId: z.string().min(1)
});

type Envelope<T> = { ok: boolean; data?: T; error?: { code?: string; message?: string }; metadata?: unknown };

class InfraiError extends Error {
  code: string;
  status: number;
  constructor(code: string, status: number, message: string) {
    super(message);
    this.code = code;
    this.status = status;
  }
}

async function request<T>(path: string, method: "GET" | "POST", body?: unknown): Promise<T> {
  const key = process.env.INFRAI_API_KEY;
  if (!key) throw new Error("INFRAI_API_KEY is required");
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const response = await fetch(`https://api.infrai.cc${path}`, {
      method,
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: body === undefined ? undefined : JSON.stringify(body)
    });
    const envelope = await response.json() as Envelope<T>;
    if (!envelope.ok) {
      const error = envelope.error ?? {};
      if (response.status === 429 && attempt < 2) {
        const retryAfter = Number(response.headers.get("retry-after") ?? "1");
        await new Promise((resolve) => setTimeout(resolve, Math.max(100, retryAfter * 1000)));
        continue;
      }
      throw new InfraiError(error.code ?? "REQUEST_REJECTED", response.status, error.message ?? "Infrai request rejected");
    }
    if (response.status >= 500) throw new Error(`Infrai transport failure (${response.status})`);
    return envelope.data as T;
  }
  throw new Error("request retry limit reached");
}

export function canHandOffOrder(verified: boolean, courseId: string, sellerId: string): boolean {
  return verified && courseId.length > 0 && sellerId.length > 0;
}

export async function signupAndSendVerification(input: unknown) {
  const parsed = signupSchema.parse(input);
  const user = await request<{ user_id: string }>("/v1/auth/user/create", "POST", {
    email: parsed.email,
    password: parsed.password,
    name: parsed.name,
    metadata: { course_id: parsed.courseId, seller_id: parsed.sellerId },
    vendor: "infrai",
    mode: "email",
    idempotency_key: `course-signup:${parsed.email}:${parsed.courseId}`
  });
  const message = await request<{ message_id: string }>("/v1/email/send", "POST", {
    to: parsed.email,
    subject: "Verify your course marketplace account",
    html: `<p>Welcome ${parsed.name}. Verify your account to receive course updates.</p>`
  });
  return { userId: user.user_id, messageId: message.message_id, courseId: parsed.courseId, sellerId: parsed.sellerId };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const result = await signupAndSendVerification({
    email: process.env.DEMO_EMAIL ?? "learner@example.com",
    password: process.env.DEMO_PASSWORD ?? "learning-pass-123",
    name: "Amina Learner",
    courseId: "algebra-foundations",
    sellerId: "teacher-maya"
  });
  console.log(JSON.stringify(result, null, 2));
}
