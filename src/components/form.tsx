'use client';
import { useState } from 'react';
import { useForm, SubmitHandler, FieldValues, Path, DefaultValues } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FormField, Form as UiForm, FormItem, FormLabel, FormControl, FormDescription, FormMessage } from '@/components/ui/form';
import { Separator } from '@/components/ui/separator';
import { CircleAlert, CircleCheck, Loader2, X } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';

export type FieldType = 'text' | 'email' | 'password' | 'number' | 'textarea' | 'select' | 'checkbox' | 'multi-checkbox' | 'boxes';

export interface SelectOption {
	value: string | number;
	label: string;
	color?: string;
	icon?: React.ComponentType<{ className?: string }> | string;
}

export interface FieldCondition {
	field: string;
	operator: 'equals' | 'includes' | 'not_equals' | 'not_includes';
	value: unknown;
}

export interface FieldConfig {
	name: string;
	type: FieldType;
	label: string;
	placeholder?: string;
	description?: string;
	required?: boolean;
	options?: SelectOption[];
	conditions?: FieldCondition[];
	width?: 'half' | 'full';
	section?: string;
}

export interface SectionConfig {
	name: string;
	title: string;
	description?: string;
	columns?: 1 | 2;
}

export interface FormConfig<T extends FieldValues> {
	schema: z.ZodType<T>;
	fields: FieldConfig[];
	sections?: SectionConfig[];
	defaultValues?: DefaultValues<T>;
	apiEndpoint: string;
	method?: 'POST' | 'PUT' | 'PATCH';
	onSuccess?: (data: T, response: unknown) => void;
	onError?: (error: Error) => void;
	reset?: boolean;
	submitButtonText?: string;
	resetButtonText?: string;
	loadingText?: string;
	successTitle?: string;
	successMessage?: string;
	errorMessage?: string;
}

export interface ApiResponse {
	success: boolean;
	message: string;
	data?: unknown;
}

interface ReusableFormProps<T extends FieldValues> {
	config: FormConfig<T>;
	className?: string;
}

export default function Form<T extends FieldValues>({ config, className = '' }: ReusableFormProps<T>) {
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [submissionResult, setSubmissionResult] = useState<ApiResponse | null>(null);
	const [hasSubmitted, setHasSubmitted] = useState(false);

	const form = useForm<T>({
		resolver: zodResolver(config.schema as never),
		defaultValues: config.defaultValues,
		mode: 'onSubmit',
		reValidateMode: 'onChange',
	});

	const watchedValues = form.watch();

	const shouldShowField = (field: FieldConfig): boolean => {
		if (!field.conditions || field.conditions.length === 0) return true;

		return field.conditions.every((condition) => {
			const fieldValue = watchedValues[condition.field as keyof T];
			switch (condition.operator) {
				case 'equals':
					return fieldValue === condition.value;
				case 'not_equals':
					return fieldValue !== condition.value;
				case 'includes':
					return Array.isArray(fieldValue) ? fieldValue.includes(condition.value) : false;
				case 'not_includes':
					return Array.isArray(fieldValue) ? !fieldValue.includes(condition.value) : true;
				default:
					return true;
			}
		});
	};

	const BoxOption = ({ option, isSelected, onClick }: { option: SelectOption; isSelected: boolean; onClick: () => void }) => {
		const IconComponent = option.icon;
		return (
			<div
				className={cn('relative cursor-pointer rounded-lg border-3 p-4 transition-all duration-200 hover:shadow-md', isSelected ? 'border-primary bg-primary/5 shadow-sm' : 'border-gray-200 hover:border-gray-300')}
				style={{
					borderColor: isSelected && option.color ? option.color : undefined,
					backgroundColor: isSelected && option.color ? `${option.color}10` : undefined,
				}}
				onClick={onClick}>
				<div className="flex flex-col items-center text-center space-y-2">
					{IconComponent && (
						<div
							className="size-9 flex items-center justify-center"
							style={{
								backgroundColor: option.color ? `${option.color}20` : '#f3f4f6',
								color: option.color || '#6b7280',
							}}>
							{typeof IconComponent === 'string' ? <span className="text-lg">{IconComponent}</span> : <IconComponent className="w-5 h-5" />}
						</div>
					)}
					<span className={cn('text-sm font-medium transition-colors', isSelected ? 'text-gray-900' : 'text-gray-600')}>{option.label}</span>
				</div>
			</div>
		);
	};

	const renderField = (fieldConfig: FieldConfig) => {
		const { name, type, label, placeholder, description, options, width = 'half' } = fieldConfig;

		return (
			<div key={name} className={`min-h-[90px] flex flex-col ${width === 'full' ? 'col-span-full' : ''}`}>
				<FormField
					control={form.control}
					name={name as Path<T>}
					render={({ field }) => (
						<FormItem>
							<FormLabel>{label}</FormLabel>
							<FormControl>
								{type === 'text' || type === 'email' || type === 'password' ? (
									<Input type={type} placeholder={placeholder} {...field} />
								) : type === 'number' ? (
									<Input
										type="number"
										placeholder={placeholder}
										value={field.value || ''}
										onChange={(e) => {
											const value = e.target.value === '' ? undefined : parseInt(e.target.value);
											field.onChange(value);
										}}
									/>
								) : type === 'textarea' ? (
									<Textarea placeholder={placeholder} {...field} />
								) : type === 'select' ? (
									<Select onValueChange={field.onChange} value={field.value?.toString() || ''}>
										<SelectTrigger>
											<SelectValue placeholder={placeholder || `Select ${label.toLowerCase()}`} />
										</SelectTrigger>
										<SelectContent>
											{options?.map((option) => (
												<SelectItem key={option.value} value={option.value.toString()}>
													{option.label}
												</SelectItem>
											))}
										</SelectContent>
									</Select>
								) : type === 'boxes' ? (
									<div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
										{options?.map((option) => (
											<BoxOption key={option.value} option={option} isSelected={field.value === option.value} onClick={() => field.onChange(option.value)} />
										))}
									</div>
								) : type === 'checkbox' ? (
									<div className="flex items-center space-x-2">
										<Checkbox checked={Boolean(field.value)} onCheckedChange={field.onChange} />
									</div>
								) : type === 'multi-checkbox' ? (
									<div className="grid grid-cols-2 gap-4">
										{options?.map((option) => (
											<div key={option.value} className="flex items-center space-x-2">
												<Checkbox
													id={`${name}-${option.value}`}
													checked={Array.isArray(field.value) ? field.value.includes(option.value) : false}
													onCheckedChange={(checked) => {
														const currentValues = Array.isArray(field.value) ? field.value : [];
														const newValue = checked ? [...currentValues, option.value] : currentValues.filter((v: unknown) => v !== option.value);
														field.onChange(newValue);
													}}
												/>
												<label htmlFor={`${name}-${option.value}`} className="text-sm font-medium">
													{option.label}
												</label>
											</div>
										))}
									</div>
								) : null}
							</FormControl>
							{description && <FormDescription>{description}</FormDescription>}
							<FormMessage className="-mt-1" />
						</FormItem>
					)}
				/>
			</div>
		);
	};

	const fieldsBySection = config.fields.reduce((acc, field) => {
		const section = field.section || 'default';
		if (!acc[section]) acc[section] = [];
		acc[section].push(field);
		return acc;
	}, {} as Record<string, FieldConfig[]>);
	const onSubmit: SubmitHandler<T> = async (data) => {
		setHasSubmitted(true);
		setIsSubmitting(true);
		setSubmissionResult(null);

		const startTime = Date.now();

		try {
			const response = await fetch(config.apiEndpoint, {
				method: config.method || 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify(data),
			});

			const result: unknown = await response.json();

			if (!response.ok) {
				const errorResult = result as { message?: string };
				throw new Error(errorResult.message || 'Error during submission');
			}

			const elapsedTime = Date.now() - startTime;
			const remainingTime = Math.max(0, 3000 - elapsedTime);

			await new Promise((resolve) => setTimeout(resolve, remainingTime));

			const successResult: ApiResponse = {
				success: true,
				message: config.successMessage || 'Data saved successfully',
				data: result,
			};

			setSubmissionResult(successResult);
			config.onSuccess?.(data, result);
			if (config.reset !== false) form.reset();
			setHasSubmitted(false);
		} catch (error) {
			const elapsedTime = Date.now() - startTime;
			const remainingTime = Math.max(0, 3000 - elapsedTime);

			await new Promise((resolve) => setTimeout(resolve, remainingTime));

			const errorResult: ApiResponse = {
				success: false,
				message: error instanceof Error ? error.message : 'An error occurred',
			};

			setSubmissionResult(errorResult);
			config.onError?.(error instanceof Error ? error : new Error('Unknown error'));
		} finally {
			setIsSubmitting(false);
		}
	};

	return (
		<div className={`w-full ${className}`}>
			{submissionResult?.success && (
				<div className="mb-6 border border-green-200 bg-green-50 p-4">
					<div className="flex gap-2 items-center">
						<div className="flex-shrink-0">
							<CircleCheck className="h-6 w-6 text-green-600" />
						</div>
						<div className="flex-1 min-w-0">
							<h3 className="text-sm font-semibold text-green-800">{config.successTitle}</h3>
						</div>
					</div>
				</div>
			)}
			{hasSubmitted && submissionResult && !submissionResult.success && (
				<div className="w-full mb-6 bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg">
					<div className="flex items-start gap-2">
						<CircleAlert className="h-5 w-5 flex-shrink-0 mt-0.5" />
						<div className="flex-1">
							<p className="font-medium">{config.errorMessage}</p>
						</div>
						<Button variant="ghost" size="sm" className="h-6 w-6 p-0 hover:bg-red-100 flex-shrink-0" onClick={() => setSubmissionResult(null)}>
							<X className="h-4 w-4" />
						</Button>
					</div>
				</div>
			)}
			<UiForm {...form}>
				<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
					{config.sections && config.sections.length > 0 ? (
						<div className="grid grid-cols-1 md:grid-cols-2 gap-8">
							{config.sections.map((section) => {
								const sectionFields = fieldsBySection[section.name] || [];
								const visibleFields = sectionFields.filter(shouldShowField);
								if (visibleFields.length === 0) return null;

								return (
									<div key={section.name} className="space-y-6 bg-white">
										<h2 className="text-xl font-semibold mb-2">{section.title}</h2>
										<Separator className="mb-6" />
										<div className={`grid gap-3 ${section.columns === 2 ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1'}`}>{visibleFields.map(renderField)}</div>
									</div>
								);
							})}
						</div>
					) : (
						<div className="grid grid-cols-1 md:grid-cols-2 gap-6">{config.fields.filter(shouldShowField).map(renderField)}</div>
					)}

					<div className="flex justify-end gap-2 pt-6 items-end">
						{config.reset !== false && (
							<Button
								variant="outline"
								type="button"
								onClick={() => {
									form.reset();
									setHasSubmitted(false);
									setSubmissionResult(null);
								}}
								className="cursor-pointer"
								disabled={isSubmitting}>
								{config.resetButtonText || 'Reset'}
							</Button>
						)}
						<Button type="submit" disabled={isSubmitting} className="min-w-32 gap-1 cursor-pointer">
							{isSubmitting ? (
								<>
									<Loader2 className="h-4 w-4 animate-spin" />
									{config.loadingText || 'Saving'}...
								</>
							) : (
								config.submitButtonText || 'Submit'
							)}
						</Button>
					</div>
				</form>
			</UiForm>
		</div>
	);
}
