const addProfessor = async (page) => {
  // Go on tags page
  await page.$eval('a[href="/professors"]', e => e.click());

  // Fill form
  await page.type('input[name="sciper"]', '188475');
  
  // Submit Form
  const submitButton = await page.$('button[type="submit"]');
  await submitButton.click('#search-button');
  
  await page.waitFor(2000);

  const stringIsIncluded = await page.evaluate(() => {
    const string = '188475';
    const selector = 'li';
    return document.querySelector(selector).innerText.includes(string);
  });

  console.log(stringIsIncluded);

  console.log("Add new professor OK");
  await page.waitFor(2000);
}

const deleteProfessor = async (page) => {
  console.log("Delete professor OK");
  await page.waitFor(1000);
}

const updateLDAPProfessors = async (page) => {
  console.log("Update professor OK");
}

module.exports.addProfessor = addProfessor;
module.exports.deleteProfessor = deleteProfessor;
module.exports.updateProfessors = updateLDAPProfessors;