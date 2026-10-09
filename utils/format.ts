// "R$ 1.234,50"
export function formatMoney(value: number): string {
  return `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

// "+8,4%" / "-3,0%" from a ratio (0.084 → "+8,4%"); `decimals` is how many places to keep.
export function formatSignedPercent(ratio: number, decimals = 1): string {
  const scale = 10 ** decimals;
  const percent = Math.round(ratio * 100 * scale) / scale;
  const digits = Math.abs(percent).toLocaleString('pt-BR', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
  return `${percent < 0 ? '-' : '+'}${digits}%`;
}

// "+R$ 4.850,00" / "-R$ 200,00"
export function formatSignedMoney(value: number): string {
  return `${value < 0 ? '-' : '+'}${formatMoney(Math.abs(value))}`;
}

export function formatShortDate(iso: string): string {
  const date = new Date(iso);
  const day = date.toLocaleDateString('pt-BR', { day: '2-digit' });
  const month = date.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '');
  const year = date.getFullYear();
  return `${day} ${month} ${year}`;
}

export function formatLongDate(iso: string): string {
  return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });
}

// "09 out", with the year only when it is not the current one.
export function formatDayMonth(iso: string): string {
  const date = new Date(iso);
  const day = date.toLocaleDateString('pt-BR', { day: '2-digit' });
  const month = date.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '');
  const year = date.getFullYear();
  return year === new Date().getFullYear() ? `${day} ${month}` : `${day} ${month} ${year}`;
}
