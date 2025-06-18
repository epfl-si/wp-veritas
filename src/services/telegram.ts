import { getUser } from './auth';

function escapeMarkdownV2(text: string): string {
	return text.replace(/[_*[\]()~`>#+=|{}.!-]/g, '\\$&');
}

async function sendToAllChats(text: string): Promise<void> {
	const token = process.env.TELEGRAM_BOT_TOKEN;
	const telegramIds = process.env.TELEGRAM_IDS;

	if (!token) {
		throw new Error('Telegram bot token is not set');
	}

	if (!telegramIds) {
		throw new Error('Telegram IDs are not set');
	}

	const chatIds = telegramIds.split(',').map((id) => id.trim());
	const url = `https://api.telegram.org/bot${token}/sendMessage`;

	const promises = chatIds.map(async (chatId) => {
		const body = JSON.stringify({
			chat_id: chatId,
			text: text,
			parse_mode: 'MarkdownV2',
			disable_web_page_preview: true,
		});

		const response = await fetch(url, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: body,
		});

		if (!response.ok) {
			const errorText = await response.text();
			throw new Error(`Failed to send message to ${chatId}: ${errorText}`);
		}
	});

	await Promise.all(promises);
}

export async function sendSiteCreatedMessage(siteUrl: string, infrastructure: string): Promise<void> {
	const user = await getUser();

	const escapedUrl = escapeMarkdownV2(siteUrl);
	const escapedInfrastructure = escapeMarkdownV2(infrastructure);
	const escapedUserName = escapeMarkdownV2(user.name);

	const text = `👀 *Pssst\\!* 👀\n[${escapedUserName}](https://people\\.epfl\\.ch/${user.userId}) as just created a new *${escapedInfrastructure}* site\\!\nIt is now live at: [${escapedUrl}](${siteUrl}) \\#siteCreated \\#next`;

	await sendToAllChats(text);
}

export async function sendSiteDeletedMessage(siteUrl: string, infrastructure: string): Promise<void> {
	const user = await getUser();

	const escapedUrl = escapeMarkdownV2(siteUrl);
	const escapedInfrastructure = escapeMarkdownV2(infrastructure);
	const escapedUserName = escapeMarkdownV2(user.name);

	const text = `⚠️ *Heads up\\!* ⚠️\n[${escapedUserName}](https://people\\.epfl\\.ch/${user.userId}) as just deleted a *${escapedInfrastructure}* site\\!\nSite at: [${escapedUrl}](${siteUrl}) has been removed \\#siteDeleted \\#next`;

	await sendToAllChats(text);
}
