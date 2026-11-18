import type { DeliveryNote } from "./types";

const KEY = "delivery-notes.v1";

export function loadNotes(): DeliveryNote[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as DeliveryNote[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveNotes(notes: DeliveryNote[]): void {
  localStorage.setItem(KEY, JSON.stringify(notes));
}

export function upsertNote(note: DeliveryNote): DeliveryNote[] {
  const notes = loadNotes();
  const idx = notes.findIndex((n) => n.id === note.id);
  const next = { ...note, updatedAt: new Date().toISOString() };
  if (idx >= 0) notes[idx] = next;
  else notes.unshift(next);
  saveNotes(notes);
  return notes;
}

export function deleteNote(id: string): DeliveryNote[] {
  const notes = loadNotes().filter((n) => n.id !== id);
  saveNotes(notes);
  return notes;
}

export function getNote(id: string): DeliveryNote | undefined {
  return loadNotes().find((n) => n.id === id);
}
