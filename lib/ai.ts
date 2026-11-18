export interface AiParseResult {
  note?: {
    no?: string;
    date?: string;
    sender?: { name?: string; contact?: string; address?: string; phone?: string };
    receiver?: { name?: string; contact?: string; address?: string; phone?: string };
    items?: Array<{ name?: string; spec?: string; unit?: string; quantity?: number; price?: number }>;
    remark?: string;
  };
  warning?: string;
}

const SYSTEM_PROMPT = `你是一个送货单结构化解析助手。用户会输入一段自然语言描述（可能包含发货方、收货方、商品、数量、单价、日期、备注等）。
请把它解析为一个送货单 JSON 对象，字段如下：
{
  "note": {
    "no": "单据编号（可选，没有就留空字符串）",
    "date": "送货日期，格式 YYYY-MM-DD（可选）",
    "sender": { "name": "发货方名称", "contact": "联系人", "address": "地址", "phone": "电话" },
    "receiver": { "name": "收货方名称", "contact": "联系人", "address": "地址", "phone": "电话" },
    "items": [ { "name": "商品名称", "spec": "规格", "unit": "单位", "quantity": 数量, "price": 单价 } ],
    "remark": "备注"
  },
  "warning": "可选：对不确定或缺失字段的说明"
}
规则：
1. 数量和单价必须是数字，无法确定就用 0。
2. 单位默认用"件"，用户明确说了才改。
3. 只输出 JSON，不要多余文字。
4. 不确定的字段留空字符串，不要编造。`;

export async function parseDescription(text: string): Promise<AiParseResult> {
  const apiKey = process.env.AI_API_KEY;
  const baseUrl = process.env.AI_BASE_URL;
  const model = process.env.AI_MODEL;
  if (!apiKey || !baseUrl || !model) {
    throw new Error("AI_NOT_CONFIGURED");
  }

  const res = await fetch(`${baseUrl.replace(/\/$/, "")}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: text },
      ],
      response_format: { type: "json_object" },
      temperature: 0.2,
    }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`AI_UPSTREAM_${res.status}: ${body.slice(0, 300)}`);
  }

  const data = (await res.json()) as { choices?: Array<{ message?: { content?: string } }> };
  const content = data.choices?.[0]?.message?.content ?? "{}";
  try {
    return JSON.parse(content) as AiParseResult;
  } catch {
    throw new Error("AI_INVALID_JSON");
  }
}
