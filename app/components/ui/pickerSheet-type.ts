export interface PickerOption {
  id: string | number;
  name: string;
  /** Second line under the name, e.g. the last digits of a card. */
  sub?: string;
  icon: string;
  /** Icon color; the square behind it is the same color, softened. */
  color: string;
}

export interface PickerSheetProps {
  visible: boolean;
  title: string;
  options: PickerOption[];
  selectedId: string | number | null;
  onSelect: (id: string | number) => void;
  onClose: () => void;
}

export const PICKER_CLOSE_LABEL = 'Fechar';
export const PICKER_MAX_HEIGHT = '70%';
