import { X } from 'lucide-react-native';
import React, { ReactNode } from 'react';

import { Box } from '@/components/ui/box';
import { Icon } from '@/components/ui/icon';
import {
  Modal,
  ModalBackdrop,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
} from '@/components/ui/modal';
import { Text } from '@/components/ui/text';

export interface ModalBaseProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
  maxWidth?: string;
  showCloseButton?: boolean;
}

export function ModalBase({
  isOpen,
  onClose,
  title,
  children,
  footer,
  maxWidth = 'md',
  showCloseButton = true,
}: ModalBaseProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalBackdrop />
      <ModalContent className={`max-w-${maxWidth}`}>
        <ModalHeader>
          <Text className="text-lg font-bold">{title}</Text>
          {showCloseButton && (
            <ModalCloseButton>
              <Icon as={X} />
            </ModalCloseButton>
          )}
        </ModalHeader>
        <ModalBody>
          <Box className="py-2">{children}</Box>
        </ModalBody>
        {footer && <ModalFooter>{footer}</ModalFooter>}
      </ModalContent>
    </Modal>
  );
}
