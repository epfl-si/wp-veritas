import { INFRASTRUCTURES } from "@/constants/infrastructures";
import { LucideIcon } from "lucide-react";

export type InfrastructureType = {
	NAME: string;
	LABEL: {
		fr: string;
		en: string;
	};
	ICON: LucideIcon;
	COLOR: string;
	CREATED: boolean;
	PERSISTENCE: "kubernetes" | "database" | "none";
};

export type InfrastructureEnumType = (typeof INFRASTRUCTURES)[keyof typeof INFRASTRUCTURES]["NAME"];

export type KubernetesPersistenceType = "kubernetes";
export type DatabasePersistenceType = "database";
export type NonePersistenceType = "none";

export type PersistenceType = KubernetesPersistenceType | DatabasePersistenceType | NonePersistenceType;

export type KubernetesInfrastructure = Extract<InfrastructureType, { PERSISTENCE: KubernetesPersistenceType }>;
export type DatabaseInfrastructure = Extract<InfrastructureType, { PERSISTENCE: DatabasePersistenceType }>;
export type NoneInfrastructure = Extract<InfrastructureType, { PERSISTENCE: NonePersistenceType }>;

export type KubernetesInfrastructureName = "Kubernetes";
export type DatabaseInfrastructureName = "External" | "LAMP" | "Archived";
export type NoneInfrastructureName = "Temporary";

export type InfrastructureName = KubernetesInfrastructureName | DatabaseInfrastructureName | NoneInfrastructureName;
