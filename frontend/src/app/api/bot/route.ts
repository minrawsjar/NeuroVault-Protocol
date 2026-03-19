import { NextRequest, NextResponse } from "next/server";

const GEMINI_API_KEY = (process.env.GEMINI_API_KEY || "").trim();
const GEMINI_MODELS = ["gemini-2.0-flash", "gemini-1.5-flash", "gemini-1.5-flash-latest"];

function fallbackReply(command: string) {
  const lower = command.toLowerCase();

  if (lower.includes("treasury") && lower.includes("status")) {
    return "Treasury: $284.7K | DOT 62% | USDC 38% | APY 12.4% | 47 stakers";
  }

  if (lower.startsWith("stake ")) {
    return `Queued simulated stake command: ${command.replace(/^stake\s+/i, "")}`;
  }

  if (lower.includes("governance") || lower.includes("queue")) {
    return "Governance queue: #19 (voting), #18 (ready to execute), #17 (completed)";
  }

  return "Unknown command. Try: treasury status, stake <amount> <token>, governance queue";
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const command = String(body?.command ?? "").trim();

    if (!command) {
      return NextResponse.json({ error: "Missing command" }, { status: 400 });
    }

    if (!GEMINI_API_KEY) {
      return NextResponse.json({ reply: fallbackReply(command), provider: "fallback" });
    }

    const prompt = `You are NeuroVault treasury bot. Respond in ONE short line only.\n\nUser command: ${command}\n\nSupported operations:\n- treasury status\n- stake <amount> <DOT|USDC>\n- governance queue\n\nIf command is unsupported, reply with: Unknown command. Try: treasury status, stake <amount> <token>, governance queue`;

    let reply: string | null = null;

    for (const model of GEMINI_MODELS) {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-goog-api-key": GEMINI_API_KEY,
          },
          body: JSON.stringify({
            contents: [
              {
                role: "user",
                parts: [{ text: prompt }],
              },
            ],
            generationConfig: {
              temperature: 0.2,
              maxOutputTokens: 120,
            },
          }),
        }
      );

      if (!response.ok) {
        continue;
      }

      const data = await response.json();
      const candidateText = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
      if (candidateText) {
        reply = candidateText;
        break;
      }
    }

    if (!reply) {
      return NextResponse.json({ reply: fallbackReply(command), provider: "fallback" });
    }

    return NextResponse.json({ reply, provider: "gemini" });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
