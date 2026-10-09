import { type TypeFilter } from '@/utils/search';

export const SEARCH_TITLE = 'Buscar transações';
export const SEARCH_PLACEHOLDER = 'Nome, categoria, descrição...';
export const CLEAR_LABEL = 'Limpar busca';

export const TYPE_OPTIONS: { value: TypeFilter; label: string }[] = [
  { value: 'all', label: 'Todas' },
  { value: 'expense', label: 'Saídas' },
  { value: 'income', label: 'Entradas' },
];
export const ALL_CATEGORIES_LABEL = 'Todas as categorias';

export const RESULTS_LABEL = (count: number) => (count === 1 ? '1 transação' : `${count} transações`);
export const TOTAL_LABEL = 'Total';
export const EMPTY_RESULTS_MESSAGE = 'Nenhuma transação encontrada para essa busca';
export const EMPTY_ALL_MESSAGE = 'Suas transações aparecem aqui';

// Rendering thousands of rows at once would make the sheet slow: only the most recent are listed.
export const MAX_RESULTS = 100;
export const LIMITED_NOTE = (max: number) => `Mostrando as ${max} mais recentes. Refine a busca para ver as outras.`;
export const SEARCH_DEBOUNCE_MS = 200;
