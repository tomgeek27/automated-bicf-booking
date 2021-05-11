const { chromium, firefox, webkit } = require('playwright');

async function main () {
  const browser = await chromium.launch({headless: false, slowMo: 100});  // Or 'firefox' or 'webkit'.
  const page = await browser.newPage();
  await page.goto('https://orari-be.divsi.unimi.it/PortaleEasyPlanning/biblio/index.php?include=form');
  
  const sede = await page.$('#area');
  await sede.selectOption("25")
  
  const servizio = await page.$('#servizio')
  await servizio.selectOption("50")

  await (await page.$("#codice_fiscale")).type("VLNSML95L05F119C")
  await (await page.$("#cognome_nome")).type("Amadori Tommaso")
  await (await page.$("#email")).type("tommi27@live.it")

  await (await page.$("#verify")).click()
  await page.click('text=15:00');
  await page.click("#conferma")
  // other actions...
  await browser.close();
}

main()