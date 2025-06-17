import { ArchiveIcon, BoxIcon, CloudIcon, ExternalLinkIcon, TimerIcon } from 'lucide-react';
import type { InfrastructureType } from '@/types/infrastructure';

export const INFRASTRUCTURES = {
	KUBERNETES: {
		NAME: 'Kubernetes',
		LABEL: { fr: 'Kubernetes', en: 'Kubernetes' },
		ICON: CloudIcon,
		COLOR: '#000000', // '#3a85c7',
		CREATED: true,
		PERSISTENCE: 'kubernetes',
	},
	EXTERNAL: {
		NAME: 'External',
		LABEL: { fr: 'Externe', en: 'External' },
		ICON: ExternalLinkIcon,
		COLOR: '#000000', // '#5c8a8a',
		CREATED: true,
		PERSISTENCE: 'database',
	},
	LAMP: {
		NAME: 'LAMP',
		LABEL: { fr: 'LAMP', en: 'LAMP' },
		ICON: BoxIcon,
		COLOR: '#000000', // '#9d5fcf',
		CREATED: true,
		PERSISTENCE: 'database',
	},
	TEMPORARY: {
		NAME: 'Temporary',
		LABEL: { fr: 'Temporaire', en: 'Temporary' },
		ICON: TimerIcon,
		COLOR: '#000000', // '#e67043',
		CREATED: false,
		PERSISTENCE: 'none',
	},
	ARCHIVED: {
		NAME: 'Archived',
		LABEL: { fr: 'Archivé', en: 'Archived' },
		ICON: ArchiveIcon,
		COLOR: '#000000', // '#b5774a',
		CREATED: false,
		PERSISTENCE: 'database',
	},
} as const satisfies Record<string, InfrastructureType>;

export const getInfrastructureByName = (name: string): InfrastructureType | undefined => {
	return Object.values(INFRASTRUCTURES).find((infra) => infra.NAME === name);
};

export const getInfrastructuresByPersistence = (persistence: InfrastructureType['PERSISTENCE']): InfrastructureType[] => {
	return Object.values(INFRASTRUCTURES).filter((infra) => infra.PERSISTENCE === persistence);
};

export const getCreatableInfrastructures = (): InfrastructureType[] => {
	return Object.values(INFRASTRUCTURES).filter((infra) => infra.CREATED);
};
