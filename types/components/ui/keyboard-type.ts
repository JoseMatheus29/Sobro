// How a screen with fields gets out of the keyboard's way. Android draws edge to edge (the screen goes under the
// status bar and the navigation bar), and then the window no longer shrinks when the keyboard opens, so the screen
// has to make room itself on Android too, as it already did on iOS.
export const KEYBOARD_AVOIDING_BEHAVIOR = 'padding' as const;
