'use client';
import type { VariantProps } from '@gluestack-ui/nativewind-utils';
import { tva } from '@gluestack-ui/nativewind-utils/tva';
import React from 'react';

import { Text } from '../text';

const labelStyle = tva({
  base: 'text-typography-600 mb-1.5 text-sm font-medium web:select-none',
  variants: {
    size: {
      sm: 'text-xs',
      md: 'text-sm',
      lg: 'text-base',
    },
  },
  defaultVariants: {
    size: 'md',
  },
});

type ILabelProps = React.ComponentProps<typeof Text> &
  VariantProps<typeof labelStyle> & {
    htmlFor?: string;
  };

const Label = React.forwardRef<React.ElementRef<typeof Text>, ILabelProps>(
  ({ className, size, ...props }, ref) => {
    return (
      <Text
        className={labelStyle({
          size,
          class: className,
        })}
        ref={ref}
        {...props}
      />
    );
  }
);

Label.displayName = 'Label';

export { Label };
