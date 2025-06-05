import { TagEnumType } from '@/types/tags';

export const TAGS = [
	{
		name: 'doctoral-program',
		label: {
			en: 'Doctoral Program',
			fr: 'Programme doctoral',
		},
	},
	{
		name: 'field-of-research',
		label: {
			en: 'Field of Research',
			fr: 'Domaine de recherche',
		},
	},
	{
		name: 'faculty',
		label: {
			en: 'Faculty',
			fr: 'Faculté',
		},
	},
	{
		name: 'institute',
		label: {
			en: 'Institute',
			fr: 'Institut',
		},
	},
];

export const TAG_TYPES = TAGS.map((tag) => tag.name) as [TagEnumType, ...TagEnumType[]];
