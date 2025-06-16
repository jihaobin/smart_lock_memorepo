import React, { useCallback, useRef, createContext, useContext } from 'react';
import Select, { components, MenuListProps, OptionProps, Props as SelectProps } from 'react-select';
import { Loader2 } from 'lucide-react';

interface Option {
  value: string;
  label: string;
}

interface InfiniteScrollContext {
  onLoadMore: () => void;
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
}

interface InfiniteSelectProps {
  options: Option[];
  value?: Option | null;
  onChange: (option: Option | null) => void;
  onLoadMore: () => void;
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  isLoading: boolean;
  placeholder?: string;
  isClearable?: boolean;
  className?: string;
  classNamePrefix?: string;
}

// 创建Context来传递无限滚动相关的属性
const InfiniteScrollContext = createContext<InfiniteScrollContext | null>(null);

// 自定义菜单列表组件，支持无限滚动
const MenuList = (props: MenuListProps<Option>) => {
  const infiniteContext = useContext(InfiniteScrollContext);
  const menuListRef = useRef<HTMLDivElement>(null);

  if (!infiniteContext) {
    return <components.MenuList {...props} />;
  }

  const { onLoadMore, hasNextPage, isFetchingNextPage } = infiniteContext;

  const handleScroll = useCallback(
    (event: React.UIEvent<HTMLDivElement>) => {
      const { target } = event;
      const element = target as HTMLDivElement;

      // 检查是否滚动到底部
      if (
        element.scrollHeight - element.scrollTop <= element.clientHeight + 10 &&
        hasNextPage &&
        !isFetchingNextPage
      ) {
        onLoadMore();
      }
    },
    [hasNextPage, isFetchingNextPage, onLoadMore]
  );

  return (
    <components.MenuList {...props}>
      <div
        ref={menuListRef}
        onScroll={handleScroll}
        style={{ maxHeight: '200px', overflowY: 'auto' }}
      >
        {props.children}
        {isFetchingNextPage && (
          <div className="flex items-center justify-center p-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="ml-2 text-sm text-gray-500">加载中...</span>
          </div>
        )}
      </div>
    </components.MenuList>
  );
};

// 自定义选项组件
const Option = (props: OptionProps<Option>) => {
  return (
    <components.Option {...props}>
      <div className="flex items-center">
        <span>{props.data.label}</span>
      </div>
    </components.Option>
  );
};

// 加载指示器组件
const LoadingIndicator = () => (
  <div className="flex items-center justify-center p-2">
    <Loader2 className="h-4 w-4 animate-spin" />
  </div>
);

export const InfiniteSelect: React.FC<InfiniteSelectProps> = ({
  options,
  value,
  onChange,
  onLoadMore,
  hasNextPage,
  isFetchingNextPage,
  isLoading,
  placeholder = '请选择...',
  isClearable = false,
  className = 'react-select-container',
  classNamePrefix = 'react-select',
}) => {
  // 分离标准Select属性和无限滚动属性
  const selectProps: SelectProps<Option, false> = {
    options,
    value,
    onChange,
    placeholder,
    isClearable,
    isLoading,
    className,
    classNamePrefix,
    components: {
      MenuList,
      Option,
      LoadingIndicator: isLoading ? LoadingIndicator : components.LoadingIndicator,
    },
    filterOption: (option, inputValue) => {
      // 简单的过滤逻辑
      return option.label.toLowerCase().includes(inputValue.toLowerCase());
    },
  };

  const infiniteScrollContextValue: InfiniteScrollContext = {
    onLoadMore,
    hasNextPage,
    isFetchingNextPage,
  };

  return (
    <InfiniteScrollContext.Provider value={infiniteScrollContextValue}>
      <Select<Option, false> {...selectProps} />
    </InfiniteScrollContext.Provider>
  );
};

export default InfiniteSelect;
