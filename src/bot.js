const { chromium } = require('playwright');

async function book(page, il_ragazzo, hour) {
  await page.goto('https://orari-be.divsi.unimi.it/PortaleEasyPlanning/biblio/index.php?include=form');
  
  const sede = await page.$('#area');
  await sede.selectOption("25")
  
  const servizio = await page.$('#servizio')
  await servizio.selectOption("50")

  console.log(`${il_ragazzo.cognome_nome} prenotato alle ${hour}`)
}

async function main () {

  let i_ragazzi = paramsFile;
  const ORE_DIECI = '10:00'
  const ORE_QUINDICI = '15:00'

  const browser = await chromium.launch({headless: false, slowMo: 100});
  const page = await browser.newPage();

  console.log("STARTED\n")

  for(const il_ragazzo of i_ragazzi) {
    await book(page, il_ragazzo, ORE_DIECI)
    await book(page, il_ragazzo, ORE_QUINDICI)
  }

  await browser.close();
}

main()