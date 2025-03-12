import React from "react";
import { ChevronLeft, QrCode, X } from "lucide-react-native";
import { Text } from "@/components/ui/text";
import { Button, ButtonText } from "@/components/ui/button";
import { Box } from "@/components/ui/box";
import { VStack } from "@/components/ui/vstack";
import { Icon } from "@/components/ui/icon";
import {
  Modal,
  ModalBackdrop,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
} from "@/components/ui/modal";

interface QRCodeModalProps {
  showQRCode: boolean;
  setShowQRCode: (show: boolean) => void;
}

export function QRCodeModal({
  showQRCode,
  setShowQRCode,
}: QRCodeModalProps) {
  return (
    <Modal isOpen={showQRCode} onClose={() => setShowQRCode(false)}>
      <ModalBackdrop />
      <ModalContent className="max-w-md">
        <ModalHeader>
          <Text className="text-lg font-bold">我的二维码</Text>
          <ModalCloseButton>
            <Icon as={X} />
          </ModalCloseButton>
        </ModalHeader>
        <ModalBody>
          <VStack className="items-center py-4">
            <Box className="bg-gray-100 p-4 rounded-lg mb-4">
              <Icon as={QrCode} className="w-48 h-48 text-gray-800" />
            </Box>
            <Text className="text-sm text-gray-500 text-center">
              扫描此二维码添加我为授权用户
            </Text>
          </VStack>
        </ModalBody>
        <ModalFooter>
          <Button
            variant="outline"
            onPress={() => setShowQRCode(false)}
            className="w-full"
          >
            <ButtonText>关闭</ButtonText>
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
