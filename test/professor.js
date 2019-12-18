const goProfessorsPage = async (page) => {
  // Go on tags page
  await page.$eval('a[href="/professors"]', e => e.click());
  await page.waitFor(500);
  console.log("Go on professor page OK");
}

const addProfessor = async (page) => {
  // Fill form
  await page.type('input[name="sciper"]', '188475');
  
  // Submit Form
  const submitButton = await page.$('button[type="submit"]');
  await submitButton.click('#search-button');
  
  await page.waitFor(2000);

  await page.$eval('#\31 88475', e => console.log(e) );
  console.log(exist);
  //console.log(await page.$eval('188476'));
  //#\31 05782

  console.log("Add new professor OK");
}

const deleteProfessor = async (page) => {
  console.log("Delete professor OK");
  await page.waitFor(1000);
}

const updateProfessorsLDAPInfo = async (page) => {
  await page.$eval('#updateLDAPButton', e => e.click());
  await page.waitFor(3000);
  console.log("Update professor OK");
}

module.exports.goProfessorsPage = goProfessorsPage;
module.exports.addProfessor = addProfessor;
module.exports.deleteProfessor = deleteProfessor;
module.exports.updateProfessorsLDAPInfo = updateProfessorsLDAPInfo;