import { type ConfirmOptions, type ToastOptions } from '@/types/components/feedback/feedback-type';
import { type GoalEntryRecord, type GoalRecord, type MovementKind } from '@/utils/goals-type';

export interface GoalCardProps {
  goal: GoalRecord;
  onPress?: () => void;
}

export interface GoalFormModalProps {
  visible: boolean;
  /** The caixinha being edited; none to create one. */
  goal?: GoalRecord | null;
  onClose: () => void;
  /** Called with the id of the caixinha that was saved. */
  onSaved: (id: number) => void;
}

export interface MovementModalProps {
  visible: boolean;
  kind: MovementKind;
  goal: GoalRecord;
  onClose: () => void;
}

export interface MovementRowProps {
  entry: GoalEntryRecord;
  onDelete: () => void;
}

// What a caixinha can look like.
export const GOAL_COLORS = ['#3161B2', '#36A83A', '#9B59B6', '#E67E22', '#E74C3C', '#1ABC9C'];
export const GOAL_ICONS = ['savings', 'flight', 'home', 'directions-car', 'school', 'celebration', 'beach-access', 'smartphone'];

// Carteira section.
export const GOALS_TITLE = 'Caixinhas';
export const NEW_GOAL_LABEL = 'Nova';
export const GOALS_EMPTY_TITLE = 'Guarde dinheiro para um objetivo';
export const GOALS_EMPTY_TEXT =
  'Crie uma caixinha para uma viagem, uma reserva de emergência… O dinheiro continua nas suas contas: a caixinha só marca quanto dele está reservado.';
export const CREATE_GOAL_LABEL = 'Criar caixinha';
export const RESERVED_LABEL = 'Reservado';
export const FREE_LABEL = 'Livre nas contas';
export const OVER_RESERVED_HINT = 'Tem mais reservado do que dinheiro nas contas.';

// A caixinha card.
export const GOAL_PROGRESS = (saved: string, target: string) => `${saved} de ${target}`;
export const GOAL_REACHED = 'Meta atingida';
export const GOAL_MISSING = (amount: string) => `Faltam ${amount}`;
export const GOAL_SUGGESTION = (amount: string, month: string) => `Guarde ${amount} por mês até ${month}`;
export const GOAL_OVERDUE = (month: string, amount: string) => `O prazo de ${month} passou · faltam ${amount}`;
export const GOAL_DEADLINE = (month: string) => `Até ${month}`;

// The caixinha sheet.
export const GOAL_NOT_FOUND = 'Essa caixinha não existe mais.';
export const DEPOSIT_LABEL = 'Guardar';
export const WITHDRAW_LABEL = 'Retirar';
export const HISTORY_TITLE = 'Movimentações';
export const HISTORY_EMPTY = 'Nada guardado ainda. Toque em Guardar para reservar o primeiro valor.';
export const DEPOSIT_ENTRY_LABEL = 'Guardado';
export const WITHDRAW_ENTRY_LABEL = 'Retirado';
export const DELETE_ENTRY_LABEL = 'Apagar movimentação';
export const EDIT_GOAL_LABEL = 'Editar caixinha';
export const DELETE_GOAL_LABEL = 'Excluir caixinha';
export const SHEET_HINT = 'O dinheiro continua nas suas contas: guardar ou retirar só muda o quanto está reservado.';

export const DELETE_GOAL_CONFIRM = (name: string): ConfirmOptions => ({
  title: `Excluir a caixinha ${name}?`,
  message: 'O histórico dela será apagado. O dinheiro continua nas suas contas, só deixa de estar reservado.',
  confirmLabel: 'Excluir',
  destructive: true,
});
export const DELETE_ENTRY_CONFIRM: ConfirmOptions = {
  title: 'Apagar esta movimentação?',
  message: 'O valor da caixinha volta ao que era antes dela.',
  confirmLabel: 'Apagar',
  destructive: true,
};

// The caixinha form.
export const NEW_GOAL_TITLE = 'Nova caixinha';
export const EDIT_GOAL_TITLE = 'Editar caixinha';
export const GOAL_NAME_LABEL = 'Nome';
export const GOAL_NAME_PLACEHOLDER = 'Ex: Viagem, Reserva de emergência';
export const GOAL_TARGET_LABEL = 'Quanto quer juntar';
export const GOAL_TARGET_PLACEHOLDER = '0,00';
export const GOAL_DEADLINE_LABEL = 'Prazo (opcional)';
export const SET_DEADLINE_LABEL = 'Definir prazo';
export const REMOVE_DEADLINE_LABEL = 'Tirar o prazo';
export const EARLIER_MONTH_LABEL = 'Mês anterior';
export const LATER_MONTH_LABEL = 'Próximo mês';
export const GOAL_COLOR_LABEL = 'Cor';
export const GOAL_ICON_LABEL = 'Ícone';
export const CANCEL_LABEL = 'Cancelar';
export const SAVE_LABEL = 'Salvar';
export const SAVING_LABEL = 'Salvando...';

// Putting money in or taking it out.
export const DEPOSIT_TITLE = (name: string) => `Guardar em ${name}`;
export const WITHDRAW_TITLE = (name: string) => `Retirar de ${name}`;
export const MOVEMENT_AMOUNT_LABEL = 'Valor';
export const MOVEMENT_PLACEHOLDER = '0,00';
export const AVAILABLE_LABEL = (amount: string) => `Disponível na caixinha: ${amount}`;
export const DEPOSIT_SUBMIT = (amount: string) => (amount ? `Guardar R$ ${amount}` : 'Guardar');
export const WITHDRAW_SUBMIT = (amount: string) => (amount ? `Retirar R$ ${amount}` : 'Retirar');

// Shown inside the form: a toast would be hidden behind the dialog.
export const NAME_REQUIRED = 'Dê um nome à caixinha.';
export const TARGET_REQUIRED = 'Informe quanto quer juntar, um valor maior que zero.';
export const INVALID_AMOUNT = 'Informe um valor maior que zero.';
export const EXCEEDS = (saved: string) => `Só dá para retirar o que está na caixinha. Disponível: ${saved}.`;
export const GOAL_CREATED_TOAST = (name: string): ToastOptions => ({ type: 'success', title: 'Caixinha criada', message: name, icon: 'savings' });
export const GOAL_SAVED_TOAST: ToastOptions = { type: 'success', title: 'Caixinha atualizada', icon: 'savings' };
export const GOAL_DELETED_TOAST: ToastOptions = { type: 'success', title: 'Caixinha excluída', icon: 'delete-outline' };
export const DEPOSITED_TOAST = (amount: string, name: string): ToastOptions => ({
  type: 'success',
  title: 'Guardado',
  message: `R$ ${amount} em ${name}`,
  icon: 'savings',
});
export const WITHDREW_TOAST = (amount: string, name: string): ToastOptions => ({
  type: 'success',
  title: 'Retirado',
  message: `R$ ${amount} de ${name}`,
  icon: 'savings',
});
export const GOAL_REACHED_TOAST = (name: string): ToastOptions => ({
  type: 'success',
  title: 'Meta atingida!',
  message: `A caixinha ${name} chegou ao valor que você queria.`,
  icon: 'celebration',
});
export const ENTRY_DELETED_TOAST: ToastOptions = { type: 'success', title: 'Movimentação apagada', icon: 'delete-outline' };

export interface GoalsSectionProps {
  goals: GoalRecord[];
  /** The balance of every account, to tell how much of the money is not reserved. */
  accountBalances: number[];
  onNew: () => void;
  onOpen: (id: number) => void;
}

// Errors shown inside the dialogs of a caixinha.
export const GOAL_SAVE_FAILED = 'Não foi possível salvar a caixinha.';
export const MOVEMENT_FAILED = 'Não foi possível registrar o valor.';
export const GOAL_DELETE_FAILED_TITLE = 'Não foi possível excluir a caixinha';
export const ENTRY_DELETE_FAILED_TITLE = 'Não foi possível desfazer o valor';
