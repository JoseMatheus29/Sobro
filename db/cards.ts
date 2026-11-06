import { api } from '@/api/client';
import { isApiError } from '@/api/errors';
import { type ApiCard, type ApiCardCredit, type CardInput, type CardPatch, type CardUsage } from '@/api/types';

export interface CardRecord {
  id: number;
  name: string;
  number: string;
  color: string;
  lightColor: string;
  /** Current balance: the starting balance plus its transactions, worked out by the server. What was bought on credit waits in the invoice and does not count here. */
  balance: number;
  /** The credit card of the account; null when it has none. */
  credit: CardCredit | null;
}

export type CardCredit = ApiCardCredit;

function toRecord(card: ApiCard): CardRecord {
  return {
    id: card.id,
    name: card.name,
    number: card.number,
    color: card.color,
    lightColor: card.lightColor,
    balance: card.balance,
    credit: card.credit ?? null,
  };
}

export async function getCards(): Promise<CardRecord[]> {
  return (await api<ApiCard[]>('GET', '/v1/cards')).map(toRecord);
}

// Null when it does not exist (anymore), or is not the person's.
export async function getCardById(id: number): Promise<CardRecord | null> {
  try {
    return toRecord(await api<ApiCard>('GET', `/v1/cards/${id}`));
  } catch (error) {
    if (isApiError(error) && error.status === 404) return null;
    throw error;
  }
}

// `idempotencyKey` keeps a retry after a lost answer from making two accounts.
export async function createCard(input: CardInput, idempotencyKey?: string): Promise<number> {
  const created = await api<ApiCard>('POST', '/v1/cards', { body: input, idempotencyKey });
  return created.id;
}

export async function updateCard(id: number, patch: CardPatch): Promise<void> {
  await api('PATCH', `/v1/cards/${id}`, { body: patch });
}

// What deleting an account would take with it, to tell the person before it happens: its transactions (and the
// other leg of every transfer it took part in) and its recurrences.
export function getCardUsage(id: number): Promise<CardUsage> {
  return api<CardUsage>('GET', `/v1/cards/${id}/usage`);
}

// Takes the transactions and recurrences along; 409 `last_card` for the only account left.
export async function deleteCard(id: number): Promise<void> {
  await api('DELETE', `/v1/cards/${id}`);
}
