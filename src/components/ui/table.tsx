'use client';
import React from 'react';

export interface TableColumn<T = any> {
	key: string;
	label: string;
	width?: string;
	align?: 'left' | 'center' | 'right';
	render?: (item: T, index: number) => React.ReactNode;
	className?: string;
}

export interface TableProps<T = any> {
	data: T[];
	columns: TableColumn<T>[];
	className?: string;
	headerClassName?: string;
	rowClassName?: string | ((item: T, index: number) => string);
	onRowClick?: (item: T, index: number) => void;
}

export const Table = <T extends Record<string, any>>({ data, columns, className = '', headerClassName = '', rowClassName = '', onRowClick }: TableProps<T>) => {
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

	const renderCellContent = (item: T, column: TableColumn<T>, index: number) => {
		if (column.render) {
			return column.render(item, index);
		}
		return item[column.key] || '';
	};

	return (
		<div className={`flex-1 overflow-hidden ${className}`}>
			<div className="h-full flex flex-col">
				<div className="flex-shrink-0 border-b">
					<table className="min-w-full">
						<thead>
							<tr className={headerClassName}>
								{columns.map((column) => (
									<th key={column.key} scope="col" className={`px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider ${column.width || ''} ${getAlignmentClass(column.align)} ${column.className || ''}`}>
										{column.label}
									</th>
								))}
							</tr>
						</thead>
					</table>
				</div>

				<div className="flex-1 overflow-y-auto">
					<table className="min-w-full mb-4">
						<tbody className="bg-white divide-y divide-gray-200">
							{data.map((item, index) => (
								<tr key={item.id || index} className={`${getRowClassName(item, index)} ${onRowClick ? 'cursor-pointer' : ''}`} onClick={() => onRowClick?.(item, index)}>
									{columns.map((column) => (
										<td key={column.key} className={`px-6 py-4 ${column.width || ''} ${getAlignmentClass(column.align)} ${column.className || ''}`}>
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
