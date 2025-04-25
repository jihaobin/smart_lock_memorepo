'use client';

import {
  DndContext,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
  type UniqueIdentifier,
} from '@dnd-kit/core';
import { restrictToVerticalAxis } from '@dnd-kit/modifiers';
import {
  SortableContext,
  arrayMove,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  ColumnDef,
  ColumnFiltersState,
  PaginationState,
  Row,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type Updater,
  ColumnSizingState,
} from '@tanstack/react-table';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronsLeftIcon,
  ChevronsRightIcon,
  ColumnsIcon,
  GripVerticalIcon,
  PlusIcon,
  Loader2,
} from 'lucide-react';
import * as React from 'react';
// 导入motion库组件

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Table, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BaseDataType, DataTableConfig } from '@/types/data-table';

interface AccessorKeyColumn {
  accessorKey?: string;
}

// 定义可拖拽行组件
function DragHandle({ id }: { id: UniqueIdentifier }) {
  const { attributes, listeners } = useSortable({
    id,
  });

  return (
    <Button
      {...attributes}
      {...listeners}
      variant="ghost"
      size="icon"
      className="size-7 text-muted-foreground hover:bg-transparent cursor-move"
    >
      <GripVerticalIcon className="size-3 text-muted-foreground" />
      <span className="sr-only">Drag to reorder</span>
    </Button>
  );
}

// 定义可拖拽行组件
function DraggableRow<TData extends BaseDataType>({ row }: { row: Row<TData> }) {
  const { transform, transition, setNodeRef, isDragging } = useSortable({
    id: row.original.id,
  });

  return (
    <TableRow
      data-state={row.getIsSelected() && 'selected'}
      data-dragging={isDragging}
      ref={setNodeRef}
      className="relative z-0 data-[dragging=true]:z-10 data-[dragging=true]:opacity-80"
      style={{
        transform: CSS.Transform.toString(transform),
        transition: transition,
      }}
    >
      {row.getVisibleCells().map(cell => (
        <TableCell
          key={cell.id}
          style={{
            width: `var(--col-${cell.column.id}-size)px`,
          }}
        >
          {flexRender(cell.column.columnDef.cell, cell.getContext())}
        </TableCell>
      ))}
    </TableRow>
  );
}

// 记忆化的可拖拽行组件，用于提高列大小调整时的性能
const MemoizedDraggableRow = React.memo(
  DraggableRow as React.ComponentType<{ row: Row<BaseDataType> }>,
  (prev, next) => {
    // 在调整列大小时避免重新渲染
    return (
      prev.row.original.id === next.row.original.id &&
      prev.row.getIsSelected() === next.row.getIsSelected() &&
      prev.row.original === next.row.original
    );
  }
);

// 创建带动画的表格行组件
function AnimatedTableRow<TData extends BaseDataType>({ row }: { row: Row<TData> }) {
  return (
    <motion.tr
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.2 }}
      data-state={row.getIsSelected() && 'selected'}
      className="border-none transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted"
    >
      {row.getVisibleCells().map(cell => (
        <TableCell
          key={cell.id}
          style={{
            width: `var(--col-${cell.column.id}-size)px`,
          }}
        >
          {flexRender(cell.column.columnDef.cell, cell.getContext())}
        </TableCell>
      ))}
    </motion.tr>
  );
}

// 记忆化的动画表格行组件，用于提高列大小调整时的性能
const MemoizedAnimatedTableRow = React.memo(
  AnimatedTableRow as React.ComponentType<{ row: Row<BaseDataType> }>,
  (prev, next) => {
    // 在调整列大小时避免重新渲染
    return (
      prev.row.original.id === next.row.original.id &&
      prev.row.getIsSelected() === next.row.getIsSelected() &&
      prev.row.original === next.row.original
    );
  }
);
// 944493
// 列大小调整手柄组件
function ColumnResizeHandle({
  onMouseDown,
  onTouchStart,
  onDoubleClick,
}: {
  onMouseDown: (e: React.MouseEvent<HTMLDivElement>) => void;
  onTouchStart: (e: React.TouchEvent<HTMLDivElement>) => void;
  onDoubleClick: () => void;
}) {
  return (
    <div
      className="absolute top-0 h-full w-4 cursor-col-resize user-select-none touch-none -right-2 z-10 flex justify-center before:absolute before:w-px before:inset-y-0 before:bg-border before:translate-x-px"
      onMouseDown={onMouseDown}
      onTouchStart={onTouchStart}
      onDoubleClick={onDoubleClick}
      onClick={e => e.stopPropagation()}
    />
  );
}

// 可配置数据表格组件
export function ConfigurableDataTable<TData extends BaseDataType>({
  data,
  columns: userColumns,
  loading = false,
  renderLoading,
  enableDragSort = true,
  enablePagination = true,
  enableRowSelection = true,
  enableColumnVisibility = true,
  enableCustomizeColumns = true,
  enableAddButton = true,
  enableColumnResizing = true,
  defaultColumn = {
    minSize: 40,
    maxSize: 500,
    size: 150,
  },
  addButtonText = '添加',
  columnVisibilityText = '列可见性',
  onAddButtonClick,
  onDragSortEnd,
  serverSidePagination = true, // 默认使用服务端分页
  tabs,
  pagination = {
    defaultPageSize: 10,
    pageSizeOptions: [10, 20, 30, 40, 50],
  },
}: DataTableConfig<TData> & { serverSidePagination?: boolean }) {
  // const [data, setData] = React.useState(() => initialData)
  const [rowSelection, setRowSelection] = React.useState({});
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({});
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [paginationState, setPaginationState] = React.useState({
    pageIndex: 0,
    pageSize: pagination.defaultPageSize || 10,
  });

  // 创建页面动画标识符，用于在翻页时触发动画
  const [pageAnimationKey, setPageAnimationKey] = React.useState(0);
  // 跟踪翻页方向，用于控制动画效果
  const [pageDirection, setPageDirection] = React.useState<'next' | 'prev' | 'initial'>('initial');

  // 处理分页状态变化
  const handlePaginationChange = React.useCallback(
    (updater: Updater<PaginationState>) => {
      // 获取新的分页状态
      const newPaginationState = typeof updater === 'function' ? updater(paginationState) : updater;

      // 判断翻页方向
      if (typeof updater === 'function') {
        const direction =
          newPaginationState.pageIndex > paginationState.pageIndex
            ? 'next'
            : newPaginationState.pageIndex < paginationState.pageIndex
              ? 'prev'
              : 'initial';
        setPageDirection(direction);
      } else {
        // 如果是直接设置页码，根据页码判断方向
        const direction =
          newPaginationState.pageIndex > paginationState.pageIndex
            ? 'next'
            : newPaginationState.pageIndex < paginationState.pageIndex
              ? 'prev'
              : 'initial';
        setPageDirection(direction);
      }

      // 如果是服务端分页且提供了回调函数，则先调用回调
      if (serverSidePagination && pagination.onPaginationChange) {
        pagination.onPaginationChange(newPaginationState.pageIndex, newPaginationState.pageSize);
      }

      // 更新动画标识符，触发动画效果
      setPageAnimationKey(prev => prev + 1);

      // 然后更新内部分页状态
      setPaginationState(newPaginationState);
    },
    [paginationState, serverSidePagination, pagination]
  );
  const sortableId = React.useId();
  const sensors = useSensors(
    useSensor(MouseSensor, {}),
    useSensor(TouchSensor, {}),
    useSensor(KeyboardSensor, {})
  );

  // 构建列定义，添加拖拽和选择列
  const columns = React.useMemo(() => {
    const baseColumns: ColumnDef<TData>[] = [];

    // 添加拖拽列
    if (enableDragSort) {
      baseColumns.push({
        id: 'drag',
        header: () => null,
        cell: ({ row }) => <DragHandle id={row.original.id} />,
        size: 40, // 为拖拽列设置固定宽度
        enableResizing: false,
      });
    }

    // 添加选择列
    if (enableRowSelection) {
      baseColumns.push({
        id: 'select',
        header: ({ table }) => (
          <div className="flex items-center justify-center">
            <Checkbox
              checked={
                table.getIsAllPageRowsSelected() ||
                (table.getIsSomePageRowsSelected() && 'indeterminate')
              }
              onCheckedChange={value => table.toggleAllPageRowsSelected(!!value)}
              aria-label="Select all"
            />
          </div>
        ),
        cell: ({ row }) => (
          <div className="flex items-center justify-center">
            <Checkbox
              checked={row.getIsSelected()}
              onCheckedChange={value => row.toggleSelected(!!value)}
              aria-label="Select row"
            />
          </div>
        ),
        enableSorting: false,
        enableHiding: false,
        size: 40, // 为选择列设置固定宽度
        enableResizing: false,
      });
    }

    // 增强用户定义的列，为ID列和排序列添加自动宽度
    const enhancedUserColumns = userColumns.map(column => {
      // 如果是ID列，设置合适的宽度
      if (column.id === 'id' || (column as unknown as AccessorKeyColumn).accessorKey === 'id') {
        return {
          ...column,
          size: 80, // ID列通常较短
          enableResizing: true,
        };
      }

      // 如果列定义了排序，设置适当的宽度
      if (column.enableSorting !== false) {
        return {
          ...column,
          enableResizing: true,
        };
      }

      return column;
    });

    // 合并用户定义的列
    return [...baseColumns, ...enhancedUserColumns];
  }, [enableDragSort, enableRowSelection, userColumns]);

  const dataIds = React.useMemo<UniqueIdentifier[]>(() => data?.map(({ id }) => id) || [], [data]);

  const [columnSizing, setColumnSizing] = React.useState<ColumnSizingState>({});

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      columnVisibility,
      rowSelection,
      columnFilters,
      pagination: paginationState,
      columnSizing,
    },
    defaultColumn,
    onColumnSizingChange: setColumnSizing,
    columnResizeMode: 'onChange',
    getRowId: row => String(row.id),
    enableRowSelection,
    enableColumnResizing,
    onRowSelectionChange: setRowSelection,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: enableColumnVisibility ? setColumnVisibility : undefined, // 仅在启用列可见性时设置更新函数
    onPaginationChange: handlePaginationChange,
    // 服务端分页配置
    manualPagination: serverSidePagination,
    // 如果提供了rowCount或pageCount，则使用它们
    rowCount: pagination.rowCount,
    pageCount: pagination.pageCount,
    // 根据分页模式决定是否使用客户端分页模型
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel:
      enablePagination && !serverSidePagination ? getPaginationRowModel() : undefined,
    getSortedRowModel: getSortedRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
  });

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (active && over && active.id !== over.id) {
      const oldIndex = dataIds.indexOf(active.id);
      const newIndex = dataIds.indexOf(over.id);
      const newData = arrayMove(data, oldIndex, newIndex);

      // 调用拖拽排序完成回调
      if (onDragSortEnd) {
        onDragSortEnd(newData);
      }
      return newData;
    }
  }

  // 根据翻页方向获取动画属性
  const getAnimationProps = () => {
    switch (pageDirection) {
      case 'next':
        return {
          initial: { opacity: 0, x: -50 },
          animate: { opacity: 1, x: 0 },
          exit: { opacity: 0, x: 50 },
        };
      case 'prev':
        return {
          initial: { opacity: 0, x: 50 },
          animate: { opacity: 1, x: 0 },
          exit: { opacity: 0, x: -50 },
        };
      default:
        return {
          initial: { opacity: 0 },
          animate: { opacity: 1 },
          exit: { opacity: 0 },
        };
    }
  };

  // 使用css动态计算每个columns的宽度
  const columnSizeVars = React.useMemo(() => {
    const headers = table.getFlatHeaders();
    const colSizes: { [key: string]: number } = {};
    for (let i = 0; i < headers.length; i++) {
      const header = headers[i]!;
      colSizes[`--header-${header.id}-size`] = header.getSize();
      colSizes[`--col-${header.column.id}-size`] = header.column.getSize();
    }
    return colSizes;
  }, [
    table.getState().columnSizingInfo,
    table.getState().columnSizing,
    table.getAllColumns().length,
    table.getState().columnOrder,
  ]);

  // 动画属性
  const animationProps = getAnimationProps();

  // 记忆化表格主体内容，在调整列大小时避免重新渲染
  const memoizedTableBody = React.useMemo(() => {
    const isResizing = table.getState().columnSizingInfo.isResizingColumn;

    if (enableDragSort) {
      return table.getRowModel().rows?.length ? (
        <SortableContext items={dataIds} strategy={verticalListSortingStrategy}>
          {table
            .getRowModel()
            .rows.map(row =>
              isResizing ? (
                <MemoizedDraggableRow key={row.id} row={row as Row<BaseDataType>} />
              ) : (
                <DraggableRow key={row.id} row={row} />
              )
            )}
        </SortableContext>
      ) : (
        <motion.tr
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
        >
          <TableCell colSpan={columns.length} className="h-24 text-center">
            No results.
          </TableCell>
        </motion.tr>
      );
    } else {
      return table.getRowModel().rows?.length ? (
        table
          .getRowModel()
          .rows.map(row =>
            isResizing ? (
              <MemoizedAnimatedTableRow key={row.id} row={row as Row<BaseDataType>} />
            ) : (
              <AnimatedTableRow key={row.id} row={row} />
            )
          )
      ) : (
        <motion.tr
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
        >
          <TableCell colSpan={columns.length} className="h-24 text-center">
            No results.
          </TableCell>
        </motion.tr>
      );
    }
  }, [
    table.getRowModel().rows,
    dataIds,
    columns.length,
    enableDragSort,
    table.getState().columnSizingInfo.isResizingColumn,
    // 添加isResizingColumn作为依赖，以便在开始或结束调整大小时切换组件
  ]);

  // 渲染表格内容
  const renderTableContent = () => (
    <div
      className="overflow-hidden rounded-lg border relative"
      style={columnSizeVars as React.CSSProperties}
    >
      {enableDragSort ? (
        <DndContext
          collisionDetection={closestCenter}
          modifiers={[restrictToVerticalAxis]}
          onDragEnd={handleDragEnd}
          sensors={sensors}
          id={sortableId}
        >
          <Table className="relative h-10 truncate border-t [&:not([data-pinned]):has(+[data-pinned])_div.cursor-col-resize:last-child]:opacity-0 [&[data-last-col=left]_div.cursor-col-resize:last-child]:opacity-0 [&[data-pinned=left][data-last-col=left]]:border-r [&[data-pinned=right]:last-child_div.cursor-col-resize:last-child]:opacity-0 [&[data-pinned=right][data-last-col=right]]:border-l [&[data-pinned][data-last-col]]:border-border [&[data-pinned]]:bg-muted/90 [&[data-pinned]]:backdrop-blur-sm">
            <TableHeader className="sticky top-0 z-10 bg-muted">
              {table.getHeaderGroups().map(headerGroup => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map(header => {
                    return (
                      <TableHead
                        key={header.id}
                        colSpan={header.colSpan}
                        style={{
                          width: header.getSize(),
                          position: 'relative',
                        }}
                        className="relative h-10 select-none"
                      >
                        {header.isPlaceholder
                          ? null
                          : flexRender(header.column.columnDef.header, header.getContext())}
                        {enableColumnResizing && header.column.getCanResize() && (
                          <ColumnResizeHandle
                            onMouseDown={header.getResizeHandler()}
                            onTouchStart={header.getResizeHandler()}
                            onDoubleClick={() => header.column.resetSize()}
                          />
                        )}
                      </TableHead>
                    );
                  })}
                </TableRow>
              ))}
            </TableHeader>
            {loading && (
              <div className="absolute inset-0 z-50 bg-background/80 flex items-center justify-center">
                {renderLoading ? (
                  renderLoading()
                ) : (
                  <Loader2 className="animate-spin h-8 w-8 text-primary" />
                )}
              </div>
            )}
            {/* 使用AnimatePresence为拖拽模式添加翻页动画 */}
            <AnimatePresence mode="wait">
              <motion.tbody
                key={pageAnimationKey}
                {...animationProps}
                transition={{ duration: 0.25 }}
                className="**:data-[slot=table-cell]:first:w-8"
              >
                {memoizedTableBody}
              </motion.tbody>
            </AnimatePresence>
          </Table>
        </DndContext>
      ) : (
        <Table className="relative h-10 truncate border-t [&:not([data-pinned]):has(+[data-pinned])_div.cursor-col-resize:last-child]:opacity-0 [&[data-last-col=left]_div.cursor-col-resize:last-child]:opacity-0 [&[data-pinned=left][data-last-col=left]]:border-r [&[data-pinned=right]:last-child_div.cursor-col-resize:last-child]:opacity-0 [&[data-pinned=right][data-last-col=right]]:border-l [&[data-pinned][data-last-col]]:border-border [&[data-pinned]]:bg-muted/90 [&[data-pinned]]:backdrop-blur-sm">
          <TableHeader className="sticky top-0 z-10 bg-muted">
            {table.getHeaderGroups().map(headerGroup => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map(header => {
                  return (
                    <TableHead
                      key={header.id}
                      colSpan={header.colSpan}
                      style={{
                        width: header.getSize(),
                        position: 'relative',
                      }}
                      className="relative h-10 select-none [&>.cursor-col-resize]:last:opacity-0"
                    >
                      {header.isPlaceholder
                        ? null
                        : flexRender(header.column.columnDef.header, header.getContext())}
                      {enableColumnResizing && header.column.getCanResize() && (
                        <ColumnResizeHandle
                          onMouseDown={header.getResizeHandler()}
                          onTouchStart={header.getResizeHandler()}
                          onDoubleClick={() => header.column.resetSize()}
                        />
                      )}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          {loading && (
            <div className="absolute inset-0 z-50 bg-background/80 flex items-center justify-center">
              {renderLoading ? (
                renderLoading()
              ) : (
                <Loader2 className="animate-spin h-8 w-8 text-primary" />
              )}
            </div>
          )}
          {/* 使用AnimatePresence包裹表格体，添加动画 */}
          <AnimatePresence mode="wait">
            <motion.tbody
              key={pageAnimationKey}
              {...animationProps}
              transition={{ duration: 0.25 }}
              className="**:data-[slot=table-cell]:first:w-8"
            >
              {memoizedTableBody}
            </motion.tbody>
          </AnimatePresence>
        </Table>
      )}
    </div>
  );

  // 渲染分页控件
  const renderPagination = () => {
    if (!enablePagination) return null;

    return (
      <div className="flex items-center justify-between px-4">
        <div className="hidden flex-1 text-sm text-muted-foreground lg:flex">
          {table.getFilteredSelectedRowModel().rows.length} 个中的{' '}
          {serverSidePagination && pagination.rowCount
            ? pagination.rowCount
            : table.getFilteredRowModel().rows.length}{' '}
          行已选择。
        </div>
        <div className="flex w-full items-center gap-8 lg:w-fit">
          <div className="hidden items-center gap-2 lg:flex">
            <Label htmlFor="rows-per-page" className="text-sm font-medium">
              每页行数
            </Label>
            <Select
              value={`${table.getState().pagination.pageSize}`}
              onValueChange={value => {
                // 设置为初始方向，避免改变每页条数时出现方向性动画
                setPageDirection('initial');
                table.setPageSize(Number(value));
              }}
            >
              <SelectTrigger className="w-20" id="rows-per-page">
                <SelectValue placeholder={table.getState().pagination.pageSize} />
              </SelectTrigger>
              <SelectContent side="top">
                {pagination.pageSizeOptions?.map(pageSize => (
                  <SelectItem key={pageSize} value={`${pageSize}`}>
                    {pageSize}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex w-fit items-center justify-center text-sm font-medium">
            第 {table.getState().pagination.pageIndex + 1} 页，共 {table.getPageCount()} 页
          </div>
          <div className="ml-auto flex items-center gap-2 lg:ml-0">
            <Button
              variant="outline"
              className="hidden h-8 w-8 p-0 lg:flex"
              onClick={() => {
                setPageDirection('prev');
                table.setPageIndex(0);
              }}
              disabled={!table.getCanPreviousPage()}
            >
              <span className="sr-only">跳转到第一页</span>
              <ChevronsLeftIcon />
            </Button>
            <Button
              variant="outline"
              className="size-8"
              size="icon"
              onClick={() => {
                setPageDirection('prev');
                table.previousPage();
              }}
              disabled={!table.getCanPreviousPage()}
            >
              <span className="sr-only">上一页</span>
              <ChevronLeftIcon />
            </Button>
            <Button
              variant="outline"
              className="size-8"
              size="icon"
              onClick={() => {
                setPageDirection('next');
                table.nextPage();
              }}
              disabled={!table.getCanNextPage()}
            >
              <span className="sr-only">下一页</span>
              <ChevronRightIcon />
            </Button>
            <Button
              variant="outline"
              className="hidden size-8 lg:flex"
              size="icon"
              onClick={() => {
                setPageDirection('next');
                table.setPageIndex(table.getPageCount() - 1);
              }}
              disabled={!table.getCanNextPage()}
            >
              <span className="sr-only">跳转到最后一页</span>
              <ChevronsRightIcon />
            </Button>
          </div>
        </div>
      </div>
    );
  };

  // 渲染表格工具栏
  const renderToolbar = () => (
    <div className="flex items-center justify-between px-4 lg:px-6">
      {tabs ? (
        <>
          <Label htmlFor="view-selector" className="sr-only">
            View
          </Label>
          <Select defaultValue={tabs.defaultValue}>
            <SelectTrigger className="@4xl/main:hidden flex w-fit" id="view-selector">
              <SelectValue placeholder="Select a view" />
            </SelectTrigger>
            <SelectContent>
              {tabs.items.map(item => (
                <SelectItem key={item.value} value={item.value}>
                  {item.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <TabsList className="@4xl/main:flex hidden">
            {tabs.items.map(item => (
              <TabsTrigger
                key={item.value}
                value={item.value}
                className={item.badge ? 'gap-1' : ''}
              >
                {item.label}{' '}
                {item.badge && (
                  <Badge
                    variant="secondary"
                    className="flex h-5 w-5 items-center justify-center rounded-full bg-muted-foreground/30"
                  >
                    {item.badge}
                  </Badge>
                )}
              </TabsTrigger>
            ))}
          </TabsList>
        </>
      ) : (
        <div />
      )}
      <div className="flex items-center gap-2">
        {enableCustomizeColumns && enableColumnVisibility && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <ColumnsIcon />
                <span className="hidden lg:inline">{columnVisibilityText}</span>
                <span className="lg:hidden">Columns</span>
                <ChevronDownIcon />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              {table
                .getAllColumns()
                .filter(column => typeof column.accessorFn !== 'undefined' && column.getCanHide())
                .map(column => {
                  return (
                    <DropdownMenuCheckboxItem
                      key={column.id}
                      className="capitalize"
                      checked={column.getIsVisible()}
                      onCheckedChange={value => column.toggleVisibility(!!value)}
                    >
                      {typeof column.columnDef.header === 'function'
                        ? column.id.toString()
                        : column.columnDef.header || column.id}
                    </DropdownMenuCheckboxItem>
                  );
                })}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
        {enableAddButton && (
          <Button variant="outline" size="sm" onClick={onAddButtonClick}>
            <PlusIcon />
            <span className="hidden lg:inline">{addButtonText}</span>
          </Button>
        )}
      </div>
    </div>
  );

  // 如果有标签页，渲染带标签页的表格
  if (tabs) {
    return (
      <Tabs defaultValue={tabs.defaultValue} className="flex w-full flex-col justify-start gap-6">
        {renderToolbar()}
        {tabs.items.map(item => (
          <TabsContent
            key={item.value}
            value={item.value}
            className="relative flex flex-col gap-4 overflow-auto px-4 lg:px-6"
          >
            {item.value === tabs.defaultValue ? (
              <>
                {renderTableContent()}
                {renderPagination()}
              </>
            ) : (
              item.content || (
                <div className="aspect-video w-full flex-1 rounded-lg border border-dashed"></div>
              )
            )}
          </TabsContent>
        ))}
      </Tabs>
    );
  }

  // 否则渲染普通表格
  return (
    <div className="flex w-full flex-col justify-start gap-6">
      {renderToolbar()}
      <div className="relative flex flex-col gap-4 overflow-auto px-4 lg:px-6">
        {renderTableContent()}
        {renderPagination()}
      </div>
    </div>
  );
}

// 创建一个辅助函数，用于创建列定义
export function createColumn<TData extends BaseDataType>(
  column: ColumnDef<TData>
): ColumnDef<TData> {
  // 为特定类型的列添加默认配置
  if (column.id === 'id' || (column as unknown as AccessorKeyColumn).accessorKey === 'id') {
    return {
      ...column,
      size: column.size || 80, // ID列通常较短
      enableResizing: column.enableResizing !== false,
    };
  }

  // 为可排序列添加默认配置
  if (column.enableSorting !== false) {
    return {
      ...column,
      enableResizing: column.enableResizing !== false,
    };
  }

  return column;
}

// 创建一个辅助函数，用于创建表格配置
export function createDataTableConfig<TData extends BaseDataType>(
  config: DataTableConfig<TData>
): DataTableConfig<TData> {
  return config;
}
