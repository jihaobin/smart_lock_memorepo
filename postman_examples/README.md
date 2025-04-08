# 智能锁通知API示例

本目录包含智能锁系统通知模块的API规范和示例请求数据。

## 文件说明

- `notification_api.json` - OpenAPI 3.0格式的API规范
- `notification_examples.json` - 包含所有通知类型和重要级别组合的示例请求

## 在Postman中使用

### 导入API规范

1. 打开Postman
2. 点击"Import"按钮
3. 选择并上传`notification_api.json`文件
4. Postman将自动创建一个包含所有端点的集合

### 使用示例数据

1. 导入API规范后，找到"创建并发送通知"的POST请求
2. 打开`notification_examples.json`文件
3. 从"examples"数组中选择任意示例
4. 将示例数据复制到Postman请求的Body中
5. 设置必要的授权信息（JWT令牌）
6. 发送请求测试API

## 通知类型说明

API支持以下通知类型:

- `DOORBELL` - 门铃通知
- `DOOR_OPEN_ALERT` - 门开启警报
- `DEVICE_LOW_BATTERY` - 设备电量低
- `DEVICE_BROKEN` - 设备故障
- `DEVICE_OPEN` - 设备开启
- `DEVICE_CLOSE` - 设备关闭
- `DEVICE_OFFLINE` - 设备离线
- `DEVICE_ONLINE` - 设备上线
- `FIRMWARE_UPDATE` - 固件更新

## 重要级别说明

每种通知可以设置为以下重要级别:

- `LOW` - 低级别（仅应用内通知）
- `MEDIUM` - 中级别（应用内通知）
- `HIGH` - 高级别（短信通知）
- `CRITICAL` - 紧急级别（电话通知和多渠道发送）

## 示例集

示例文件中包含了每种通知类型与每种重要级别的组合，共36个示例。每个示例都包含适合该通知类型的相关数据。

## 开发环境测试

1. 确保API服务器已启动（默认地址：http://localhost:3000/api）
2. 获取有效的JWT令牌并设置到Postman的Authorization中
3. 根据需要修改示例数据中的userId、deviceId等字段
4. 发送请求并检查响应