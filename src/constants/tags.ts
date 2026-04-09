import { Building2, GraduationCap, Microscope, University } from "lucide-react";
import type { TagCategoryEnumType } from "@/types/tag";

export const TAG_CATEGORIES = {
	DOCTORAL_PROGRAM: {
		NAME: "doctoral-program",
		ICON: GraduationCap,
		COLOR: "#3B82F6",
		LABEL: {
			en: "Doctoral Program",
			fr: "Programme doctoral",
		},
	},
	FIELD_OF_RESEARCH: {
		NAME: "field-of-research",
		ICON: Microscope,
		COLOR: "#10B981",
		LABEL: {
			en: "Field of Research",
			fr: "Domaine de recherche",
		},
	},
	FACULTY: {
		NAME: "faculty",
		ICON: Building2,
		COLOR: "#8B5CF6",
		LABEL: {
			en: "Faculty",
			fr: "Faculté",
		},
	},
	INSTITUTE: {
		NAME: "institute",
		ICON: University,
		COLOR: "#F59E0B",
		LABEL: {
			en: "Institute",
			fr: "Institut",
		},
	},
} as const;

export const TAG_CATEGORIES_VALUES = Object.values(TAG_CATEGORIES).map((tag) => tag.NAME) as [TagCategoryEnumType, ...TagCategoryEnumType[]];
