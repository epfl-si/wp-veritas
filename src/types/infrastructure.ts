import { INFRASTRUCTURES } from '@/constants/infrastructures';
import { LucideIcon } from 'lucide-react';

export type InfrastructureType = {
	NAME: string;
	LABEL: {
		fr: string;
		en: string;
	};
	ICON: LucideIcon;
	COLOR: string;
	CREATED?: boolean;
	PERSISTENCE?: string;
};

export type InfrastructureEnumType = (typeof INFRASTRUCTURES)[keyof typeof INFRASTRUCTURES]['NAME'];
