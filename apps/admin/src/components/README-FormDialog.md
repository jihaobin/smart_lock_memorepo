# FormDialog 通用弹窗组件使用指南

## 概述

`FormDialog` 是一个基于 `react-hook-form` 和 `zod` 的通用弹窗表单组件，与 `ConfigurableDataTable` 深度集成，提供了一种类型安全且功能强大的方式来处理数据表格中的新增操作。

## 特性

- 🎯 **无缝集成**: 与 `ConfigurableDataTable` 完美配合
- 🔧 **高度可配置**: 支持自定义标题、描述、按钮文本等
- 📱 **响应式设计**: 支持多种尺寸配置
- ⚡ **异步支持**: 内置加载状态管理
- 🛡️ **类型安全**: 基于 `zod` 的完整类型推导和验证
- 🎨 **灵活布局**: 支持自定义表单内容
- ✅ **自动验证**: 集成 `react-hook-form` 和 `zod` 的验证功能
- 🎭 **标准化**: 使用 shadcn/ui 的 Form 组件体系

## 基本使用

### 1. 定义验证 Schema

首先，使用 `zod` 定义表单的验证规则：

```tsx
import { z } from 'zod';

const userFormSchema = z.object({
  name: z.string().min(1, '姓名不能为空').min(2, '姓名至少2个字符'),
  email: z.string().email('请输入有效的邮箱地址'),
  role: z.string().min(1, '角色不能为空'),
});

type UserFormData = z.infer<typeof userFormSchema>;
```

### 2. 创建表单组件

创建一个使用 shadcn Form 组件的表单：

```tsx
import React from 'react';
import { UseFormReturn } from 'react-hook-form';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '../ui/form';
import { Input } from '../ui/input';

const UserForm = (form: UseFormReturn<UserFormData>) => {
  return (
    <Form {...form}>
      <div className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>姓名</FormLabel>
              <FormControl>
                <Input placeholder="请输入姓名" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>邮箱</FormLabel>
              <FormControl>
                <Input type="email" placeholder="请输入邮箱" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="role"
          render={({ field }) => (
            <FormItem>
              <FormLabel>角色</FormLabel>
              <FormControl>
                <Input placeholder="请输入角色" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    </Form>
  );
};
```

### 3. 配置表格

在 `DataTableConfig` 中添加 `formDialog` 配置：

```tsx
const config = createDataTableConfig({
  title: '用户管理',
  description: '管理系统用户',
  searchPlaceholder: '搜索用户...',
  addButtonText: '添加用户',
  formDialog: {
    title: '添加新用户',
    description: '请填写用户信息',
    schema: userFormSchema,
    defaultValues: {
      name: '',
      email: '',
      role: '',
    },
    component: UserForm,
    onSubmit: async (data: UserFormData) => {
      // 处理表单提交逻辑
      console.log('提交的数据:', data);
      // 这里的 data 已经通过 zod 验证，类型安全
      await saveUser(data);
    },
    submitText: '保存',
    cancelText: '取消',
    maxWidth: 'md',
  },
});
```

### 4. 处理表单提交

表单提交逻辑现在更加简洁和类型安全：

```tsx
const handleSubmit = async (data: UserFormData) => {
  try {
    // data 已经通过 zod 验证，无需手动验证
    console.log('提交的数据:', data);

    // 模拟 API 调用
    await new Promise(resolve => setTimeout(resolve, 1000));

    // 添加新用户
    const newUser: User = {
      id: Date.now().toString(),
      ...data,
    };

    setUsers(prev => [...prev, newUser]);

    // FormDialog 会自动关闭并重置表单
  } catch (error) {
    console.error('提交失败:', error);
    // 错误会自动显示，FormDialog 保持打开状态
  }
};
```

## API 参考

### FormDialog 配置选项

| 属性            | 类型                                       | 必需 | 默认值   | 描述           |
| --------------- | ------------------------------------------ | ---- | -------- | -------------- |
| `title`         | `string`                                   | ✅   | -        | 对话框标题     |
| `description`   | `string`                                   | ❌   | -        | 对话框描述     |
| `schema`        | `z.ZodType`                                | ✅   | -        | Zod 验证模式   |
| `defaultValues` | `Record<string, any>`                      | ❌   | `{}`     | 表单默认值     |
| `component`     | `(form: UseFormReturn) => React.ReactNode` | ✅   | -        | 表单渲染函数   |
| `onSubmit`      | `(data: any) => Promise<void>`             | ✅   | -        | 提交处理函数   |
| `submitText`    | `string`                                   | ❌   | `'确定'` | 提交按钮文本   |
| `cancelText`    | `string`                                   | ❌   | `'取消'` | 取消按钮文本   |
| `maxWidth`      | `'xs' \| 'sm' \| 'md' \| 'lg' \| 'xl'`     | ❌   | `'md'`   | 对话框最大宽度 |
| `validate`      | `(data: any) => void`                      | ❌   | -        | 额外的验证函数 |

### useFormDialog Hook

如果你需要在其他地方使用表单对话框，可以直接使用 `useFormDialog` Hook：

```tsx
import { useFormDialog, FormDialog } from './form-dialog';

const MyComponent = () => {
  const { isOpen, open, close, loading, setLoading } = useFormDialog();

  return (
    <>
      <Button onClick={open}>打开对话框</Button>

      <FormDialog
        open={isOpen}
        onClose={close}
        title="我的对话框"
        onSubmit={handleSubmit}
        loading={loading}
      >
        <MyForm />
      </FormDialog>
    </>
  );
};
```

## 高级用法

### 复杂表单验证

使用 zod 可以创建复杂的验证规则：

```tsx
const complexSchema = z
  .object({
    name: z.string().min(2, '姓名至少2个字符').max(50, '姓名不能超过50个字符'),
    email: z
      .string()
      .email('请输入有效的邮箱地址')
      .refine(async email => {
        // 异步验证邮箱是否已存在
        const exists = await checkEmailExists(email);
        return !exists;
      }, '邮箱已存在'),
    password: z
      .string()
      .min(8, '密码至少8位')
      .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, '密码必须包含大小写字母和数字'),
    confirmPassword: z.string(),
  })
  .refine(data => data.password === data.confirmPassword, {
    message: '两次密码输入不一致',
    path: ['confirmPassword'],
  });
```

### 动态表单内容

```tsx
const DynamicForm = (form: UseFormReturn<FormData>) => {
  const watchedType = form.watch('type');

  return (
    <Form {...form}>
      <div className="space-y-4">
        <FormField
          control={form.control}
          name="type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>类型</FormLabel>
              <FormControl>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <SelectTrigger>
                    <SelectValue placeholder="选择类型" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="personal">个人</SelectItem>
                    <SelectItem value="business">企业</SelectItem>
                  </SelectContent>
                </Select>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* 根据类型显示不同字段 */}
        {watchedType === 'business' && (
          <FormField
            control={form.control}
            name="companyName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>公司名称</FormLabel>
                <FormControl>
                  <Input placeholder="请输入公司名称" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}
      </div>
    </Form>
  );
};
```

### 复杂表单状态管理

利用 react-hook-form 的强大功能：

```tsx
const ComplexForm = (form: UseFormReturn<FormData>) => {
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'items',
  });

  return (
    <Form {...form}>
      <div className="space-y-4">
        {fields.map((field, index) => (
          <div key={field.id} className="flex gap-2">
            <FormField
              control={form.control}
              name={`items.${index}.name`}
              render={({ field }) => (
                <FormItem className="flex-1">
                  <FormControl>
                    <Input placeholder="项目名称" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="button" variant="outline" onClick={() => remove(index)}>
              删除
            </Button>
          </div>
        ))}

        <Button type="button" variant="outline" onClick={() => append({ name: '' })}>
          添加项目
        </Button>
      </div>
    </Form>
  );
};
```

## 注意事项

1. **Schema 设计**: 使用 zod 定义完整的验证规则，包括类型、长度、格式等约束
2. **表单组件**: 表单组件接收 `UseFormReturn` 实例，使用 `FormField` 构建字段
3. **类型安全**: 利用 `z.infer<typeof schema>` 获得完整的类型推导
4. **错误处理**: 验证错误会自动显示，提交错误会保持对话框打开状态
5. **加载状态**: 提交期间会自动显示加载状态，无需手动管理
6. **自动重置**: 成功提交后表单会自动重置并关闭对话框
7. **异步验证**: zod 支持异步验证，可以进行服务器端验证
8. **依赖管理**: 确保项目已安装 `react-hook-form`、`@hookform/resolvers` 和 `zod`

## 完整示例

查看 `src/examples/form-dialog-example.tsx` 文件获取完整的使用示例。
