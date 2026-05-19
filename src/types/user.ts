export type UserRole = "admin" | "editor";

export interface UserSummary {
	userId: string;
	name: string;
	lastActivity: Date;
	role: UserRole;
	actionCount: number;
}
