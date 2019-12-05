const utils = require('./utils');
const site = require('./site');

(async () => {  
  const [browser, page] = await utils.config();
  
  await utils.goHome(page);
  await utils.login(page);

  //await site.addSite(page);
  await site.editSite(page);
  //await site.deleteSite(page);

  await utils.doScreenshot(page);
  await browser.close();
})();