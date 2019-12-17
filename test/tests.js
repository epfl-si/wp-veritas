const utils = require('./utils');
const site = require('./site');
const tag = require('./tag');
const professor = require('./professor');

(async () => {  
  const [browser, page] = await utils.config();
  
  await utils.goHome(page);
  await utils.doScreenshot(page, 'goHome');

  await utils.login(page);
  await utils.doScreenshot(page, 'login');
  /*
  await site.addSite(page);
  await utils.doScreenshot(page, 'addSite');

  await site.editSite(page);
  await utils.doScreenshot(page, 'editSite');

  await tag.addTag(page);
  await utils.doScreenshot(page, 'addTag');

  await tag.editTag(page);
  await utils.doScreenshot(page, 'editTag');
  */

  await professor.addProfessor(page);
  await utils.doScreenshot(page, 'addProfessor');

  //await site.deleteSite(page);

  await browser.close();
})();