# Nest.js 统一响应与错误处理模块

本模块提供了一套完整的统一响应格式和错误处理机制，确保API返回的数据格式一致，并能够优雅地处理各种异常情况。

## 核心功能

- **统一API响应格式**：所有API响应都遵循相同的JSON结构
- **全局异常捕获与处理**：捕获所有未处理的异常并转换为统一的错误响应
- **请求超时处理**：自动处理长时间运行的请求
- **请求与响应日志记录**：记录所有请求和响应的详细信息
- **业务逻辑异常处理**：提供自定义业务异常类，用于抛出业务逻辑错误
- **数据库错误处理**：自动识别和处理常见的数据库错误

## 统一响应格式

所有API响应（包括成功和错误）都遵循以下格式：

```json
{
  "code": 0, // 状态码：0表示成功，其他值表示错误
  "message": "操作成功", // 消息描述
  "data": {}, // 响应数据，错误时可能包含错误详情
  "timestamp": 1629789600000, // 时间戳
  "path": "/api/users" // 请求路径（主要用于错误响应）
}
```

## 错误代码体系

错误代码按照不同类别进行分组：

- **1000-1999**：系统级错误（如内部错误、服务不可用等）
- **2000-2999**：HTTP错误（如请求错误、未授权、禁止访问等）
- **3000-3999**：数据库错误（如连接错误、约束违反等）
- **4000-4999**：验证错误（如无效参数、无效凭证等）
- **5000-5999**：业务逻辑错误（如资源不存在、操作失败等）
- **6000-6999**：外部服务错误（如API错误、集成错误等）

## 主要组件

### 1. 转换拦截器 (TransformInterceptor)

负责将控制器返回的数据转换为统一的API响应格式。

```typescript
// 使用示例
@UseInterceptors(TransformInterceptor)
@Get()
findAll() {
  return this.userService.findAll();
}
```

### 2. HTTP异常过滤器 (HttpExceptionFilter)

捕获所有未处理的异常，并将其转换为统一的错误响应格式。

```typescript
// 全局注册
app.useGlobalFilters(new HttpExceptionFilter());
```

### 3. 超时拦截器 (TimeoutInterceptor)

处理请求超时，确保长时间运行的请求不会无限期挂起。

```typescript
// 使用示例
@UseInterceptors(TimeoutInterceptor)
@Get('long-operation')
async longOperation() {
  // 长时间运行的操作
}
```

### 4. 应用异常类 (AppException)

用于抛出业务逻辑异常，可以指定错误代码、消息和详情。

```typescript
// 使用示例
if (!user) {
  throw new NotFoundException('用户不存在', ErrorCode.RESOURCE_NOT_FOUND);
}
```

### 5. 数据库异常处理 (DatabaseErrorUtil)

自动识别和处理常见的数据库错误，如唯一约束违反、外键约束违反等。

## 拦截器与异常过滤器的集成

拦截器和异常过滤器协同工作，确保所有响应（无论成功还是失败）都遵循相同的格式：

1. **成功路径**：控制器返回的数据 → TransformInterceptor → 统一响应格式
2. **错误路径**：异常 → HttpExceptionFilter → 统一错误响应格式

关键集成点：

- TransformInterceptor 处理成功响应，HttpExceptionFilter 处理错误响应
- 两者生成的响应格式完全一致，确保前端可以统一处理
- TimeoutInterceptor 抛出的异常会被 HttpExceptionFilter 捕获并处理
- 所有自定义异常类（如AppException）都会被 HttpExceptionFilter 正确处理

## 使用指南

### 全局注册

在 `main.ts` 中全局注册拦截器和异常过滤器：

```typescript
async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // 注册全局异常过滤器
  app.useGlobalFilters(app.get(HttpExceptionFilter));

  // 注册全局拦截器
  app.useGlobalInterceptors(
    app.get(TransformInterceptor),
    app.get(TimeoutInterceptor),
  );

  await app.listen(3000);
}
```

### 抛出业务异常

在服务或控制器中抛出业务异常：

```typescript
// 业务逻辑错误
if (user.balance < amount) {
  throw new BusinessException('余额不足', ErrorCode.INSUFFICIENT_BALANCE, {
    current: user.balance,
    required: amount,
  });
}

// 资源不存在
if (!product) {
  throw new NotFoundException('商品不存在', ErrorCode.RESOURCE_NOT_FOUND);
}

// 验证错误
if (!isValid(data)) {
  throw new ValidationException('数据验证失败', ErrorCode.VALIDATION_ERROR, {
    errors: validationErrors,
  });
}
```

### 自定义响应消息

在控制器方法中自定义成功响应消息：

```typescript
@Post()
create(@Body() createUserDto: CreateUserDto) {
  const user = this.userService.create(createUserDto);
  return {
    message: '用户创建成功',
    data: user
  };
}
```

## 最佳实践

1. **始终使用自定义异常类**：使用 AppException 的子类而不是直接抛出 Error
2. **提供有意义的错误消息**：错误消息应该清晰地描述问题
3. **包含相关的错误详情**：在 details 字段中提供额外的上下文信息
4. **使用正确的错误代码**：根据错误类型选择适当的错误代码
5. **记录关键错误**：对于严重错误，确保记录详细的日志
6. **保护敏感信息**：确保错误响应中不包含敏感信息

## 错误处理流程图

```
请求 →
  → 成功路径 → 控制器处理 → TransformInterceptor → 统一成功响应
  → 错误路径 → 异常发生 → HttpExceptionFilter → 统一错误响应
```
