"use client";

import { useEffect, useMemo, useState } from "react";
import { emptyNote, emptyItem, type DeliveryNote, type LineItem, type Party } from "@/lib/types";
import { lineAmount, totalAmount, amountInChinese } from "@/lib/calc";
import { loadNotes, upsertNote, deleteNote } from "@/lib/storage";
import type { AiParseResult } from "@/lib/ai";

export default function Home() {
  const [note, setNote] = useState<DeliveryNote>(() => emptyNote());
  const [history, setHistory] = useState<DeliveryNote[]>([]);
  const [aiText, setAiText] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiMsg, setAiMsg] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    setHistory(loadNotes());
  }, []);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 2500);
    return () => clearTimeout(t);
  }, [toast]);

  const total = useMemo(() => totalAmount(note.items), [note.items]);
  const chinese = useMemo(() => amountInChinese(total), [total]);

  function updateNote(patch: Partial<DeliveryNote>) {
    setNote((prev) => ({ ...prev, ...patch }));
  }
  function updateParty(role: "sender" | "receiver", patch: Partial<Party>) {
    setNote((prev) => ({ ...prev, [role]: { ...prev[role], ...patch } }));
  }
  function updateItem(id: string, patch: Partial<LineItem>) {
    setNote((prev) => ({
      ...prev,
      items: prev.items.map((it) => (it.id === id ? { ...it, ...patch } : it)),
    }));
  }
  function addItem() {
    setNote((prev) => ({ ...prev, items: [...prev.items, emptyItem()] }));
  }
  function removeItem(id: string) {
    setNote((prev) => ({
      ...prev,
      items: prev.items.length > 1 ? prev.items.filter((it) => it.id !== id) : prev.items,
    }));
  }

  function applyAiParsed(parsed: AiParseResult) {
    if (!parsed) return;
    const n = parsed.note ?? {};
    const sender = n.sender ?? {};
    const receiver = n.receiver ?? {};
    const items = (n.items ?? []).map((it) => ({
      id: crypto.randomUUID(),
      name: it.name ?? "",
      spec: it.spec ?? "",
      unit: it.unit ?? "件",
      quantity: Number(it.quantity) || 0,
      price: Number(it.price) || 0,
    }));
    setNote((prev) => ({
      ...prev,
      no: n.no || prev.no,
      date: n.date || prev.date,
      sender: { ...prev.sender, ...sender },
      receiver: { ...prev.receiver, ...receiver },
      items: items.length ? items : prev.items,
      remark: n.remark ?? prev.remark,
    }));
    if (parsed.warning) setAiMsg(`已解析，注意：${parsed.warning}`);
  }

  async function runAiParse() {
    if (!aiText.trim()) {
      setAiMsg("请先输入一段描述");
      return;
    }
    setAiLoading(true);
    setAiMsg(null);
    try {
      const res = await fetch("/api/parse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: aiText }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.error === "AI_NOT_CONFIGURED") {
          setAiMsg("AI 未配置：请在 .env.local 填写 AI_API_KEY / AI_BASE_URL / AI_MODEL 后重启服务。当前仅支持手动录入。");
        } else {
          setAiMsg(`解析失败：${data.error}`);
        }
        return;
      }
      applyAiParsed(data);
      setAiMsg("已自动填入表单，请核对后保存。");
    } catch {
      setAiMsg("网络错误，请稍后重试。");
    } finally {
      setAiLoading(false);
    }
  }

  function handleSave() {
    const cleaned: DeliveryNote = {
      ...note,
      items: note.items.filter((it) => it.name.trim() || it.quantity || it.price),
    };
    if (!cleaned.items.length) {
      setAiMsg("至少填写一行商品");
      return;
    }
    const next = upsertNote(cleaned);
    setHistory(next);
    setNote({ ...cleaned, id: crypto.randomUUID(), no: nextNo() });
    setToast("已保存到本地历史");
  }

  function handleNew() {
    setNote(emptyNote());
    setAiText("");
    setAiMsg(null);
  }

  function handleLoad(id: string) {
    const found = history.find((n) => n.id === id);
    if (found) setNote({ ...found, id: crypto.randomUUID(), no: found.no });
  }

  function handleDelete(id: string) {
    if (!confirm("确认删除这张单据吗？")) return;
    setHistory(deleteNote(id));
    setToast("已删除");
  }

  return (
    <div className="app">
      <header className="topbar">
        <div className="brand">
          <span className="mark">送</span>
          <div>
            <strong>送货单生成器</strong>
            <small>自然语言一键成单 · 自动计算 · 打印导出</small>
          </div>
        </div>
        <div className="actions">
          <button className="btn ghost" onClick={handleNew}>新建</button>
          <button className="btn primary" onClick={handleSave}>保存</button>
          <a className="btn" href={`/note/${note.id}?from=edit`} target="_blank" rel="noreferrer">预览 / 打印</a>
        </div>
      </header>

      <div className="layout">
        <main className="main">
          <section className="card ai-card">
            <div className="card-title">
              <span className="kicker">AI 解析</span>
              <h2>说一句话，自动填表</h2>
            </div>
            <textarea
              className="ai-input"
              placeholder="例如：张三从北京海淀区给上海浦东新区的李四送了10箱苹果每箱50元，3箱梨每箱40元，备注请轻放。"
              value={aiText}
              onChange={(e) => setAiText(e.target.value)}
              rows={3}
            />
            <div className="ai-row">
              <button className="btn primary" onClick={runAiParse} disabled={aiLoading}>
                {aiLoading ? "解析中…" : "AI 解析并填入"}
              </button>
              <span className="hint">AI 只做预填，金额和字段请人工核对；未配置密钥时本按钮不工作。</span>
            </div>
            {aiMsg && <div className="ai-msg">{aiMsg}</div>}
          </section>

          <section className="card">
            <div className="card-title">
              <span className="kicker">单据信息</span>
              <h2>基础信息</h2>
            </div>
            <div className="grid-2">
              <Field label="单据编号">
                <input value={note.no} onChange={(e) => updateNote({ no: e.target.value })} />
              </Field>
              <Field label="送货日期">
                <input type="date" value={note.date} onChange={(e) => updateNote({ date: e.target.value })} />
              </Field>
            </div>

            <div className="grid-2">
              <PartyBlock title="发货方" party={note.sender} onChange={(p) => updateParty("sender", p)} />
              <PartyBlock title="收货方" party={note.receiver} onChange={(p) => updateParty("receiver", p)} />
            </div>
          </section>

          <section className="card">
            <div className="card-title">
              <span className="kicker">商品明细</span>
              <h2>商品行（自动计算）</h2>
              <button className="btn small" onClick={addItem}>+ 新增一行</button>
            </div>
            <div className="items-table">
              <div className="items-head">
                <span>商品名称</span>
                <span>规格</span>
                <span>单位</span>
                <span className="num">数量</span>
                <span className="num">单价</span>
                <span className="num">金额</span>
                <span></span>
              </div>
              {note.items.map((it) => (
                <div className="items-row" key={it.id}>
                  <input value={it.name} onChange={(e) => updateItem(it.id, { name: e.target.value })} placeholder="名称" />
                  <input value={it.spec} onChange={(e) => updateItem(it.id, { spec: e.target.value })} placeholder="规格" />
                  <input value={it.unit} onChange={(e) => updateItem(it.id, { unit: e.target.value })} placeholder="件" className="unit" />
                  <input type="number" min="0" value={it.quantity} onChange={(e) => updateItem(it.id, { quantity: Number(e.target.value) })} className="num" />
                  <input type="number" min="0" step="0.01" value={it.price} onChange={(e) => updateItem(it.id, { price: Number(e.target.value) })} className="num" />
                  <span className="num amount">¥{lineAmount(it).toFixed(2)}</span>
                  <button className="icon-btn" onClick={() => removeItem(it.id)} aria-label="删除">×</button>
                </div>
              ))}
            </div>
            <div className="totals">
              <div className="total-row"><span>合计</span><strong>¥{total.toFixed(2)}</strong></div>
              <div className="total-row"><span>大写</span><span>{chinese}</span></div>
            </div>
          </section>

          <section className="card">
            <div className="card-title">
              <span className="kicker">备注</span>
              <h2>其他说明</h2>
            </div>
            <textarea
              className="remark"
              placeholder="备注、付款方式、运输要求等"
              value={note.remark}
              onChange={(e) => updateNote({ remark: e.target.value })}
              rows={3}
            />
          </section>
        </main>

        <aside className="sidebar">
          <div className="card-title">
            <span className="kicker">本地留存</span>
            <h2>历史单据</h2>
            <span className="count">{history.length}</span>
          </div>
          {history.length === 0 ? (
            <p className="empty">暂无历史记录，保存后会出现在这里。</p>
          ) : (
            <ul className="history">
              {history.map((h) => (
                <li key={h.id}>
                  <div className="h-main">
                    <strong>{h.no}</strong>
                    <span>{h.items.length} 行 · ¥{totalAmount(h.items).toFixed(2)}</span>
                  </div>
                  <div className="h-actions">
                    <button onClick={() => handleLoad(h.id)}>载入</button>
                    <a href={`/note/${h.id}`} target="_blank" rel="noreferrer">打印</a>
                    <button className="danger" onClick={() => handleDelete(h.id)}>删</button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </aside>
      </div>

      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="field">
      <span>{label}</span>
      {children}
    </label>
  );
}

function PartyBlock({ title, party, onChange }: { title: string; party: Party; onChange: (p: Partial<Party>) => void }) {
  return (
    <div className="party">
      <h3>{title}</h3>
      <Field label="名称"><input value={party.name} onChange={(e) => onChange({ name: e.target.value })} /></Field>
      <Field label="联系人"><input value={party.contact} onChange={(e) => onChange({ contact: e.target.value })} /></Field>
      <Field label="电话"><input value={party.phone} onChange={(e) => onChange({ phone: e.target.value })} /></Field>
      <Field label="地址"><input value={party.address} onChange={(e) => onChange({ address: e.target.value })} /></Field>
    </div>
  );
}

function nextNo(): string {
  const now = new Date();
  const stamp = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}`;
  return `SH-${stamp}-${String(Date.now()).slice(-3)}`;
}
