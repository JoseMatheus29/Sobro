import { LinearGradient } from 'expo-linear-gradient';
import { cssInterop } from 'nativewind';

// NativeWind turns `className` into `style` only for the components it knows: the ones of React Native, and the
// ones registered here. `LinearGradient` is in none of them. It used to work by accident: the old build of
// `expo-linear-gradient` created its inner `View` with `React.createElement`, which the NativeWind Babel plugin
// rewrites, so the `className` reached a `View`. Since SDK 57 the library uses `react/jsx-runtime`, nothing
// rewrites it, and every gradient lost its padding, height and alignment (the buttons turned into thin bars and
// the headers lost their space). Registering it makes `className` a `style` before the component renders.
//
// Any other component from outside React Native that gets a `className` has to be registered here too.
cssInterop(LinearGradient, { className: 'style' });
