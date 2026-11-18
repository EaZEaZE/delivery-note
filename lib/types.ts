export interface Party {
  name: string;
  contact: string;
  address: string;
  phone: string;
}

export interface LineItem {
  id: string;
  name: string;
  spec: string;
  unit: string;
  quantity: number;
  price: number;
}

export interface DeliveryNote {
  id: string;
  no: string;
  date: string;
  sender: Party;
  receiver: Party;
  items: LineItem[];
  remark: string;
  createdAt: string;
  updatedAt: string;
}

export const emptyParty = (): Party => ({ name: "", contact: "", address: "", phone: "" });

export const emptyItem = (): LineItem => ({
  id: crypto.randomUUID(),
  name: "",
  spec: "",
  unit: "件",
  quantity: 0,
  price: 0,
});

export const emptyNote = (): DeliveryNote => {
  const now = new Date();
  const stamp = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}`;
  return {
    id: crypto.randomUUID(),
    no: `SH-${stamp}-${String(Date.now()).slice(-3)}`,
    date: now.toISOString().slice(0, 10),
    sender: emptyParty(),
    receiver: emptyParty(),
    items: [emptyItem()],
    remark: "",
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
  };
};
