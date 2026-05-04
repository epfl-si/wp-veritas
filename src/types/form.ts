import type React from "react";
import type { DefaultValues, FieldValues, UseFormReturn } from "react-hook-form";
import type { z } from "zod";
import type { ServiceResponse } from "@/types/response";

export type FieldType = "text" | "email" | "password" | "number" | "textarea" | "select" | "checkbox" | "multi-checkbox" | "multiselect" | "boxes" | "url" | "search";

export interface SelectOption {
	value: string | number;
	label: string;
	color?: string;
	icon?: React.ComponentType<{ className?: string }> | string;
	default?: boolean;
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
	serverAction?: (data: T) => Promise<ServiceResponse<unknown>>;
	onSuccess?: (data: T, response: unknown) => void;
	onError?: (error: Error) => void;
	onFieldChange?: (fieldName: string, value: unknown) => void;
	onFormRef?: (ref: UseFormReturn<T>) => void;
	reset?: boolean;
	submitButtonText?: string;
	resetButtonText?: string;
	loadingText?: string;
	successTitle?: string;
	successMessage?: string;
	successActions?: Array<{
		label: string;
		url: (data: T, response: unknown) => string;
		icon?: React.ComponentType<{ className?: string }>;
	}>;
	errorMessage?: string;
}

export interface ReusableFormProps<T extends FieldValues> {
	config: FormConfig<T>;
	className?: string;
}
