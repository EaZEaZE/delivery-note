import type { DeliveryNote } from "./types";

export interface ValidationIssue {
  path: string;
  message: string;
}

function checkPhone(value: string, path: string, label: string): ValidationIssue[] {
  const trimmed = value.trim();
  if (!trimmed) return [];
  const digits = trimmed.replace(/\D/g, "");
  if (!/^[+()\d\s-]+$/.test(trimmed) || digits.length < 7 || digits.length > 15) {
    return [{ path, message: `${label}格式不正确（需 7–15 位数字，可含 +、空格、短横线）` }];
  }
  return [];
}

export function validateNote(note: DeliveryNote): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  if (!note.no.trim()) issues.push({ path: "no", message: "请填写单据编号" });
  if (!note.date) issues.push({ path: "date", message: "请选择送货日期" });
  if (!note.sender.name.trim()) issues.push({ path: "sender.name", message: "请填写发货方名称" });
  if (!note.receiver.name.trim()) issues.push({ path: "receiver.name", message: "请填写收货方名称" });
  issues.push(...checkPhone(note.sender.phone, "sender.phone", "发货方电话"));
  issues.push(...checkPhone(note.receiver.phone, "receiver.phone", "收货方电话"));

  if (!note.items.length) {
    issues.push({ path: "items", message: "至少需要一行商品" });
  }

  note.items.forEach((item, index) => {
    if (!item.name.trim()) issues.push({ path: `items.${index}.name`, message: `第 ${index + 1} 行缺少商品名称` });
    if (!Number.isFinite(item.quantity) || item.quantity <= 0) {
      issues.push({ path: `items.${index}.quantity`, message: `第 ${index + 1} 行数量需大于 0` });
    }
    if (!Number.isFinite(item.price) || item.price < 0) {
      issues.push({ path: `items.${index}.price`, message: `第 ${index + 1} 行单价不能为负` });
    }
  });

  return issues;
}

const PARTY_LABELS: Record<string, string> = {
  "sender.name": "发货方名称",
  "sender.contact": "发货方联系人",
  "sender.phone": "发货方电话",
  "sender.address": "发货方地址",
  "receiver.name": "收货方名称",
  "receiver.contact": "收货方联系人",
  "receiver.phone": "收货方电话",
  "receiver.address": "收货方地址",
};

export function missingAfterAi(note: DeliveryNote): string[] {
  const missing: string[] = [];
  for (const [path, label] of Object.entries(PARTY_LABELS)) {
    const [role, key] = path.split(".") as ["sender" | "receiver", "name" | "contact" | "phone" | "address"];
    if (!note[role][key].trim()) missing.push(label);
  }
  return missing;
}
