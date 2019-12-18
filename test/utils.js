const puppeteer = require('puppeteer');
const utils = require('./utils');

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
  //const url = 'http://wp-veritas.128.178.222.83.nip.io/';
  const url = 'http://localhost:3000/';
  await page.goto(url);
  await page.waitFor(1000);
  console.log("Go Home OK");
} 

/**
 * Tequila login
 * @param {*} page 
 */
const login = async (page) => {
  await page.type('#username', 'charmier');
  await utils.doScreenshot(page, 'username');
  await page.type('#password', 'L1nd2nattack');
  await utils.doScreenshot(page, 'pwd');
  await page.click('#loginbutton');
  await utils.doScreenshot(page, 'loginbutton');
  console.log("Login OK");
  await page.waitFor(5000);
}

const doScreenshot = async (page, fileName) => {
  // Screen shot
  await page.screenshot({path:`images/${fileName}.png`});
  console.log("Screenshot OK");
}

module.exports.config = config;
module.exports.goHome = goHome;
module.exports.login = login;
module.exports.doScreenshot = doScreenshot;