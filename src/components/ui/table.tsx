'use client';
import React, { useState, useMemo } from 'react';
import { ChevronUp, ChevronDown } from 'lucide-react';

export interface TableColumn<T> {
	key: keyof T | string;
	label: string;
	width?: string;
	align?: 'left' | 'center' | 'right';
	display?: boolean;
	render?: (item: T, index: number) => React.ReactNode;
	className?: string;
	sortable?: boolean;
	sortKey?: keyof T | string;
}

export interface TableProps<T> {
	data: T[];
	columns: TableColumn<T>[];
	className?: string;
	headerClassName?: string;
	rowClassName?: string | ((item: T, index: number) => string);
	onRowClick?: (item: T, index: number) => void;
	defaultSort?: {
		key: keyof T | string;
		direction: 'asc' | 'desc';
	};
}

type SortState = {
	key: string | null;
	direction: 'asc' | 'desc';
};

type SortableValue = string | number | Date | boolean | null | undefined;

export const Table = <T extends object>({ data, columns, className = '', headerClassName = '', rowClassName = '', onRowClick, defaultSort }: TableProps<T>) => {
	const [sortState, setSortState] = useState<SortState>({
		key: defaultSort?.key ? String(defaultSort.key) : null,
		direction: defaultSort?.direction || 'asc',
	});

	const visibleColumns = useMemo(() => {
		return columns.filter((column) => column.display !== false);
	}, [columns]);

	const getRowClassName = (item: T, index: number): string => {
		const baseClasses = 'hover:bg-gray-50 transition-colors duration-150';
		if (typeof rowClassName === 'function') {
			return `${baseClasses} ${rowClassName(item, index)}`;
		}
		return `${baseClasses} ${rowClassName}`;
	};

	const getAlignmentClass = (align?: 'left' | 'center' | 'right'): string => {
		switch (align) {
			case 'center':
				return 'text-center';
			case 'right':
				return 'text-right';
			default:
				return 'text-left';
		}
	};

	const getWidthClass = (width?: string): string => {
		if (!width) return '';
		if (width.startsWith('w-')) return width;
		return width;
	};

	const handleSort = (column: TableColumn<T>): void => {
		if (!column.sortable) return;

		const sortKey = String(column.sortKey || column.key);

		if (sortState.key === sortKey) {
			setSortState({
				key: sortKey,
				direction: sortState.direction === 'asc' ? 'desc' : 'asc',
			});
		} else {
			setSortState({
				key: sortKey,
				direction: 'asc',
			});
		}
	};

	const getSortValue = (item: T, sortKey: string): SortableValue => {
		const keys = sortKey.split('.');
		let value: unknown = item;

		for (const key of keys) {
			if (value && typeof value === 'object' && !Array.isArray(value) && key in value) {
				value = (value as Record<string, unknown>)[key];
			} else {
				return undefined;
			}
		}

		if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean' || value instanceof Date || value === null || value === undefined) {
			return value;
		}

		return String(value);
	};

	const compareSortableValues = (a: SortableValue, b: SortableValue, direction: 'asc' | 'desc'): number => {
		if (a == null && b == null) return 0;
		if (a == null) return direction === 'asc' ? 1 : -1;
		if (b == null) return direction === 'asc' ? -1 : 1;

		if (a instanceof Date && b instanceof Date) {
			const result = a.getTime() - b.getTime();
			return direction === 'asc' ? result : -result;
		}

		if (typeof a === 'string' && typeof b === 'string') {
			const result = a.localeCompare(b);
			return direction === 'asc' ? result : -result;
		}

		if (typeof a === 'number' && typeof b === 'number') {
			const result = a - b;
			return direction === 'asc' ? result : -result;
		}

		if (typeof a === 'boolean' && typeof b === 'boolean') {
			const result = Number(a) - Number(b);
			return direction === 'asc' ? result : -result;
		}

		const result = String(a).localeCompare(String(b));
		return direction === 'asc' ? result : -result;
	};

	const sortedData = useMemo(() => {
		if (!sortState.key) return data;

		return [...data].sort((a, b) => {
			const aValue = getSortValue(a, sortState.key!);
			const bValue = getSortValue(b, sortState.key!);
			return compareSortableValues(aValue, bValue, sortState.direction);
		});
	}, [data, sortState]);

	const renderCellContent = (item: T, column: TableColumn<T>, index: number): React.ReactNode => {
		if (column.render) {
			return column.render(item, index);
		}

		const key = column.key as keyof T;
		const value = item[key];

		if (value === null || value === undefined) {
			return '';
		}

		if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
			return String(value);
		}

		if (value instanceof Date) {
			return value.toLocaleDateString();
		}

		return String(value);
	};

	const renderSortIcon = (column: TableColumn<T>): React.ReactNode => {
		if (!column.sortable) return null;

		const sortKey = String(column.sortKey || column.key);
		const isActive = sortState.key === sortKey;

		return (
			<div className="flex flex-col ml-1">
				<ChevronUp className={`h-3 w-3 ${isActive && sortState.direction === 'asc' ? 'text-red-600' : 'text-gray-400'}`} />
				<ChevronDown className={`h-3 w-3 -mt-1 ${isActive && sortState.direction === 'desc' ? 'text-red-600' : 'text-gray-400'}`} />
			</div>
		);
	};

	const getUniqueKey = (item: T, index: number): string | number => {
		if (typeof item === 'object' && item !== null && 'id' in item) {
			const id = (item as { id: unknown }).id;
			if (typeof id === 'string' || typeof id === 'number') {
				return id;
			}
		}
		return index;
	};

	return (
		<div className={`flex-1 ${className}`}>
			<div className="h-full flex flex-col">
				<div className="flex-shrink-0 border-b">
					<table className="min-w-full table-fixed">
						<thead>
							<tr className={headerClassName}>
								{visibleColumns.map((column) => (
									<th key={String(column.key)} scope="col" className={`text-xs font-medium text-gray-700 uppercase tracking-wider ${getWidthClass(column.width)} ${getAlignmentClass(column.align)} ${column.className || ''} ${column.sortable ? 'cursor-pointer hover:bg-gray-100 transition-colors' : ''}`} onClick={() => handleSort(column)}>
										<div className="px-2 py-2 flex items-center justify-between">
											<span className={getAlignmentClass(column.align)}>{column.label}</span>
											{renderSortIcon(column)}
										</div>
									</th>
								))}
							</tr>
						</thead>
					</table>
				</div>
				<div className="flex-1 overflow-y-auto">
					<table className="min-w-full table-fixed">
						<tbody className="bg-white divide-y divide-gray-200">
							{sortedData.map((item, index) => (
								<tr key={getUniqueKey(item, index)} className={`${getRowClassName(item, index)} ${onRowClick ? 'cursor-pointer' : ''}`} onClick={() => onRowClick?.(item, index)}>
									{visibleColumns.map((column) => (
										<td key={String(column.key)} className={`${getWidthClass(column.width)} ${getAlignmentClass(column.align)} ${column.className || ''} truncate`}>
											<div className={`px-2 py-2 ${getWidthClass(column.width)}`}>{renderCellContent(item, column, index)}</div>
										</td>
									))}
								</tr>
							))}
						</tbody>
					</table>
				</div>
			</div>
		</div>
	);
};
