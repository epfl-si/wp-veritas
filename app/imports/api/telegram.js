/**
 * This is a very simple class to send text message to a Telegram user or group.
 * 
 * The variables WP_VERITAS_BOT_TOKEN and WP_VERITAS_ALERTS_TELEGRAM_IDS are 
 * passed as environment variable to the docker so that the secrets are kept
 * safe.
 * If the environment variables are not set or empty, this does nothing at all.
 * 
 * WP_VERITAS_BOT_TOKEN: the bot Token — chat with Telegram's @botFather to 
 * create one.
 * WP_VERITAS_ALERTS_TELEGRAM_IDS: user or group ID's to send message to. You
 * can use @get_id_bot to find out what's the one you'll need.
 * 
 */

const https = require('https');

class Telegram {

  static WP_VERITAS_BOT_TOKEN = process.env.WP_VERITAS_BOT_TOKEN || '';
  static WP_VERITAS_ALERTS_TELEGRAM_IDS = process.env.WP_VERITAS_ALERTS_TELEGRAM_IDS || '';

  static sendMessage(message) {
    if (Telegram.WP_VERITAS_BOT_TOKEN && Telegram.WP_VERITAS_ALERTS_TELEGRAM_IDS ) {
      // Be sure to URL encode the content of the message
      let urlEncodedMessage = encodeURIComponent(message);
      // For each recipients, send the message.
      // Note: they will only receive the messsage if they have alreay chatted 
      // with the bot, otherwise the bot won't be able to send message.
      Telegram.WP_VERITAS_ALERTS_TELEGRAM_IDS.split(',').forEach((id) => {
        https.get(`https://api.telegram.org/${Telegram.WP_VERITAS_BOT_TOKEN}/sendMessage?chat_id=${id}&text=${urlEncodedMessage}`, (res) => {
          // TODO: there's no need for noise here, check the status code
          //       and only output something if needed
          console.log('statusCode:', res.statusCode);
          // console.log('headers:', res.headers);

          res.on('data', (d) => {
            process.stdout.write(d);
          });
        
        }).on('error', (e) => {
          console.error(e);
        });
      })
    } else {
      // console.log("Telegram params not defined, nothing to do...");
    }
  }
}
export { Telegram };