export function formatShortDate(iso: string): string {
  const date = new Date(iso);
  const day = date.toLocaleDateString('pt-BR', { day: '2-digit' });
  const month = date.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '');
  const year = date.getFullYear();
  return `${day} ${month} ${year}`;
}
