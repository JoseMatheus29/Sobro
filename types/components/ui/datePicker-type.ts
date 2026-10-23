export interface DatePickerProps {
  value: Date;
  /** The latest day that can be picked (the expenses are of today or before). */
  maximumDate?: Date;
  /** The chosen day, or null when the person gave up. The picker does not close itself: the caller stops drawing it. */
  onChange: (selected: Date | null) => void;
}

export const DATE_PICKER_TITLE = 'Escolher data';
export const DATE_PICKER_CANCEL_LABEL = 'Cancelar';
export const DATE_PICKER_CONFIRM_LABEL = 'Confirmar';
export const DATE_PICKER_INVALID_MESSAGE = 'Escolha um dia válido que não seja no futuro.';
