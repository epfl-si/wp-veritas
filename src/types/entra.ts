export interface EntraApplication {
	"App": {
		"id": string;
		"appId": string;
		"displayName": string;
		"spa": {
			"redirectUris": string[];
		};
	};
	"SP": {
		"id": string;
		"appId": string;
		"displayName": string;
		"replyUrls": string[];
	};
	"Secret": string;
	"AppConfigID": number;
}
