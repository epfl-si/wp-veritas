const addTag = async (page) => {

  // Go on tags page
  await page.$eval('a[href="/tags"]', e => e.click());

  // Fill form
  await page.type('input[name="name_fr"]', 'tag-fr-test');
  await page.type('input[name="name_en"]', 'tag-en-test');
  await page.type('input[name="url_fr"]', 'http://www.mvlchess.com/');
  await page.type('input[name="url_en"]', 'http://www.mvlchess.com/en/');
  
  // Submit Form
  const submitButton = await page.$('button[type="submit"]');
  await submitButton.click('#search-button'); 

  console.log("Add new tag OK");
  await page.waitFor(1000);
}

const editTag = async (page) => {

  // Edit 
  let xpathEditButton = '//td[contains(.,"tag-fr-test")]/parent::tr/descendant::button[text()="Éditer"]'
  let editButton = await page.$x(xpathEditButton);
  if (editButton.length > 0) {
    editButton[0].click();
  } else {
    throw new Error("Button not found");
  }

  await page.waitFor(1000);

  const nameFrSelector = 'input[name="name_fr"]';

  // Click 3 times to select the input value
  const input = await page.$(nameFrSelector);
  await input.click({ clickCount: 3 })

  // Change the Title field
  await page.type(nameFrSelector, 'EDIT');

  // Submit
  const submitButton = await page.$('button[type="submit"]');
  await submitButton.click('#search-button');
  await page.waitFor(1000);

  // Check the title value
  const nameFrValue = await page.$eval(nameFrSelector, el => el.value);
  let msg = "Edit tag";
  if (nameFrValue == 'EDIT') {
    msg += " OK";
  } else {
    msg += " KO";
  }
  console.log(msg);
  await page.waitFor(1000);
}

module.exports.addTag = addTag;
module.exports.editTag = editTag;