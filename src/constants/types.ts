import { ArchiveIcon, BoxIcon, CloudIcon, ExternalLinkIcon, TimerIcon } from 'lucide-react';

export const TYPES = {
	KUBERNETES: {
		NAME: 'Kubernetes',
		LABEL: { fr: 'Kubernetes', en: 'Kubernetes' },
		ICON: CloudIcon,
		COLOR: '#ff1493',
	},
	EXTERNAL: {
		NAME: 'External',
		LABEL: { fr: 'Externe', en: 'External' },
		ICON: ExternalLinkIcon,
		COLOR: '#ffa500',
	},
	LAMP: {
		NAME: 'LAMP',
		LABEL: { fr: 'LAMP', en: 'LAMP' },
		ICON: BoxIcon,
		COLOR: '#9400d3',
	},
	TEMPORARY: {
		NAME: 'Temporary',
		LABEL: { fr: 'Temporaire', en: 'Temporary' },
		ICON: TimerIcon,
		COLOR: '#32cd32',
	},
	ARCHIVED: {
		NAME: 'Archived',
		LABEL: { fr: 'Archivé', en: 'Archived' },
		ICON: ArchiveIcon,
		COLOR: '#8b4513',
	},
};
