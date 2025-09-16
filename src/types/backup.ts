export interface BackupConfig {
	test: {
		s3: {
			bucket: string;
			endpoint: string;
			region: string;
			secretName: string;
			accessKeyIdSecretKeyRef: string;
			secretAccessKeySecretKeyRef: string;

		};
		media: {
			claimName: string;
		};
		api: {
			url: string;
		};
	};
	prod: {
		s3: {
			bucket: string;
			endpoint: string;
			region?: string;
			secretName: string;
			accessKeyIdSecretKeyRef?: string;
			secretAccessKeySecretKeyRef?: string;
		};
		media: {
			claimName: string;
		};
		api: {
			url: string;
		};
	};
}

export type BackupEnvironment = "test" | "prod";

export interface SiteBackupConfig {
	dbName: string | null;
	dbRef: string | null;
	urlSource: string | null;
}

export interface EnvironmentBackupConfig {
	s3: {
		bucket: string;
		endpoint: string;
		region: string;
		secretName: string;
		accessKeyIdSecretKeyRef: string;
		secretAccessKeySecretKeyRef: string;
	};
	api: {
		url: string;
	};
}
