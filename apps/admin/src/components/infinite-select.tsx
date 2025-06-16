import React, { useEffect, useRef } from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2 } from 'lucide-react';

interface Option {
  value: string;
  label: string;
}

interface InfiniteSelectProps {
  options: Option[];
  onLoadMore: () => void;
  hasNextPage: boolean;
  isLoading: boolean;
  value?: string;
  onValueChange?: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

const InfiniteSelect: React.FC<InfiniteSelectProps> = ({
  options,
  onLoadMore,
  hasNextPage,
  isLoading,
  value,
  onValueChange,
  placeholder,
  disabled,
  className,
}) => {
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = (event: Event) => {
      const target = event.target as HTMLElement;
      if (!target) return;

      const { scrollTop, scrollHeight, clientHeight } = target;
      const isNearBottom = scrollTop + clientHeight >= scrollHeight - 10;

      if (isNearBottom && hasNextPage && !isLoading) {
        onLoadMore();
      }
    };

    // 查找 SelectContent 的滚动容器
    const findScrollContainer = () => {
      const selectContent = document.querySelector('[data-radix-select-content]');
      return selectContent?.querySelector('[data-radix-select-viewport]') as HTMLElement;
    };

    // 延迟查找滚动容器，因为 SelectContent 是通过 Portal 渲染的
    const timer = setTimeout(() => {
      const scrollContainer = findScrollContainer();
      if (scrollContainer) {
        scrollContainer.addEventListener('scroll', handleScroll);
      }
    }, 100);

    return () => {
      clearTimeout(timer);
      const scrollContainer = findScrollContainer();
      if (scrollContainer) {
        scrollContainer.removeEventListener('scroll', handleScroll);
      }
    };
  }, [hasNextPage, isLoading, onLoadMore]);

  return (
    <Select value={value} onValueChange={onValueChange} disabled={disabled}>
      <SelectTrigger className={className}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent ref={contentRef}>
        {options.map(option => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
        {isLoading && (
          <div className="flex items-center justify-center py-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="ml-2 text-sm text-muted-foreground">Loading...</span>
          </div>
        )}
      </SelectContent>
    </Select>
  );
};

export default InfiniteSelect;
export type { Option, InfiniteSelectProps };
