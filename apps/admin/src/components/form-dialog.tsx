import React from 'react';
import { useForm, UseFormReturn, DefaultValues } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import { Button } from './ui/button';
import { Form } from './ui/form';
import { Loader2 } from 'lucide-react';

// FormDialog 组件的 Props 接口
export interface FormDialogProps<TSchema extends z.ZodType = z.ZodType> {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  schema: TSchema;
  defaultValues?: DefaultValues<z.infer<TSchema>>;
  children: (form: UseFormReturn<z.infer<TSchema>>) => React.ReactNode;
  onSubmit: (data: z.infer<TSchema>) => Promise<void>;
  loading?: boolean;
  submitText?: string;
  cancelText?: string;
  maxWidth?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  validate?: (data: z.infer<TSchema>) => void;
}

// 通用表单对话框组件
export const FormDialog = <TSchema extends z.ZodType>({
  open,
  onClose,
  title,
  description,
  schema,
  defaultValues,
  children,
  onSubmit,
  loading = false,
  submitText = '确定',
  cancelText = '取消',
  maxWidth = 'md',
  validate,
}: FormDialogProps<TSchema>) => {
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const form = useForm<z.infer<TSchema>>({
    resolver: zodResolver(schema),
    defaultValues,
  });

  const handleSubmit = async (data: z.infer<TSchema>) => {
    if (isSubmitting || loading) return;

    try {
      setIsSubmitting(true);

      // 执行自定义验证（如果提供）
      if (validate) {
        validate(data);
      }

      await onSubmit(data);
      onClose();
      form.reset(); // 重置表单
    } catch (error) {
      console.error('表单提交失败:', error);
      // 这里可以添加错误提示逻辑
    } finally {
      setIsSubmitting(false);
    }
  };

  const getMaxWidthClass = () => {
    const widthMap = {
      xs: 'max-w-xs',
      sm: 'max-w-sm',
      md: 'max-w-md',
      lg: 'max-w-lg',
      xl: 'max-w-xl',
    };
    return widthMap[maxWidth];
  };

  // 当对话框关闭时重置表单
  React.useEffect(() => {
    if (!open) {
      form.reset();
    }
  }, [open, form]);

  // 当defaultValues变化时更新表单
  React.useEffect(() => {
    if (open && defaultValues) {
      form.reset(defaultValues);
    }
  }, [open, defaultValues, form]);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className={`${getMaxWidthClass()} max-h-[90vh] overflow-y-auto`}>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <div className="py-4">{children(form)}</div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={isSubmitting || loading}
              >
                {cancelText}
              </Button>
              <Button type="submit" disabled={isSubmitting || loading}>
                {(isSubmitting || loading) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {submitText}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

/**
 * 表单对话框钩子
 *
 * 提供表单对话框的状态管理逻辑
 *
 * @example
 * ```tsx
 * const { isOpen, open, close, loading, setLoading } = useFormDialog();
 *
 * const handleSubmit = async () => {
 *   setLoading(true);
 *   try {
 *     await submitData();
 *     close();
 *   } finally {
 *     setLoading(false);
 *   }
 * };
 * ```
 */
export function useFormDialog() {
  const [isOpen, setIsOpen] = React.useState(false);
  const [loading, setLoading] = React.useState(false);

  const open = React.useCallback(() => setIsOpen(true), []);
  const close = React.useCallback(() => {
    if (!loading) {
      setIsOpen(false);
    }
  }, [loading]);

  return {
    isOpen,
    open,
    close,
    loading,
    setLoading,
  };
}
