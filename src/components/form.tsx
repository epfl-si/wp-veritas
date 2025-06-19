"use client";
/* eslint no-unused-vars: "off" */

import { useState, useEffect, useRef } from "react";
import { useForm, SubmitHandler, FieldValues, Path, DefaultValues } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FormField, Form as UiForm, FormItem, FormLabel, FormControl, FormDescription, FormMessage } from "@/components/ui/form";
import { Separator } from "@/components/ui/separator";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CircleAlert, CircleCheck, Loader2, X, ChevronDown } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

export type FieldType = "text" | "email" | "password" | "number" | "textarea" | "select" | "checkbox" | "multi-checkbox" | "multiselect" | "boxes";

export interface SelectOption {
	value: string | number;
	label: string;
	color?: string;
	icon?: React.ComponentType<{ className?: string }> | string;
}

export interface FieldCondition {
	field: string;
	operator: "equals" | "includes" | "not_equals" | "not_includes" | "regex" | "not_regex";
	value: unknown;
	type?: "display" | "default" | "disabled";
	defaultValue?: unknown;
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
	disabled?: boolean;
	width?: "half" | "full";
	section?: string;
}

export interface SectionConfig {
	name: string;
	title: string;
	description?: string;
	columns?: 1 | 2;
	conditions?: FieldCondition[];
}

export interface FormConfig<T extends FieldValues> {
	schema: z.ZodType<T>;
	fields: FieldConfig[];
	sections?: SectionConfig[];
	defaultValues?: DefaultValues<T>;
	apiEndpoint: string;
	method?: "POST" | "PUT" | "PATCH";
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

export default function Form<T extends FieldValues>({ config, className = "" }: ReusableFormProps<T>) {
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [submissionResult, setSubmissionResult] = useState<ApiResponse | null>(null);
	const [hasSubmitted, setHasSubmitted] = useState(false);
	const appliedDefaults = useRef<Set<string>>(new Set());

	const form = useForm<T>({
		resolver: zodResolver(config.schema as never),
		defaultValues: config.defaultValues,
		mode: "onSubmit",
		reValidateMode: "onChange",
	});

	const watchedValues = form.watch();

	const evaluateCondition = (condition: FieldCondition): boolean => {
		const fieldValue = watchedValues[condition.field as keyof T];
		const fieldValueStr = String(fieldValue || "");

		switch (condition.operator) {
			case "equals":
				return fieldValue === condition.value;
			case "not_equals":
				return fieldValue !== condition.value;
			case "includes":
				return Array.isArray(fieldValue) ? fieldValue.includes(condition.value) : false;
			case "not_includes":
				return Array.isArray(fieldValue) ? !fieldValue.includes(condition.value) : true;
			case "regex": {
				try {
					const regex = typeof condition.value === "string" ? new RegExp(condition.value) : condition.value instanceof RegExp ? condition.value : null;
					return regex ? regex.test(fieldValueStr) : false;
				} catch {
					return false;
				}
			}
			case "not_regex": {
				try {
					const regex = typeof condition.value === "string" ? new RegExp(condition.value) : condition.value instanceof RegExp ? condition.value : null;
					return regex ? !regex.test(fieldValueStr) : true;
				} catch {
					return true;
				}
			}
			default:
				return true;
		}
	};

	const shouldShowField = (field: FieldConfig): boolean => {
		if (!field.conditions || field.conditions.length === 0) return true;

		return field.conditions.filter((condition) => !condition.type || condition.type === "display").every(evaluateCondition);
	};

	const shouldDisableField = (field: FieldConfig): boolean => {
		if (field.disabled) return true;
		if (!field.conditions || field.conditions.length === 0) return false;

		return field.conditions.filter((condition) => condition.type === "disabled").some(evaluateCondition);
	};

	const getConditionalDefault = (field: FieldConfig): unknown => {
		if (!field.conditions || field.conditions.length === 0) return undefined;

		const defaultCondition = field.conditions.filter((condition) => condition.type === "default").find(evaluateCondition);

		return defaultCondition?.defaultValue;
	};

	const isValueUnset = (value: unknown, fieldType: FieldType): boolean => {
		if (fieldType === "checkbox") {
			return value === undefined;
		}
		if (fieldType === "multi-checkbox" || fieldType === "multiselect") {
			return value === undefined || (Array.isArray(value) && value.length === 0);
		}

		return value === undefined || value === "";
	};

	useEffect(() => {
		config.fields.forEach((field) => {
			const conditionalDefault = getConditionalDefault(field);
			if (conditionalDefault !== undefined) {
				const currentValue = form.getValues(field.name as Path<T>);
				const fieldKey = `${field.name}-${JSON.stringify(conditionalDefault)}`;

				if (isValueUnset(currentValue, field.type) && !appliedDefaults.current.has(fieldKey)) {
					form.setValue(field.name as Path<T>, conditionalDefault as never);
					appliedDefaults.current.add(fieldKey);
				}
			}
		});
	}, [watchedValues, config.fields, form]);

	useEffect(() => {
		const subscription = form.watch(() => {
			const currentValues = form.getValues();
			const isFormReset = Object.keys(currentValues).every((key) => {
				const value = currentValues[key as keyof typeof currentValues];
				return isValueUnset(value, config.fields.find((f) => f.name === key)?.type || "text");
			});

			if (isFormReset) {
				appliedDefaults.current.clear();
			}
		});

		return () => subscription.unsubscribe();
	}, [form, config.fields]);

	const shouldShowSection = (section: SectionConfig): boolean => {
		if (!section.conditions || section.conditions.length === 0) return true;
		return section.conditions.filter((condition) => !condition.type || condition.type === "display").every(evaluateCondition);
	};

	const BoxOption = ({ option, isSelected, onClick, disabled }: { option: SelectOption; isSelected: boolean; onClick: () => void; disabled?: boolean }) => {
		const IconComponent = option.icon;
		return (
			<div
				className={cn("relative cursor-pointer mb-3 border-3 p-4 transition-all duration-200", disabled ? "opacity-50 cursor-not-allowed" : "hover:shadow-md", isSelected ? "border-primary bg-primary/5 shadow-sm" : "border-gray-200 hover:border-gray-300")}
				style={{
					borderColor: isSelected && option.color ? option.color : undefined,
					backgroundColor: isSelected && option.color ? `${option.color}10` : undefined,
				}}
				onClick={disabled ? undefined : onClick}>
				<div className="flex flex-col items-center text-center space-y-2">
					{IconComponent && (
						<div
							className="size-9 flex items-center justify-center"
							style={{
								backgroundColor: option.color ? `${option.color}20` : "#f3f4f6",
								color: option.color || "#6b7280",
							}}>
							{typeof IconComponent === "string" ? <span className="text-lg">{IconComponent}</span> : <IconComponent className="w-5 h-5" />}
						</div>
					)}
					<span className={cn("text-sm font-medium transition-colors", isSelected ? "text-gray-900" : "text-gray-600")}>{option.label}</span>
				</div>
			</div>
		);
	};

	const MultiSelectField = ({ options, value, onChange, disabled, placeholder = "Select options..." }: { options: SelectOption[]; value: (string | number)[]; onChange: (value: (string | number)[]) => void; disabled?: boolean; placeholder?: string }) => {
		const [isOpen, setIsOpen] = useState(false);

		const handleOptionToggle = (optionValue: string | number, e?: React.MouseEvent) => {
			e?.stopPropagation();
			if (disabled) return;
			const newValue = value.includes(optionValue) ? value.filter((v) => v !== optionValue) : [...value, optionValue];
			onChange(newValue);
		};

		const handleRemoveItem = (optionValue: string | number, e: React.MouseEvent) => {
			e.stopPropagation();
			if (disabled) return;
			const newValue = value.filter((v) => v !== optionValue);
			onChange(newValue);
		};

		const selectedOptions = options.filter((option) => value.includes(option.value));

		return (
			<div className="w-full">
				<Popover open={isOpen} onOpenChange={setIsOpen}>
					<PopoverTrigger asChild>
						<Button variant="outline" className={cn("w-full h-auto min-h-10 py-0 justify-between text-left font-normal", disabled && "cursor-not-allowed opacity-50")} disabled={disabled}>
							<div className="flex-1 min-w-0">
								{selectedOptions.length === 0 ? (
									<span className="text-muted-foreground">{placeholder}</span>
								) : (
									<div className="flex flex-wrap gap-1">
										{selectedOptions.map((option) => {
											const IconComponent = option.icon;
											return (
												<div
													key={option.value}
													className="flex items-center space-x-1 bg-gray-100 border rounded px-1.5 py-0.5 text-xs"
													style={{
														borderColor: option.color || "#e5e7eb",
														backgroundColor: option.color ? `${option.color}15` : "#f3f4f6",
													}}>
													{IconComponent && (
														<div
															className="size-3 flex items-center justify-center rounded-sm"
															style={{
																backgroundColor: option.color ? `${option.color}30` : "#e5e7eb",
																color: option.color || "#6b7280",
															}}>
															{typeof IconComponent === "string" ? <span className="text-xs">{IconComponent}</span> : <IconComponent className="w-2 h-2" />}
														</div>
													)}
													<span className="font-medium truncate max-w-20">{option.label}</span>
													{!disabled && (
														<button type="button" onClick={(e) => handleRemoveItem(option.value, e)} className="cursor-pointer p-0.5 transition-colors ml-0.5">
															<X className="w-2 h-2" />
														</button>
													)}
												</div>
											);
										})}
									</div>
								)}
							</div>
							<ChevronDown className="h-4 w-4 opacity-50 flex-shrink-0 ml-2" />
						</Button>
					</PopoverTrigger>
					<PopoverContent className="p-0" style={{ width: "var(--radix-popover-trigger-width)" }} align="start">
						<div className="max-h-64 overflow-y-auto">
							{options.map((option) => {
								const IconComponent = option.icon;
								return (
									<div key={option.value} className="flex items-center space-x-2 p-3 hover:bg-gray-50 cursor-pointer" onClick={(e) => handleOptionToggle(option.value, e)}>
										<Checkbox id={`option-${option.value}`} checked={value.includes(option.value)} onCheckedChange={() => handleOptionToggle(option.value)} />
										<div className="flex items-center space-x-2 flex-1">
											{IconComponent && (
												<div
													className="size-6 flex items-center justify-center"
													style={{
														backgroundColor: option.color ? `${option.color}20` : "#f3f4f6",
														color: option.color || "#6b7280",
													}}>
													{typeof IconComponent === "string" ? <span className="text-sm">{IconComponent}</span> : <IconComponent className="w-4 h-4" />}
												</div>
											)}
											<label htmlFor={`option-${option.value}`} className="text-sm font-medium leading-none cursor-pointer flex-1">
												{option.label}
											</label>
										</div>
									</div>
								);
							})}
							{options.length === 0 && <div className="p-4 text-sm text-gray-500 text-center">No options available</div>}
						</div>
					</PopoverContent>
				</Popover>
			</div>
		);
	};

	const renderField = (fieldConfig: FieldConfig) => {
		const { name, type, label, placeholder, description, options, width = "half" } = fieldConfig;
		const isDisabled = shouldDisableField(fieldConfig);

		return (
			<div key={name} className={`min-h-[85px] flex flex-col ${width === "full" ? "col-span-full" : ""}`}>
				<FormField
					control={form.control}
					name={name as Path<T>}
					render={({ field }) => (
						<FormItem>
							{type !== "checkbox" && type !== "multi-checkbox" && <FormLabel className={cn("text-sm font-medium", isDisabled && "text-muted-foreground")}>{label}</FormLabel>}
							<FormControl>
								{type === "text" || type === "email" || type === "password" ? (
									<Input className="h-10" type={type} placeholder={placeholder} disabled={isDisabled} {...field} />
								) : type === "number" ? (
									<Input
										type="number"
										className="h-10"
										placeholder={placeholder}
										disabled={isDisabled}
										value={field.value || ""}
										onChange={(e) => {
											const value = e.target.value === "" ? undefined : parseInt(e.target.value);
											field.onChange(value);
										}}
									/>
								) : type === "textarea" ? (
									<Textarea placeholder={placeholder} disabled={isDisabled} {...field} className="h-10" />
								) : type === "select" ? (
									<Select onValueChange={field.onChange} value={field.value?.toString() || ""} disabled={isDisabled}>
										<SelectTrigger className="w-full !h-10">
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
								) : type === "multiselect" ? (
									<MultiSelectField options={options || []} value={Array.isArray(field.value) ? field.value : []} onChange={field.onChange} disabled={isDisabled} />
								) : type === "boxes" ? (
									<div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
										{options?.map((option) => (
											<BoxOption key={option.value} option={option} isSelected={field.value === option.value} onClick={() => field.onChange(option.value)} disabled={isDisabled} />
										))}
									</div>
								) : type === "checkbox" ? (
									<div className="flex items-center space-x-2">
										<Checkbox checked={Boolean(field.value)} onCheckedChange={field.onChange} disabled={isDisabled} />
										<FormLabel className={cn(isDisabled && "text-muted-foreground")}>{label}</FormLabel>
									</div>
								) : type === "multi-checkbox" ? (
									<div className="grid grid-cols-2 gap-4">
										{options?.map((option) => (
											<div key={option.value} className="flex items-center space-x-2">
												<Checkbox
													id={`${name}-${option.value}`}
													checked={Array.isArray(field.value) ? field.value.includes(option.value) : false}
													disabled={isDisabled}
													onCheckedChange={(checked) => {
														const currentValues = Array.isArray(field.value) ? field.value : [];
														const newValue = checked ? [...currentValues, option.value] : currentValues.filter((v: unknown) => v !== option.value);
														field.onChange(newValue);
													}}
												/>
												<label htmlFor={`${name}-${option.value}`} className={cn("text-sm font-medium", isDisabled && "text-muted-foreground")}>
													{option.label}
												</label>
											</div>
										))}
									</div>
								) : null}
							</FormControl>
							{description && <FormDescription className={cn(isDisabled && "text-muted-foreground")}>{description}</FormDescription>}
							<FormMessage className="-mt-1" />
						</FormItem>
					)}
				/>
			</div>
		);
	};

	const fieldsBySection = config.fields.reduce((acc, field) => {
		const section = field.section || "default";
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
				method: config.method || "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify(data),
			});

			const result: unknown = await response.json();

			if (!response.ok) {
				const errorResult = result as { message?: string };
				throw new Error(errorResult.message || "Error during submission");
			}

			const elapsedTime = Date.now() - startTime;
			const remainingTime = Math.max(0, 3000 - elapsedTime);

			await new Promise((resolve) => setTimeout(resolve, remainingTime));

			const successResult: ApiResponse = {
				success: true,
				message: config.successMessage || "Data saved successfully",
				data: result,
			};

			setSubmissionResult(successResult);
			config.onSuccess?.(data, result);
			if (config.reset !== false) {
				form.reset();
				appliedDefaults.current.clear();
			}
			setHasSubmitted(false);
		} catch (error) {
			const elapsedTime = Date.now() - startTime;
			const remainingTime = Math.max(0, 3000 - elapsedTime);

			await new Promise((resolve) => setTimeout(resolve, remainingTime));

			const errorResult: ApiResponse = {
				success: false,
				message: error instanceof Error ? error.message : "An error occurred",
			};

			setSubmissionResult(errorResult);
			config.onError?.(error instanceof Error ? error : new Error("Unknown error"));
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
							{config.sections.filter(shouldShowSection).map((section) => {
								const sectionFields = fieldsBySection[section.name] || [];
								const visibleFields = sectionFields.filter(shouldShowField);
								if (visibleFields.length === 0) return null;

								return (
									<div key={section.name} className="space-y-6 bg-white">
										<h2 className="text-xl font-semibold mb-2">{section.title}</h2>
										<Separator className="mb-5" />
										<div className={`grid gap-x-3 ${section.columns === 2 ? "grid-cols-1 md:grid-cols-2" : "grid-cols-1"}`}>{visibleFields.map(renderField)}</div>
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
									appliedDefaults.current.clear();
									setHasSubmitted(false);
									setSubmissionResult(null);
								}}
								className="cursor-pointer"
								disabled={isSubmitting}>
								{config.resetButtonText || "Reset"}
							</Button>
						)}
						<Button type="submit" disabled={isSubmitting} className="min-w-32 gap-1 cursor-pointer">
							{isSubmitting ? (
								<>
									<Loader2 className="h-4 w-4 animate-spin" />
									{config.loadingText || "Saving"}...
								</>
							) : (
								config.submitButtonText || "Submit"
							)}
						</Button>
					</div>
				</form>
			</UiForm>
		</div>
	);
}
