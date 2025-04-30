export interface Device {
  hasCamera: boolean;
  id: string;
  name: string;
  ownerId: string;
  status: {
    batteryLevel: number;
    firmwareVersion: number;
  };
  type: string;
}
