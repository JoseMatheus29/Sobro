import DateTimePicker from '@react-native-community/datetimepicker';

import { type DatePickerProps } from '@/types/components/ui/datePicker-type';

// The phone's own date picker (a dialog on Android, the system sheet on iOS). Draw it to open it and stop
// drawing it in `onChange`. `DatePicker.web.tsx` is the browser's version, which `DateTimePicker` does not have.
export default function DatePicker({ value, maximumDate, onChange }: DatePickerProps) {
  return (
    <DateTimePicker
      value={value}
      mode="date"
      display="default"
      maximumDate={maximumDate}
      onChange={(_event, selected) => onChange(selected ?? null)}
    />
  );
}
