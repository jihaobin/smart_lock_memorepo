import { AlertTriangle, Check, Info, X } from 'lucide-react-native';
import React, { useEffect } from 'react';
import { StyleSheet, Animated } from 'react-native';

import { Box } from '@/components/ui/box';
import { HStack } from '@/components/ui/hstack';
import { Icon } from '@/components/ui/icon';
import { Pressable } from '@/components/ui/pressable';
import { Toast, ToastTitle, ToastDescription } from '@/components/ui/toast';
import { VStack } from '@/components/ui/vstack';
import { useToast } from '@/hooks/use-toast';

export function ToastProvider() {
  const { toasts, dismiss } = useToast();

  return (
    <Box style={styles.container}>
      {toasts.map(({ id, title, description, variant = 'default', open, duration = 3000 }) => {
        if (!open) return null;

        let actionIcon;
        let actionType: 'error' | 'warning' | 'success' | 'info' | 'muted';

        switch (variant) {
          case 'destructive':
            actionIcon = <AlertTriangle size={18} color="#ef4444" />;
            actionType = 'error';
            break;
          case 'warning':
            actionIcon = <AlertTriangle size={18} color="#f59e0b" />;
            actionType = 'warning';
            break;
          case 'success':
            actionIcon = <Check size={18} color="#22c55e" />;
            actionType = 'success';
            break;
          default:
            actionIcon = <Info size={18} color="#3b82f6" />;
            actionType = 'info';
        }

        return (
          <ToastWithAnimation
            key={id}
            id={id}
            title={title}
            description={description}
            actionIcon={actionIcon}
            actionType={actionType}
            dismiss={dismiss}
            duration={duration}
          />
        );
      })}
    </Box>
  );
}

interface ToastWithAnimationProps {
  id: string;
  title?: React.ReactNode;
  description?: React.ReactNode;
  actionIcon: React.ReactNode;
  actionType: 'error' | 'warning' | 'success' | 'info' | 'muted';
  dismiss: (id: string) => void;
  duration: number;
}

function ToastWithAnimation({
  id,
  title,
  description,
  actionIcon,
  actionType,
  dismiss,
  duration,
}: ToastWithAnimationProps) {
  // 创建动画值
  const fadeAnim = React.useRef(new Animated.Value(0)).current;
  const translateYAnim = React.useRef(new Animated.Value(-20)).current;

  useEffect(() => {
    // 入场动画
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(translateYAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();

    // 设置自动消失的定时器
    const timer = setTimeout(() => {
      // 出场动画
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(translateYAnim, {
          toValue: -20,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start(() => {
        dismiss(id);
      });
    }, duration);

    return () => clearTimeout(timer);
  }, [fadeAnim, translateYAnim, dismiss, id, duration]);

  return (
    <Animated.View
      style={[
        styles.animatedContainer,
        {
          opacity: fadeAnim,
          transform: [{ translateY: translateYAnim }],
        },
      ]}
    >
      <Toast nativeID={`toast-${id}`} action={actionType} variant="outline" style={styles.toast}>
        <VStack space="xs">
          <HStack space="sm">
            <HStack space="sm">
              <Box>{actionIcon}</Box>
              {title && <ToastTitle>{title}</ToastTitle>}
            </HStack>
            <Pressable onPress={() => dismiss(id)}>
              <Icon as={X} size="sm" />
            </Pressable>
          </HStack>
          {description && <ToastDescription>{description}</ToastDescription>}
        </VStack>
      </Toast>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 50,
    left: 16,
    right: 16,
    zIndex: 999,
  },
  animatedContainer: {
    marginBottom: 8,
  },
  toast: {
    borderRadius: 8,
    borderWidth: 1,
  },
});
