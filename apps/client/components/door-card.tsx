import { Lock, Unlock, Battery, Wifi, WifiOff } from "lucide-react-native";
import { HStack } from "./ui/hstack";
import { Text } from "./ui/text";
import { Button, ButtonText } from "./ui/button";
import { Stack } from "expo-router";
import { Box } from "./ui/box";
import { Icon } from "./ui/icon";

interface DoorCardProps {
  name: string;
  status: "locked" | "unlocked";
  batteryLevel: number;
  isOnline: boolean;
  lastActivity?: string;
  className?: string;
}

export function DoorCard({
  name,
  status,
  batteryLevel,
  isOnline,
  lastActivity,
  className,
}: DoorCardProps) {
  return (
    <Box
      className={`relative overflow-hidden rounded-xl border bg-white p-4 shadow-sm ${className}`}
    >
      <HStack className="flex items-center justify-between">
        <Text className="text-lg font-medium">{name}</Text>
        <HStack className="flex items-center space-x-2">
          <Box className="mr-1">
            {isOnline ? (
              <Icon className="h-4 w-4 text-green-500" as={Wifi}></Icon>
            ) : (
              <Icon className="h-4 w-4 text-gray-400" as={WifiOff}></Icon>
            )}
          </Box>

          <HStack className="flex items-center">
            <Icon className="h-4 w-4 text-gray-500" as={Battery}></Icon>
            <Text className="ml-1 text-xs text-gray-500">{batteryLevel}%</Text>
          </HStack>
        </HStack>
      </HStack>

      <HStack className="mt-4 flex items-center justify-between">
        <HStack className="flex items-center">
          {status === "locked" ? (
            <Icon className="h-8 w-8 text-primary" as={Lock}></Icon>
          ) : (
            <Icon className="h-8 w-8 text-green-500" as={Unlock}></Icon>
          )}
          <Text className="ml-2 text-lg font-medium">
            {status === "locked" ? "已锁定" : "已解锁"}
          </Text>
        </HStack>

        <Button
          className={`rounded-full px-4 py-2 text-white ${
            status === "locked"
              ? "bg-primary hover:bg-red-600"
              : "bg-gray-400 hover:bg-gray-500"
          }`}
        >
          <ButtonText>{status === "locked" ? "解锁" : "锁定"}</ButtonText>
        </Button>
      </HStack>

      {lastActivity && (
        <Text className="mt-3 text-xs text-gray-500">
          上次活动: {lastActivity}
        </Text>
      )}
    </Box>
  );
}
