import type { LineItem } from "./types";

export function lineAmount(item: LineItem): number {
  const qty = Number(item.quantity) || 0;
  const price = Number(item.price) || 0;
  return Math.round(qty * price * 100) / 100;
}

export function totalAmount(items: LineItem[]): number {
  return Math.round(items.reduce((sum, item) => sum + lineAmount(item), 0) * 100) / 100;
}

const DIGITS = ["零", "壹", "贰", "叁", "肆", "伍", "陆", "柒", "捌", "玖"];
const UNITS_INT = ["", "拾", "佰", "仟"];
const UNITS_BIG = ["", "万", "亿", "万亿"];

export function amountInChinese(amount: number): string {
  if (!isFinite(amount)) return "零元整";
  const fixed = amount.toFixed(2);
  const [intPart, decPart] = fixed.split(".");
  if (intPart === "0" && decPart === "00") return "零元整";

  let result = "";
  const intNum = intPart.replace(/^0+/, "") || "0";
  if (intNum !== "0") {
    const groups: string[] = [];
    let n = intNum;
    while (n.length > 0) {
      groups.unshift(n.slice(-4));
      n = n.slice(0, -4);
    }
    for (let g = 0; g < groups.length; g += 1) {
      const group = groups[g];
      let groupStr = "";
      let zeroFlag = false;
      for (let i = 0; i < group.length; i += 1) {
        const digit = Number(group[i]);
        const unitPos = group.length - 1 - i;
        if (digit === 0) {
          zeroFlag = true;
        } else {
          if (zeroFlag) { groupStr += "零"; zeroFlag = false; }
          groupStr += DIGITS[digit] + UNITS_INT[unitPos];
        }
      }
      if (groupStr) result += groupStr + UNITS_BIG[groups.length - 1 - g];
    }
    result += "元";
  }

  const jiao = Number(decPart[0]);
  const fen = Number(decPart[1]);
  if (jiao === 0 && fen === 0) {
    result += "整";
  } else {
    if (jiao > 0) result += DIGITS[jiao] + "角";
    else if (intNum !== "0") result += "零";
    if (fen > 0) result += DIGITS[fen] + "分";
  }
  return result;
}
