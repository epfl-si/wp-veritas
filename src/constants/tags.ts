import { TagEnumType } from '@/types/tags';

export const TAG_TYPES = {
	DOCTORAL_PROGRAM: {
		NAME: 'doctoral-program',
		LABEL: {
			en: 'Doctoral Program',
			fr: 'Programme doctoral',
		},
	},
	FIELD_OF_RESEARCH: {
		NAME: 'field-of-research',
		LABEL: {
			en: 'Field of Research',
			fr: 'Domaine de recherche',
		},
	},
	FACULTY: {
		NAME: 'faculty',
		LABEL: {
			en: 'Faculty',
			fr: 'Faculté',
		},
	},
	INSTITUTE: {
		NAME: 'institute',
		LABEL: {
			en: 'Institute',
			fr: 'Institut',
		},
	},
} as const;

export const TAG_TYPE_VALUES = Object.values(TAG_TYPES).map((tag) => tag.NAME) as [TagEnumType, ...TagEnumType[]];
