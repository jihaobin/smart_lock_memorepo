export interface Group {
  id: string
  name: string
  type: "user" | "device"
}

export interface AuthorizedUser {
  id: string
  name: string
  avatar?: string
  email: string
  phone: string
  group?: string
  permissions: {
    doorId: string
    type: "temporary" | "permanent"
    validUntil?: string
  }[]
  lastAccess?: string
}

export interface DeviceGroup {
  id: string
  name: string
  devices: {
    id: string
    name: string
    status: "locked" | "unlocked"
    batteryLevel: number
    isOnline: boolean
  }[]
}

