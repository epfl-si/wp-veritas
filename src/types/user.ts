export type UserRole = "admin" | "editor" | "public";

export interface UserSummary {
	userId: string;
	name: string;
	lastActivity: Date;
	role: UserRole;
	actionCount: number;
}
