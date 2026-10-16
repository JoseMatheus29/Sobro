import React, { useCallback, useEffect, useRef, useState } from 'react';
import { BackHandler, Pressable, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialIcons';

import { useColors } from '@/hooks/useColors';
import {
  TUTORIAL_BACK_LABEL,
  TUTORIAL_CARD_SIDE,
  TUTORIAL_CARET_SIZE,
  TUTORIAL_DIM_COLOR,
  TUTORIAL_FINISH_LABEL,
  TUTORIAL_NEXT_LABEL,
  TUTORIAL_SKIP_A11Y,
  TUTORIAL_SKIP_LABEL,
  TUTORIAL_STEP_LABEL,
  type TutorialStep,
} from '@/types/tutorial/tutorial-type';
import { layoutTutorial, type Rect, type Size } from '@/utils/tutorial';
import { getTutorialTarget } from '@/utils/tutorialTargets';

interface TutorialOverlayProps {
  steps: TutorialStep[];
  /** The step shown. */
  index: number;
  onNext: () => void;
  onBack: () => void;
  onSkip: () => void;
}

// The tutorial over the Home: everything dimmed but the thing the step is about, which gets a ring, and a card that
// says what it is for. It blocks every touch, so nobody opens a sheet by accident halfway; Android's back button goes
// to the previous step instead of leaving the app.
export default function TutorialOverlay({ steps, index, onNext, onBack, onSkip }: TutorialOverlayProps) {
  const colors = useColors();
  const rootRef = useRef<View>(null);
  const [screen, setScreen] = useState<Size | null>(null);
  const [target, setTarget] = useState<Rect | null>(null);

  const step = steps[index];
  const first = index === 0;
  const last = index === steps.length - 1;

  // The target and this layer are measured on the window, so the answer does not depend on who scrolls or who is
  // nested in whom.
  const measure = useCallback(() => {
    const node = step ? getTutorialTarget(step.target) : null;
    const root = rootRef.current;
    if (!node || !root) return;
    root.measureInWindow((rootX, rootY, rootWidth, rootHeight) => {
      node.measureInWindow((x, y, width, height) => {
        setScreen({ width: rootWidth, height: rootHeight });
        setTarget({ x: x - rootX, y: y - rootY, width, height });
      });
    });
  }, [step]);

  useEffect(() => {
    setTarget(null);
    const timer = setTimeout(measure, 50);
    return () => clearTimeout(timer);
  }, [measure, index]);

  useEffect(() => {
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      if (!first) onBack();
      // Handled either way: Back never leaves the app from here.
      return true;
    });
    return () => subscription.remove();
  }, [first, onBack]);

  const layout = screen && target ? layoutTutorial(target, screen) : null;
  const cardBackground = colors.scheme === 'dark' ? colors.surface.DEFAULT : colors.card;
  const cardBorder = colors.surface.dark;

  return (
    <View
      ref={rootRef}
      collapsable={false}
      onLayout={measure}
      accessibilityViewIsModal
      style={styles.root}
    >
      {layout ? (
        <>
          {layout.dim.map((area, i) => (
            <View
              key={i}
              style={{
                position: 'absolute',
                left: area.x,
                top: area.y,
                width: area.width,
                height: area.height,
                backgroundColor: TUTORIAL_DIM_COLOR,
              }}
            />
          ))}
          {/* The ring, and a barrier over the lit-up thing: it is shown, not pressed. */}
          <Pressable
            accessible={false}
            style={{
              position: 'absolute',
              left: layout.hole.x,
              top: layout.hole.y,
              width: layout.hole.width,
              height: layout.hole.height,
              borderRadius: layout.radius,
              borderWidth: 2,
              borderColor: colors.primary.DEFAULT,
            }}
          />

          <View
            style={[
              styles.card,
              {
                backgroundColor: cardBackground,
                borderColor: cardBorder,
                left: TUTORIAL_CARD_SIDE,
                right: TUTORIAL_CARD_SIDE,
              },
              layout.placement === 'above' ? { bottom: layout.cardAnchor } : { top: layout.cardAnchor },
            ]}
          >
            <View style={styles.headerRow}>
              <Text style={[styles.stepLabel, { color: colors.primary.DEFAULT }]}>
                {TUTORIAL_STEP_LABEL(index + 1, steps.length)}
              </Text>
              <View style={styles.dots} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
                {steps.map((item, i) => (
                  <View
                    key={item.id}
                    style={{
                      width: i === index ? 18 : 6,
                      height: 6,
                      borderRadius: 3,
                      backgroundColor: i === index ? colors.primary.DEFAULT : colors.placeholder,
                    }}
                  />
                ))}
              </View>
            </View>

            <Text accessibilityRole="header" style={[styles.title, { color: colors.ink }]}>
              {step.title}
            </Text>
            <Text style={[styles.text, { color: colors.muted }]}>{step.text}</Text>

            <View style={styles.buttons}>
              {last ? (
                <TouchableOpacity onPress={onBack} activeOpacity={0.7} style={styles.linkButton}>
                  <Icon name="chevron-left" size={20} color={colors.muted} />
                  <Text style={[styles.linkText, { color: colors.muted }]}>{TUTORIAL_BACK_LABEL}</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  onPress={onSkip}
                  activeOpacity={0.7}
                  accessibilityLabel={TUTORIAL_SKIP_A11Y}
                  style={styles.linkButton}
                >
                  <Text style={[styles.linkText, { color: colors.muted }]}>{TUTORIAL_SKIP_LABEL}</Text>
                </TouchableOpacity>
              )}

              {/* LinearGradient ignores borderRadius on Android: the wrapper does the clipping. */}
              <TouchableOpacity onPress={onNext} activeOpacity={0.85} style={styles.nextWrap}>
                <LinearGradient
                  colors={colors.buttonGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.nextButton}
                >
                  <Text style={styles.nextText}>{last ? TUTORIAL_FINISH_LABEL : TUTORIAL_NEXT_LABEL}</Text>
                  <Icon name={last ? 'check' : 'arrow-forward'} size={18} color="#FFFFFF" />
                </LinearGradient>
              </TouchableOpacity>
            </View>

            <View
              style={[
                styles.caret,
                { backgroundColor: cardBackground, borderColor: cardBorder, left: layout.caretLeft },
                layout.placement === 'above'
                  ? { bottom: -TUTORIAL_CARET_SIZE / 2 - 1, borderRightWidth: 1, borderBottomWidth: 1 }
                  : { top: -TUTORIAL_CARET_SIZE / 2 - 1, borderLeftWidth: 1, borderTopWidth: 1 },
              ]}
            />
          </View>
        </>
      ) : (
        // Until the target is measured everything is dimmed, so the Home does not flash between steps.
        <View style={[StyleSheet.absoluteFill, { backgroundColor: TUTORIAL_DIM_COLOR }]} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  // On top of everything, the tab bar and its elevation included.
  root: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 100, elevation: 100 },
  card: {
    position: 'absolute',
    padding: 20,
    borderRadius: 22,
    borderWidth: 1,
    elevation: 12,
    shadowColor: '#000000',
    shadowOpacity: 0.35,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
  },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  stepLabel: { fontSize: 11, fontWeight: '700', letterSpacing: 0.8 },
  dots: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  title: { marginTop: 10, fontSize: 20, lineHeight: 26, fontWeight: '700' },
  text: { marginTop: 8, fontSize: 14, lineHeight: 21 },
  buttons: { marginTop: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  linkButton: { height: 44, paddingHorizontal: 4, flexDirection: 'row', alignItems: 'center' },
  linkText: { fontSize: 14, fontWeight: '700' },
  nextWrap: { borderRadius: 14, overflow: 'hidden' },
  nextButton: { height: 44, paddingHorizontal: 22, flexDirection: 'row', alignItems: 'center', gap: 8 },
  nextText: { fontSize: 15, fontWeight: '700', color: '#FFFFFF' },
  caret: {
    position: 'absolute',
    width: TUTORIAL_CARET_SIZE,
    height: TUTORIAL_CARET_SIZE,
    transform: [{ rotate: '45deg' }],
  },
});
