export const PERMISSIONS = {
	SITE: {
		READ: 'site:read',
		CREATE: 'site:create',
		UPDATE: 'site:update',
		DELETE: 'site:delete',
		LIST: 'site:list',
	},
	TAGS: {
		READ: 'tags:read',
		CREATE: 'tags:create',
		UPDATE: 'tags:update',
		DELETE: 'tags:delete',
		LIST: 'tags:list',
		ASSOCIATE: 'tags:associate',
		DISSOCIATE: 'tags:dissociate',
	},
	LOGS: {
		LISTS: 'logs:lists',
	},
	REDIRECTIONS: {
		READ: 'redirections:read',
		CREATE: 'redirections:create',
		UPDATE: 'redirections:update',
		DELETE: 'redirections:delete',
		LIST: 'redirections:list',
	},
	THEME: {
		CREATE: 'theme:create',
		DELETE: 'theme:delete',
		LIST: 'theme:list',
	},
};
