import { ArchiveIcon, BoxIcon, CloudIcon, ExternalLinkIcon, HourglassIcon, TrashIcon } from 'lucide-react';

export const TYPES = {
	KUBERNETES: {
		NAME: 'Kubernetes',
		LABEL: { fr: 'Kubernetes', en: 'Kubernetes' },
		ICON: CloudIcon,
	},
	EXTERNAL: {
		NAME: 'External',
		LABEL: {
			fr: 'Externe',
			en: 'External',
		},
		ICON: ExternalLinkIcon,
	},
	LAMP: {
		NAME: 'LAMP',
		LABEL: {
			fr: 'LAMP',
			en: 'LAMP',
		},
		ICON: BoxIcon,
	},

	TEMPORARY: {
		NAME: 'Temporary',
		LABEL: {
			fr: 'Temporaire',
			en: 'Temporary',
		},
		ICON: HourglassIcon,
	},
	ARCHIVED: {
		NAME: 'Archived',
		LABEL: {
			fr: 'Archivé',
			en: 'Archived',
		},
		ICON: ArchiveIcon,
	},
	DELETED: {
		NAME: 'Deleted',
		LABEL: {
			fr: 'Supprimé',
			en: 'Deleted',
		},
		ICON: TrashIcon,
	},
};
