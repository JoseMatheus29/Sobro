import { type ReactNode } from 'react';

// On the phone the app is the whole screen: nothing to add. `WebFrame.web.tsx` is the browser's version.
export default function WebFrame({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
