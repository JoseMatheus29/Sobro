// https://docs.expo.dev/guides/using-eslint/
module.exports = {
  extends: 'expo',
  ignorePatterns: ['/dist/*'],
  rules: {
    // The dialogs and forms start from a clean state each time they open (an effect on `visible` that sets what the
    // fields show). It is legitimate here and the app does not use the React Compiler this rule is meant for;
    // turning each one into a keyed component would be a refactor of its own.
    'react-hooks/set-state-in-effect': 'off',
  },
};
