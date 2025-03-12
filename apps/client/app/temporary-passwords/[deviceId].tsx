import { useLocalSearchParams } from "expo-router";
import TemporaryPasswordsScreen from "./index";

export default function DeviceTemporaryPasswords() {
  const { deviceId } = useLocalSearchParams<{ deviceId: string }>();

  // 确保deviceId是字符串类型
  const deviceIdString = deviceId ? String(deviceId) : undefined;

  return <TemporaryPasswordsScreen deviceId={deviceIdString} />;
}
