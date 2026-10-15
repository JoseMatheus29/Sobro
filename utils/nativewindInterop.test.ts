import { LinearGradient } from 'expo-linear-gradient';

import './nativewindInterop';

// The registry NativeWind consults for every element. If this component is not in it, its `className` is
// silently dropped on a device (see utils/nativewindInterop.ts), and no type check or bundle would say so.
const { interopComponents } = jest.requireActual<{ interopComponents: Map<unknown, unknown> }>(
  'react-native-css-interop/dist/runtime/native/api'
);

describe('NativeWind interop', () => {
  it('knows the className of LinearGradient', () => {
    expect(interopComponents.has(LinearGradient)).toBe(true);
  });
});
