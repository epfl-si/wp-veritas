const addSite = async (page) => {

  // Click on /add 
  await page.$eval('a[href="/add"]', e => e.click());

  // Fill form
  await page.type('input[name="url"]', 'https://www.epfl.ch/site-test');
  await page.type('input[name="title"]', 'Title TEST Site');
  const checkbox = await page.$('input[name="languages"]');
  checkbox.click();
  await page.type('input[name="unitId"]', '1234');

  // Submit Form
  const submitButton = await page.$('button[type="submit"]');
  await submitButton.click('#search-button'); 

  // Click on / to go on homepage
  await page.$eval('a[href="/"]', e => e.click());
  console.log("Add new site OK")
  await page.waitFor(2000);
}

const editSite = async (page) => {

  // Edit 
  let xpathEditButton = '//a[contains(@href,"https://www.epfl.ch/site-test")]/parent::td/parent::tr/descendant::button[text()="Éditer"]'
  let editButton = await page.$x(xpathEditButton);
  if (editButton.length > 0) {
    editButton[0].click();
  } else {
    throw new Error("Button not found");
  }
  await page.waitFor(1000);

  const titleSelector = 'input[name="title"]';

  // Click 3 times to select the input value
  const input = await page.$(titleSelector);
  await input.click({ clickCount: 3 })

  // Change the Title field
  await page.type(titleSelector, 'EDIT');

  // Submit
  const submitButton = await page.$('button[type="submit"]');
  await submitButton.click('#search-button');

  // Check the title value
  const titleValue = await page.$eval(titleSelector, el => el.value);
  let msg = "Edit site";
  if (titleValue == 'EDIT') {
    msg += " OK";
  } else {
    msg += " KO";
  }

  await page.waitFor(1000);
  console.log(msg);
}

const deleteSite = async (page) => {
  
  let xpathDeleteButton = '//a[contains(@href,"https://www.epfl.ch/site-test")]/parent::td/parent::tr/descendant::button[text()="Supprimer"]'
  let deleteButton = await page.$x(xpathDeleteButton);
  
  if (deleteButton.length > 0) {
    console.log(">0")
    /*
    deleteButton[0].click();
    await popup.waitForSelector('[name="__CONFIRM__"]')
    const confirm = await popup.$('[name="__CONFIRM__"]')
    await popup.click('[name="__CONFIRM__"]')
    await page.waitFor(2000);
    */
    
  } else {
    throw new Error("Button not found");
  }
}

module.exports.addSite = addSite;
module.exports.editSite = editSite;
module.exports.deleteSite = deleteSite;