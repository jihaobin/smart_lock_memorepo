import React from 'react';

import { Button, ButtonText } from '@/components/ui/button';
import { HStack } from '@/components/ui/hstack';

interface ModalFooterProps {
  cancelText?: string;
  confirmText?: string;
  onCancel: () => void;
  onConfirm: () => void;
  isLoading?: boolean;
  isDanger?: boolean;
  isConfirmDisabled?: boolean;
}

export function ModalFooter({
  cancelText = '取消',
  confirmText = '确定',
  onCancel,
  onConfirm,
  isLoading = false,
  isDanger = false,
  isConfirmDisabled = false,
}: ModalFooterProps) {
  return (
    <HStack className="justify-end gap-2">
      <Button variant="outline" onPress={onCancel} isDisabled={isLoading}>
        <ButtonText>{cancelText}</ButtonText>
      </Button>
      <Button
        variant={isDanger ? 'destructive' : 'default'}
        onPress={onConfirm}
        isLoading={isLoading}
        isDisabled={isConfirmDisabled || isLoading}
      >
        <ButtonText className="text-white">{confirmText}</ButtonText>
      </Button>
    </HStack>
  );
}
