// Vercel serverless function — proxies the chat to Google Gemini (free tier).
// The API key stays server-side (set GEMINI_API_KEY in Vercel env vars).
// Get a free key at https://aistudio.google.com/app/apikey

const LANG_NAME: Record<string, string> = {
  en: "English",
  am: "Amharic",
  om: "Afaan Oromo",
};

const APP_CONTEXT = `
You are the built-in assistant for "InflaTax", a small web app used in Ethiopia
to compute "Taaksii Bara 2018" (this year's tax) for Schedule "B" taxpayers.

The core idea the app demonstrates:
- A new flat "curfew" schedule rate replaced the old assessment. Charging this
  year with the new rate alone would often be far LESS than the business paid
  last year (a revenue drop). So instead of resetting to the new rate, this
  year's tax KEEPS last year's tax and ADDS ONLY the increase that inflation
  brings to the curfew tax.

How the numbers are computed (Birr):
- Two inputs are entered for each taxpayer: the sales/turnover and last year's
  actual tax (the 2017 tax paid).
- Entry type:
  - "Tax": the full turnover feeds the calculation.
  - "Rental": only 50% (rental_share) of the turnover feeds the calculation.
  The amount fed in is called the "base".
- Curfew (proclamation) schedule rate by amount:
  0-100,000: 2%; 100,001-500,000: 3%; 500,001-1,000,000: 5%;
  1,000,001-1,500,000: 7%; 1,500,001+: 9%.
- tax_before = base * curfew(base)
- sales_with = base * (1 + inflation_rate)  (default inflation 15.2%)
- tax_with = sales_with * curfew(sales_with)
- Garaagaruma (difference) = tax_with - tax_before
- Taaksii Bara 2018 = last year's tax + Garaagaruma.

Worked example: turnover 450,000, last year's tax 50,370. Curfew before =
13,500 (3%); inflated sales 518,400; curfew with = 25,920 (5%); difference
12,420; this year's tax = 50,370 + 12,420 = 62,790.

Usage: enter name, TIN, sales and last year's tax (business type optional), pick
Tax or Rental, and Calculate. Each row can be printed as a card — once printed
it is locked and fixed; only an admin can void a locked entry (kept on a void
trail the superadmin sees). History can be searched, paginated, and shared.

Answer clearly and briefly. Help users understand the tax, inflation, and how a
number was reached. If asked something unrelated, gently steer back to the app.
`;

export default async function handler(req: any, res: any) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const key = process.env.GEMINI_API_KEY;
  if (!key) {
    res.status(200).json({ code: "not_configured" });
    return;
  }

  try {
    const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
    const messages = Array.isArray(body?.messages) ? body.messages : [];
    const lang = LANG_NAME[body?.lang] || "the user's language";

    const contents = messages
      .filter((m: any) => m && (m.role === "user" || m.role === "assistant"))
      .slice(-12)
      .map((m: any) => ({
        role: m.role === "assistant" ? "model" : "user",
        parts: [{ text: String(m.content ?? "") }],
      }));

    const payload = {
      systemInstruction: {
        parts: [
          { text: `${APP_CONTEXT}\n\nReply in ${lang}. Keep answers concise.` },
        ],
      },
      contents,
      generationConfig: { temperature: 0.4, maxOutputTokens: 600 },
    };

    const model = process.env.GEMINI_MODEL || "gemini-2.5-flash";
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`;
    const gres = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!gres.ok) {
      res
        .status(200)
        .json({ code: gres.status === 429 ? "rate_limited" : "error" });
      return;
    }

    const data = await gres.json();
    const reply =
      data?.candidates?.[0]?.content?.parts
        ?.map((p: any) => p.text)
        .join("") || "Sorry, I couldn't answer that.";
    res.status(200).json({ reply });
  } catch {
    res.status(200).json({ code: "error" });
  }
}
