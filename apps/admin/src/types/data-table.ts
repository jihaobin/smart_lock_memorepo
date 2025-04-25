/**
 * 数据表格类型定义文件
 * 提供数据表格组件所需的类型定义
 */

import { ColumnDef } from "@tanstack/react-table"
import { ReactNode } from "react"

/**
 * 基础数据类型
 * 所有表格数据项必须继承此类型
 */
export type BaseDataType = {
  /** 数据项的唯一标识符 */
  id: string | number
}

/**
 * 表格标签页项配置
 */
export interface TabItem {
  /** 标签值，用于标识 */
  value: string
  /** 标签显示文本 */
  label: string
  /** 可选的徽章数字 */
  badge?: number
  /** 可选的自定义内容 */
  content?: ReactNode
}

/**
 * 表格标签页配置
 */
export interface TabsConfig {
  /** 默认选中的标签值 */
  defaultValue: string
  /** 标签项列表 */
  items: TabItem[]
}

/**
 * 分页配置
 */
export interface PaginationConfig {
  /** 默认每页显示数量 */
  defaultPageSize?: number
  /** 可选的每页显示数量选项 */
  pageSizeOptions?: number[]
  /** 总行数（用于服务端分页） */
  rowCount?: number
  /** 总页数（用于服务端分页） */
  pageCount?: number
  /** 分页变化回调（用于服务端分页） */
  onPaginationChange?: (pageIndex: number, pageSize: number) => void
}

/**
 * 数据表格配置接口
 */
export interface DataTableConfig<TData extends BaseDataType> {
  /** 表格数据 */
  data: TData[]
  /** 列定义 */
  columns: ColumnDef<TData>[]
  /** 是否启用拖拽排序 */
  enableDragSort?: boolean
  /** 是否显示加载状态 */
  loading?: boolean
  /** 自定义加载状态渲染函数 */
  renderLoading?: () => React.ReactNode
  /** 是否启用分页 */
  enablePagination?: boolean
  /** 是否启用行选择 */
  enableRowSelection?: boolean
  /** 是否启用列可见性控制 */
  enableColumnVisibility?: boolean
  /** 是否启用自定义列按钮 */
  enableCustomizeColumns?: boolean
  /** 是否启用添加按钮 */
  enableAddButton?: boolean
  /** 是否启用列大小调整 */
  enableColumnResizing?: boolean
  /** 默认列配置 */
  defaultColumn?: {
    /** 默认列宽度 */
    size?: number
    /** 最小列宽度 */
    minSize?: number
    /** 最大列宽度 */
    maxSize?: number
  }
  /** 添加按钮点击回调 */
  onAddButtonClick?: () => void
  /** 拖拽排序完成回调 */
  onDragSortEnd?: (newData: TData[]) => void
  /** 表格标签页配置 */
  tabs?: TabsConfig
  /** 分页配置 */
  pagination?: PaginationConfig
  // 列可见性文本
  columnVisibilityText?: string
  // 添加按钮文本
  addButtonText?: string
  // 添加按钮图标
  addButtonIcon?: React.ReactNode
}

/**
 * 创建列定义的辅助函数类型
 */
export type CreateColumnFn = <TData extends BaseDataType>(
  column: ColumnDef<TData>
) => ColumnDef<TData>

/**
 * 创建表格配置的辅助函数类型
 */
export type CreateDataTableConfigFn = <TData extends BaseDataType>(
  config: DataTableConfig<TData>
) => DataTableConfig<TData>
