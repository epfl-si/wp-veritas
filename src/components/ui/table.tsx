'use client';
import React, { useState, useMemo } from 'react';
import { ChevronUp, ChevronDown } from 'lucide-react';

export interface TableColumn<T = any> {
	key: string;
	label: string;
	width?: string;
	align?: 'left' | 'center' | 'right';
	render?: (item: T, index: number) => React.ReactNode;
	className?: string;
	sortable?: boolean;
	sortKey?: string; // Key to use for sorting if different from column key
}

export interface TableProps<T = any> {
	data: T[];
	columns: TableColumn<T>[];
	className?: string;
	headerClassName?: string;
	rowClassName?: string | ((item: T, index: number) => string);
	onRowClick?: (item: T, index: number) => void;
	defaultSort?: {
		key: string;
		direction: 'asc' | 'desc';
	};
}

type SortState = {
	key: string | null;
	direction: 'asc' | 'desc';
};

export const Table = <T extends Record<string, any>>({ data, columns, className = '', headerClassName = '', rowClassName = '', onRowClick, defaultSort }: TableProps<T>) => {
	const [sortState, setSortState] = useState<SortState>({
		key: defaultSort?.key || null,
		direction: defaultSort?.direction || 'asc',
	});

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

		// Si c'est déjà une classe Tailwind, on la retourne telle quelle
		if (width.startsWith('w-')) return width;

		// Sinon on assume que c'est une largeur personnalisée
		return width;
	};

	const handleSort = (column: TableColumn<T>) => {
		if (!column.sortable) return;

		const sortKey = column.sortKey || column.key;

		if (sortState.key === sortKey) {
			// Toggle direction if same column
			setSortState({
				key: sortKey,
				direction: sortState.direction === 'asc' ? 'desc' : 'asc',
			});
		} else {
			// New column, default to ascending
			setSortState({
				key: sortKey,
				direction: 'asc',
			});
		}
	};

	const getSortValue = (item: T, sortKey: string): any => {
		// Support for nested keys like 'user.name'
		const keys = sortKey.split('.');
		let value = item;

		for (const key of keys) {
			value = value?.[key];
			if (value === undefined || value === null) break;
		}

		return value;
	};

	const sortedData = useMemo(() => {
		if (!sortState.key) return data;

		return [...data].sort((a, b) => {
			const aValue = getSortValue(a, sortState.key!);
			const bValue = getSortValue(b, sortState.key!);

			// Handle null/undefined values
			if (aValue == null && bValue == null) return 0;
			if (aValue == null) return sortState.direction === 'asc' ? 1 : -1;
			if (bValue == null) return sortState.direction === 'asc' ? -1 : 1;

			// Handle dates
			if (aValue instanceof Date && bValue instanceof Date) {
				const result = aValue.getTime() - bValue.getTime();
				return sortState.direction === 'asc' ? result : -result;
			}

			// Handle strings and numbers
			if (typeof aValue === 'string' && typeof bValue === 'string') {
				const result = aValue.localeCompare(bValue);
				return sortState.direction === 'asc' ? result : -result;
			}

			if (typeof aValue === 'number' && typeof bValue === 'number') {
				const result = aValue - bValue;
				return sortState.direction === 'asc' ? result : -result;
			}

			// Fallback to string comparison
			const result = String(aValue).localeCompare(String(bValue));
			return sortState.direction === 'asc' ? result : -result;
		});
	}, [data, sortState]);

	const renderCellContent = (item: T, column: TableColumn<T>, index: number) => {
		if (column.render) {
			return column.render(item, index);
		}
		return item[column.key] || '';
	};

	const renderSortIcon = (column: TableColumn<T>) => {
		if (!column.sortable) return null;

		const sortKey = column.sortKey || column.key;
		const isActive = sortState.key === sortKey;

		return (
			<div className="flex flex-col ml-1">
				<ChevronUp className={`h-3 w-3 ${isActive && sortState.direction === 'asc' ? 'text-blue-600' : 'text-gray-400'}`} />
				<ChevronDown className={`h-3 w-3 -mt-1 ${isActive && sortState.direction === 'desc' ? 'text-blue-600' : 'text-gray-400'}`} />
			</div>
		);
	};

	return (
		<div className={`flex-1 overflow-hidden ${className}`}>
			<div className="h-full flex flex-col">
				<div className="flex-shrink-0 border-b">
					<table className="min-w-full">
						<thead>
							<tr className={headerClassName}>
								{columns.map((column) => (
									<th key={column.key} scope="col" className={`px-6 py-3 text-xs font-medium text-gray-700 uppercase tracking-wider ${getWidthClass(column.width)} ${getAlignmentClass(column.align)} ${column.className || ''} ${column.sortable ? 'cursor-pointer hover:bg-gray-100 transition-colors' : ''}`} onClick={() => handleSort(column)}>
										<div className="flex items-center justify-between">
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
					<table className="min-w-full">
						<tbody className="bg-white divide-y divide-gray-200">
							{sortedData.map((item, index) => (
								<tr key={item.id || index} className={`${getRowClassName(item, index)} ${onRowClick ? 'cursor-pointer' : ''}`} onClick={() => onRowClick?.(item, index)}>
									{columns.map((column) => (
										<td key={column.key} className={`px-6 py-4 ${getWidthClass(column.width)} ${getAlignmentClass(column.align)} ${column.className || ''}`}>
											{renderCellContent(item, column, index)}
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
