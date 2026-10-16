// The first-run tutorial: a few cards over the Home, each lighting up one thing.

// What a step can point at. The balance card and the floating button are on the Home; the tabs are in the bar.
export type TutorialTargetId = 'fab' | 'balance' | 'tab:wallet' | 'tab:myDetailing';

export interface TutorialStep {
  id: string;
  target: TutorialTargetId;
  title: string;
  text: string;
}

export const TUTORIAL_STEPS: TutorialStep[] = [
  {
    id: 'register',
    target: 'fab',
    title: 'Registre uma saída ou entrada',
    text: 'Toque no + para lançar um gasto ou um ganho. São três passos: valor, categoria e detalhes. Dá para repetir todo mês ou parcelar.',
  },
  {
    id: 'month',
    target: 'balance',
    title: 'Seu mês num relance',
    text: 'Aqui fica o saldo do mês e quanto do orçamento você já usou. Defina um teto no Perfil e acompanhe de perto.',
  },
  {
    id: 'wallet',
    target: 'tab:wallet',
    title: 'Contas, cartão e caixinhas',
    text: 'Na Carteira você cadastra suas contas e o cartão de crédito, acompanha a fatura e separa dinheiro em caixinhas para seus objetivos.',
  },
  {
    id: 'details',
    target: 'tab:myDetailing',
    title: 'Para onde vai o seu dinheiro',
    text: 'Em Detalhes, seus gastos aparecem por categoria e por forma de pagamento, com limites para você não estourar o mês.',
  },
];

// The tabs of the bar that a step can point at, by the id of the tab.
export const TAB_TUTORIAL_TARGETS: Record<string, TutorialTargetId> = {
  wallet: 'tab:wallet',
  myDetailing: 'tab:myDetailing',
};

export const TUTORIAL_STEP_LABEL = (position: number, total: number) => `PASSO ${position} DE ${total}`;
export const TUTORIAL_NEXT_LABEL = 'Próximo';
export const TUTORIAL_SKIP_LABEL = 'Pular';
export const TUTORIAL_SKIP_A11Y = 'Pular o tutorial';
export const TUTORIAL_BACK_LABEL = 'Voltar';
export const TUTORIAL_FINISH_LABEL = 'Começar';

// Perfil: a way to see it again.
export const REPLAY_TUTORIAL_TITLE = 'Tutorial';
export const REPLAY_TUTORIAL_TEXT = 'Veja de novo as dicas da tela inicial.';
export const REPLAY_TUTORIAL_LABEL = 'Rever tutorial';

// Whether it was seen is kept on the phone, one flag for each account (two people can share a phone).
export const TUTORIAL_STORAGE_PREFIX = 'sobro:tutorial:v1:';

// Looks and geometry. The dim is the same in the light and the dark theme, like the dim behind a sheet.
export const TUTORIAL_DIM_COLOR = 'rgba(8,11,15,0.8)';
export const TUTORIAL_HOLE_PADDING = 8;
export const TUTORIAL_HOLE_RADIUS = 26;
export const TUTORIAL_CARD_GAP = 18;
export const TUTORIAL_CARD_SIDE = 20;
export const TUTORIAL_CARET_SIZE = 16;
export const TUTORIAL_CARET_MARGIN = 16;
// Wait a moment before starting, so the Home has laid out and the things to light up are on screen.
export const TUTORIAL_START_DELAY_MS = 500;
