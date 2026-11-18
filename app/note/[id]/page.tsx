"use client";

import { useEffect, useState, use } from "react";
import { getNote } from "@/lib/storage";
import { lineAmount, totalAmount, amountInChinese } from "@/lib/calc";
import type { DeliveryNote } from "@/lib/types";

export default function NotePrintPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [note, setNote] = useState<DeliveryNote | null>(null);

  useEffect(() => {
    setNote(getNote(id) ?? null);
  }, [id]);

  useEffect(() => {
    if (note) {
      const t = setTimeout(() => window.print(), 400);
      return () => clearTimeout(t);
    }
  }, [note]);

  if (!note) {
    return (
      <div style={{ padding: 60, fontFamily: "sans-serif", textAlign: "center" }}>
        <p>未找到该单据（可能已被删除）。</p>
        <a href="/">返回首页</a>
      </div>
    );
  }

  const total = totalAmount(note.items);

  return (
    <div className="print-page">
      <div className="print-toolbar">
        <a href="/">← 返回编辑</a>
        <button onClick={() => window.print()}>打印 / 导出 PDF</button>
      </div>

      <div className="note-paper">
        <h1>送 货 单</h1>
        <div className="note-meta">
          <span>单据编号：{note.no}</span>
          <span>日期：{note.date}</span>
        </div>

        <table className="party-table">
          <tbody>
            <tr>
              <th style={{ width: 80 }}>发货方</th>
              <td><strong>{note.sender.name}</strong></td>
              <th style={{ width: 80 }}>收货方</th>
              <td><strong>{note.receiver.name}</strong></td>
            </tr>
            <tr>
              <th>联系人</th>
              <td>{note.sender.contact}</td>
              <th>联系人</th>
              <td>{note.receiver.contact}</td>
            </tr>
            <tr>
              <th>电话</th>
              <td>{note.sender.phone}</td>
              <th>电话</th>
              <td>{note.receiver.phone}</td>
            </tr>
            <tr>
              <th>地址</th>
              <td colSpan={3}>{note.sender.address || "—"}</td>
            </tr>
            <tr>
              <th>收货地址</th>
              <td colSpan={3}>{note.receiver.address || "—"}</td>
            </tr>
          </tbody>
        </table>

        <table className="goods-table">
          <thead>
            <tr>
              <th>序号</th>
              <th>商品名称</th>
              <th>规格</th>
              <th>单位</th>
              <th>数量</th>
              <th>单价</th>
              <th>金额</th>
            </tr>
          </thead>
          <tbody>
            {note.items.map((it, i) => (
              <tr key={it.id}>
                <td>{i + 1}</td>
                <td>{it.name}</td>
                <td>{it.spec}</td>
                <td>{it.unit}</td>
                <td>{it.quantity}</td>
                <td>¥{it.price.toFixed(2)}</td>
                <td>¥{lineAmount(it).toFixed(2)}</td>
              </tr>
            ))}
            <tr className="total-row">
              <td colSpan={6} className="right">合计</td>
              <td>¥{total.toFixed(2)}</td>
            </tr>
            <tr>
              <td colSpan={6} className="right">大写金额</td>
              <td>{amountInChinese(total)}</td>
            </tr>
          </tbody>
        </table>

        {note.remark && (
          <div className="remark-block">
            <strong>备注：</strong>{note.remark}
          </div>
        )}

        <div className="sign-area">
          <div><span>发货方签字：</span></div>
          <div><span>收货方签字：</span></div>
          <div><span>日期：</span></div>
        </div>
      </div>
    </div>
  );
}
