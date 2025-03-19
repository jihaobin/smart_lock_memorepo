import { z } from 'zod';

export const RegisterSchema = z
  .object({
    nikeName: z.string().min(1, '昵称不能为空'),
    // phoneNumber: z
    //   .string()
    //   .min(11, '手机号码必须是11位数字')
    //   .max(11, '手机号码必须是11位数字')
    //   .regex(/^1[3-9]\d{9}$/, '请输入有效的手机号码'),
    email: z.string().email('请输入有效的电子邮箱').min(1, '邮箱不能为空'),
    verificationCode: z
      .string()
      .min(4, '验证码至少需要4位')
      .max(6, '验证码最多6位')
      .regex(/^\d+$/, '验证码只能包含数字'),
    password: z
      .string()
      .min(8, '密码至少需要8个字符')
      .regex(/[A-Z]/, '密码需要包含至少一个大写字母')
      .regex(/[a-z]/, '密码需要包含至少一个小写字母')
      .regex(/[0-9]/, '密码需要包含至少一个数字'),
    confirmPassword: z.string(),
    agreeTerms: z.boolean().refine(val => val === true, {
      message: '您必须同意服务条款和隐私政策',
    }),
  })
  .refine(data => data.password === data.confirmPassword, {
    message: '两次输入的密码不匹配',
    path: ['confirmPassword'],
  });

export const LoginSchema = z.object({
  email: z.string().email('请输入有效的电子邮箱').min(1, '邮箱不能为空'),
  password: z.string().min(6, '密码至少6位字符'),
  rememberMe: z.boolean().optional(),
});

export const ForgotPasswordSchema = z.object({
  email: z.string().email('请输入有效的电子邮箱').min(1, '邮箱不能为空'),
  verificationCode: z
    .string()
    .min(4, '验证码至少需要4位')
    .max(6, '验证码最多6位')
    .regex(/^\d+$/, '验证码只能包含数字'),
});

export const ResetPasswordSchema = z.object({
  password: z.string().min(8),
  confirmPassword: z.string().min(8),
});

export const VerifyCodeSchema = z.object({
  email: z.string().email('请输入有效的电子邮箱').min(1, '邮箱不能为空'),
});

export type RegisterSchemaType = z.infer<typeof RegisterSchema>;
export type LoginSchemaType = z.infer<typeof LoginSchema>;
export type ForgotPasswordSchemaType = z.infer<typeof ForgotPasswordSchema>;
export type ResetPasswordSchemaType = z.infer<typeof ResetPasswordSchema>;
export type VerifyCodeSchemaType = z.infer<typeof VerifyCodeSchema>;
