import { NextResponse } from "next/server";
import { parseDescription } from "@/lib/ai";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const { text } = (await req.json()) as { text?: string };
    if (!text || !text.trim()) {
      return NextResponse.json({ error: "请输入要解析的描述" }, { status: 400 });
    }
    const result = await parseDescription(text.trim());
    return NextResponse.json(result);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "UNKNOWN";
    if (msg === "AI_NOT_CONFIGURED") {
      return NextResponse.json({ error: "AI_NOT_CONFIGURED" }, { status: 503 });
    }
    return NextResponse.json({ error: msg }, { status: 502 });
  }
}
