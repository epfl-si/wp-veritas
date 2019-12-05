const puppeteer = require('puppeteer');

const config = async() => {
  const browser = await puppeteer.launch(
    { ignoreHTTPSErrors: true,devtools: false }
  );
  const page = await browser.newPage();
  await page.setViewport(
    { width: 1366, height: 1600 }
  )
  return [browser, page];
}

const goHome = async(page) => {
  const url = 'http://wp-veritas.128.178.222.83.nip.io/';
  await page.goto(url);
} 

/**
 * Tequila login
 * @param {*} page 
 */
const login = async (page) => {
  await page.type('#username', 'charmier');
  await page.type('#password', 'L1nd2nattack');
  await page.click('#loginbutton');
  console.log("Login OK");
  await page.waitFor(5000);
}

const doScreenshot = async (page) => {
  // Screen shot
  await page.screenshot({path:'example.png'});
  console.log("Screenshot OK");
}

module.exports.config = config;
module.exports.goHome = goHome;
module.exports.login = login;
module.exports.doScreenshot = doScreenshot;