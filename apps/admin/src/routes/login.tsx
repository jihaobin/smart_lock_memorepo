import { zodResolver } from '@hookform/resolvers/zod';
import { IconLock } from '@tabler/icons-react';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { Loader2, User2 } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuthApi } from '@/hooks/useAuth';

// 定义登录表单验证模式
const loginSchema = z.object({
  name: z.string().min(1,"用户名不能为空"),
  password: z.string().min(6, '密码至少需要6个字符'),
  rememberMe: z.boolean().default(false)
});

// 推导表单数据类型
type LoginFormValues = z.infer<typeof loginSchema>;

export const Route = createFileRoute('/login')({
  component: LoginPage,
});

function LoginPage() {
  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      name: '',
      password: '',
      rememberMe: false
    }
  });
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuthApi();
  const onSubmit = async (data: LoginFormValues) => {
    setIsLoading(true);

    try{
      const res = await login({
        phone: data.name,
        password: data.password,
        rememberMe: data.rememberMe,
      });
      toast.success("登录成功",{description: `欢迎回来，${res.user.name}！`})
      navigate({to: "/"});
    } catch (error) {
      console.error('error', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-gradient-to-br from-background to-muted p-4">
      <Card className="w-full max-w-md overflow-hidden rounded-xl border-0 shadow-xl">
        <div className="bg-primary p-6 text-center">
          <h1 className="text-3xl font-bold text-primary-foreground">智能锁管理系统</h1>
        </div>

        <div className="p-8">
          <div className="mb-6 text-center">
            <h2 className="text-xl font-semibold">管理员登录</h2>
            <p className="text-muted-foreground">请输入您的凭据以登录系统</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email">邮箱</Label>
              <div className="relative">
                <div className="h-9 flex items-center absolute left-3 text-muted-foreground pointer-events-none">
                  <User2 className="size-4" />
                </div>
                <Input
                  id="email"
                  type="text"
                  className="pl-10"
                  placeholder="请输入用户名"
                  {...register('name')}
                />
                {errors.name && (
                  <p className="mt-1 text-sm text-red-500">{errors.name.message}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">密码</Label>
              <div className="relative">
                <div className="h-9 flex items-center absolute left-3 text-muted-foreground pointer-events-none">
                  <IconLock className="size-4" />
                </div>
                <Input
                  id="password"
                  type="password"
                  className="pl-10"
                  placeholder="请输入密码"
                  {...register('password')}
                />
                {errors.password && (
                  <p className="mt-1 text-sm text-red-500">{errors.password.message}</p>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="remember"
                  {...register('rememberMe')}
                />
                <label
                  htmlFor="remember"
                  className="text-sm cursor-pointer text-muted-foreground"
                >
                  记住我
                </label>
              </div>
              <a href="#" className="text-sm text-primary hover:underline">
                忘记密码?
              </a>
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? <Loader2 className='animate-spin'/> : '登录'}
            </Button>
          </form>
        </div>
      </Card>
    </div>
  );
}
