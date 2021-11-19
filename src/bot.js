const { chromium } = require('playwright');
const fs = require('fs');

const { hideBin } = require('yargs/helpers')
const yargs = require('yargs');

async function book(page, il_ragazzo, hour, service) {
  await page.goto('https://orari-be.divsi.unimi.it/PortaleEasyPlanning/biblio/index.php?include=form');
  
  const sede = await page.$('#area');
  await sede.selectOption("25")
  
  const servizio = await page.$('#servizio')
  await servizio.selectOption(`${service}`)
  
  await page.waitForLoadState("networkidle")

  if(service == 91 || service == 92) {
    let now = new Date()
    now.setDate(new Date().getDate() + 3)
    await page.click(".input-group-addon")
    await page.click(`text=${now.getDate()}`)
  }

  await page.type("#codice_fiscale", il_ragazzo.codice_fiscale)
  await page.type("#cognome_nome", il_ragazzo.cognome_nome)
  await page.type("#email", il_ragazzo.email)  
  
  await page.click("#verify")

  await page.waitForLoadState("networkidle")
  try {
    const orario = await page.waitForSelector(`text=${hour}`, {
      timeout: 1000
    })
    const orarioClassName = await orario.getAttribute("class")
    if(orarioClassName.trim() != "slot_available") {
      throw 'Already booked'
    }

    await orario.click()
  } catch (err) {
    console.error(`${il_ragazzo.cognome_nome} posto gia' prenotato o posti finiti (ore: ${hour})`)
    return
  }

  await page.waitForLoadState("networkidle")
  await page.click("#conferma")

  console.log(`${il_ragazzo.cognome_nome} prenotato alle ${hour}`)
}

async function main () {
  const argv = yargs(hideBin(process.argv)).argv
  let paramsFile = fs.readFileSync('src/params.json')
  let i_ragazzi = JSON.parse(paramsFile);
  console.log(i_ragazzi)

  if (argv.lm) {
    service = 50;
    console.log('Last minute booking..');
  } else {
    service = 91;
    console.log('Normal booking..');
  }

  const ORE_DIECI = '10:00'
  const ORE_QUINDICI = '15:00'

  const browser = await chromium.launch({headless: true, slowMo: 0});
  const page = await browser.newPage();

  for(const il_ragazzo of i_ragazzi) {
    await book(page, il_ragazzo, ORE_DIECI, service)
    await book(page, il_ragazzo, ORE_QUINDICI, service)
  }

  await browser.close();
}

main()