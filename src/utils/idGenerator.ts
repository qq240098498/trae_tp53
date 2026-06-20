export type ClothingCode = string;
export type OrderNo = string;
export type MemberNo = string;
export type BatchNo = string;
export type PickupPointNo = string;

export interface IdGenerationOptions {
  date?: Date;
  sequence?: number;
}

const CLOTHING_CODE_PREFIX = 'CC';
const ORDER_NO_PREFIX = 'OD';
const MEMBER_NO_PREFIX = 'MB';
const BATCH_NO_PREFIX = 'BT';
const PICKUP_POINT_NO_PREFIX = 'PP';

function padNumber(num: number, length: number): string {
  return num.toString().padStart(length, '0');
}

function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = padNumber(date.getMonth() + 1, 2);
  const day = padNumber(date.getDate(), 2);
  return `${year}${month}${day}`;
}

function getCurrentSequence(): number {
  const key = 'id_sequence_counter';
  const stored = localStorage.getItem(key);
  const today = formatDate(new Date());
  let counter: { date: string; value: number };

  try {
    counter = stored ? JSON.parse(stored) : { date: today, value: 0 };
  } catch {
    counter = { date: today, value: 0 };
  }

  if (counter.date !== today) {
    counter = { date: today, value: 0 };
  }

  counter.value += 1;
  localStorage.setItem(key, JSON.stringify(counter));
  return counter.value;
}

export function generateClothingCode(options: IdGenerationOptions = {}): ClothingCode {
  const date = options.date ?? new Date();
  const sequence = options.sequence ?? getCurrentSequence();
  const dateStr = formatDate(date);
  const seqStr = padNumber(sequence % 10000, 4);
  return `${CLOTHING_CODE_PREFIX}${dateStr}${seqStr}`;
}

export function generateOrderNo(options: IdGenerationOptions = {}): OrderNo {
  const date = options.date ?? new Date();
  const sequence = options.sequence ?? getCurrentSequence();
  const dateStr = formatDate(date);
  const seqStr = padNumber(sequence % 1000000, 6);
  return `${ORDER_NO_PREFIX}${dateStr}${seqStr}`;
}

export function generateMemberNo(): MemberNo {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 10000);
  return `${MEMBER_NO_PREFIX}${timestamp}${padNumber(random, 4)}`;
}

export function parseClothingCode(code: ClothingCode): { date: Date; sequence: number } | null {
  const regex = /^CC(\d{4})(\d{2})(\d{2})(\d{4})$/;
  const match = code.match(regex);
  if (!match) return null;
  const [, year, month, day, seq] = match;
  return {
    date: new Date(Number(year), Number(month) - 1, Number(day)),
    sequence: Number(seq),
  };
}

export function parseOrderNo(orderNo: OrderNo): { date: Date; sequence: number } | null {
  const regex = /^OD(\d{4})(\d{2})(\d{2})(\d{6})$/;
  const match = orderNo.match(regex);
  if (!match) return null;
  const [, year, month, day, seq] = match;
  return {
    date: new Date(Number(year), Number(month) - 1, Number(day)),
    sequence: Number(seq),
  };
}

export function generateBatchNo(options: IdGenerationOptions = {}): BatchNo {
  const date = options.date ?? new Date();
  const sequence = options.sequence ?? getCurrentSequence();
  const dateStr = formatDate(date);
  const seqStr = padNumber(sequence % 10000, 4);
  return `${BATCH_NO_PREFIX}${dateStr}${seqStr}`;
}

export function generatePickupPointNo(): PickupPointNo {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 10000);
  return `${PICKUP_POINT_NO_PREFIX}${timestamp}${padNumber(random, 4)}`;
}

export function parseBatchNo(batchNo: BatchNo): { date: Date; sequence: number } | null {
  const regex = /^BT(\d{4})(\d{2})(\d{2})(\d{4})$/;
  const match = batchNo.match(regex);
  if (!match) return null;
  const [, year, month, day, seq] = match;
  return {
    date: new Date(Number(year), Number(month) - 1, Number(day)),
    sequence: Number(seq),
  };
}
