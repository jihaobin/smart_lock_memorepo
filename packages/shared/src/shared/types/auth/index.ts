import { z } from 'zod/v4';

import { IUser } from '../user';

// 参数校验
export const RegisterSchema = z
  .object({
    nikeName: z.string().min(1, '昵称不能为空'),
    phone: z
      .string()
      .min(11, '手机号码必须是11位数字')
      .max(11, '手机号码必须是11位数字')
      .regex(/^1[3-9]\d{9}$/, '请输入有效的手机号码'),
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
  phone: z
    .string()
    .min(11, '手机号码必须是11位数字')
    .max(11, '手机号码必须是11位数字')
    .regex(/^1[3-9]\d{9}$/, '请输入有效的手机号码'),
  password: z.string().min(6, '密码至少6位字符'),
  rememberMe: z.boolean().optional(),
});

export const ForgotPasswordSchema = z.object({
  phone: z
    .string()
    .min(11, '手机号码必须是11位数字')
    .max(11, '手机号码必须是11位数字')
    .regex(/^1[3-9]\d{9}$/, '请输入有效的手机号码'),
  verificationCode: z
    .string()
    .min(4, '验证码至少需要4位')
    .max(6, '验证码最多6位')
    .regex(/^\d+$/, '验证码只能包含数字'),
});

export const ResetPasswordSchema = z
  .object({
    password: z
      .string()
      .min(8, '密码至少需要8个字符')
      .regex(/[A-Z]/, '密码需要包含至少一个大写字母')
      .regex(/[a-z]/, '密码需要包含至少一个小写字母')
      .regex(/[0-9]/, '密码需要包含至少一个数字'),
    confirmPassword: z.string(),
    phone: z
      .string()
      .min(11, '手机号码必须是11位数字')
      .max(11, '手机号码必须是11位数字')
      .regex(/^1[3-9]\d{9}$/, '请输入有效的手机号码'),
  })
  .refine(data => data.password === data.confirmPassword, {
    message: '两次输入的密码不匹配',
    path: ['confirmPassword'],
  });

export const VerifyCodeSchema = z.object({
  phone: z
    .string()
    .min(11, '手机号码必须是11位数字')
    .max(11, '手机号码必须是11位数字')
    .regex(/^1[3-9]\d{9}$/, '请输入有效的手机号码'),
  biz: z.enum(['register', 'forgot_password', 'reset_password'], {
    message: '业务类型错误',
  }),
});

// 输出
export interface IAuthResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number; // access_token 过期时间
  user: IUser;
}

export type RegisterSchemaType = z.infer<typeof RegisterSchema>;
export type LoginSchemaType = z.infer<typeof LoginSchema>;
export type ForgotPasswordSchemaType = z.infer<typeof ForgotPasswordSchema>;
export type ResetPasswordSchemaType = z.infer<typeof ResetPasswordSchema>;
export type VerifyCodeSchemaType = z.infer<typeof VerifyCodeSchema>;
