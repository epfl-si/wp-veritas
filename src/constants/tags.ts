import { TagEnumType } from '@/types/tag';
import { GraduationCap, Microscope, Building2, University } from 'lucide-react';

export const TAG_TYPES = {
	DOCTORAL_PROGRAM: {
		NAME: 'doctoral-program',
		ICON: GraduationCap,
		COLOR: '#3B82F6',
		LABEL: {
			en: 'Doctoral Program',
			fr: 'Programme doctoral',
		},
	},
	FIELD_OF_RESEARCH: {
		NAME: 'field-of-research',
		ICON: Microscope,
		COLOR: '#10B981',
		LABEL: {
			en: 'Field of Research',
			fr: 'Domaine de recherche',
		},
	},
	FACULTY: {
		NAME: 'faculty',
		ICON: Building2,
		COLOR: '#8B5CF6',
		LABEL: {
			en: 'Faculty',
			fr: 'Faculté',
		},
	},
	INSTITUTE: {
		NAME: 'institute',
		ICON: University,
		COLOR: '#F59E0B',
		LABEL: {
			en: 'Institute',
			fr: 'Institut',
		},
	},
} as const;

export const TAG_TYPE_VALUES = Object.values(TAG_TYPES).map((tag) => tag.NAME) as [TagEnumType, ...TagEnumType[]];
