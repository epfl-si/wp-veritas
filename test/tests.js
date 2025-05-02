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

  let httpUrl = page.url();
  httpUrl = httpUrl.replace('https', 'http');
  console.log(httpUrl);

  await page.goto(httpUrl);
  await page.waitFor(1000);

  await professor.goProfessorsPage(page);
  await utils.doScreenshot(page, 'goProfessorPage');

  await professor.addProfessor(page);
  await utils.doScreenshot(page, 'addProfessor');
  /*

  await browser.close();
})();
