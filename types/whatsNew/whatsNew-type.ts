// "O que há de novo": a notice with what changed, shown once to each account the next time it opens the Home.
//
// It is NOT tied to the app's version: an OTA update changes the code but not `version` in app.json, so the version
// cannot tell that something new arrived. Instead every release is an entry of `RELEASES` with its own `id`, and the
// phone remembers the last `id` an account has seen (db/whatsNew.ts).
//
// To announce something: add an entry at the TOP of `RELEASES` (newest first) with a new `id` (the date is fine) and
// publish. Whoever has not seen it gets it once; whoever skipped several sees all they missed, newest first. Keep one
// short line per item, in the language of the person, saying what they can do now, not what was changed in the code.
export interface ReleaseItem {
  /** A MaterialIcons name. */
  icon: string;
  title: string;
  text: string;
}

export interface Release {
  /** Never reused: it is what the phone remembers. */
  id: string;
  title: string;
  items: ReleaseItem[];
}

export const RELEASES: Release[] = [
  {
    id: '2026-11-06',
    title: 'Novidades de novembro',
    items: [
      {
        icon: 'account-balance-wallet',
        title: 'Saldo disponível',
        text: 'O saldo do Início agora é o dinheiro que você pode gastar hoje. Pagar uma fatura ou guardar na caixinha tira o valor dele.',
      },
      {
        icon: 'notifications-active',
        title: 'Lembrete da fatura',
        text: 'Avisamos na manhã anterior ao vencimento da fatura do cartão, com o valor que falta pagar. Funciona com os lembretes ligados no Perfil.',
      },
      {
        icon: 'warning-amber',
        title: 'Aviso de limite',
        text: 'Ao registrar um gasto, avisamos se ele levou o orçamento do mês ou o limite de uma categoria a 80% ou além.',
      },
      {
        icon: 'credit-card',
        title: 'Limite do cartão',
        text: 'Na tela da fatura você vê quanto ainda resta do limite do cartão.',
      },
    ],
  },
];

// The newest one.
export const LATEST_RELEASE_ID = RELEASES[0].id;

// How many of the past releases "Novidades" in the Perfil lists.
export const REVIEW_RELEASES = 3;

export const WHATS_NEW_STORAGE_PREFIX = 'sobro:whatsnew:v1:';
// After the Home is on screen, so the dialog does not come up over the first frame.
export const WHATS_NEW_DELAY_MS = 900;

export const WHATS_NEW_TITLE = 'O que há de novo';
export const WHATS_NEW_CLOSE_LABEL = 'Entendi';
export const WHATS_NEW_REVIEW_TITLE = 'Novidades';
export const WHATS_NEW_REVIEW_TEXT = 'Veja de novo o que mudou nas últimas atualizações do app.';
export const WHATS_NEW_REVIEW_LABEL = 'Ver novidades';
