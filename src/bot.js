const { chromium } = require('playwright');
const fs = require('fs');

const { hideBin } = require('yargs/helpers')
const yargs = require('yargs');

const path = require("path");

const services = {
  PIANOTERRA: '92',
  PIANOTERRA_SALOTTINO: '91',
  LASTMINUTE: '50',
  LASTMINUTE2: '26'
}

const URL = 'https://orari-be.divsi.unimi.it/PortaleEasyPlanning/biblio/index.php?include=form';

function getKeyByValue(object, value) {
  return Object.keys(object).find(key => object[key] === value);
}

function getNextDay(offset) {
  let t = new Date()
  t.setDate(new Date().getDate() + offset)
  t.setHours(1, 0, 0, 0)

  return t
}

async function book(page, il_ragazzo, hour, service) {
  console.log(`Prenotazione in corso: ${il_ragazzo.cognome_nome}, ${hour}, ${getKeyByValue(services, service)}`)
  await page.goto(URL);
  
  const sede = await page.$('#area');
  await sede.selectOption("25")
  
  const servizio = await page.$('#servizio')
  await servizio.selectOption(`${service}`)
  
  await page.waitForLoadState("networkidle")

  if(service == 91 || service == 92) {
    let newTime = getNextDay(3)
    await page.click(".input-group-addon")
    await(await page.$(`[data-date=\"${newTime.getTime()}\"]`)).click()
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
    console.error(`---> ${il_ragazzo.cognome_nome} posto gia' prenotato o posti finiti (ore: ${hour})`, '\n')
    return false
  }

  await page.waitForLoadState("networkidle")
  await page.click("#conferma")

  console.log(`---> ${il_ragazzo.cognome_nome} prenotato alle ${hour}`, '\n')
  return true
}

async function main () {
  const argv = yargs(hideBin(process.argv)).argv
  
  let paramsFile = fs.readFileSync(path.resolve(__dirname, "./params.json"))
  let i_ragazzi = JSON.parse(paramsFile);

  if (argv.lm) {
    service = [services.LASTMINUTE, services.LASTMINUTE2];
    console.log('Last minute booking..');
  } else {
    service = [services.PIANOTERRA, services.PIANOTERRA_SALOTTINO];
    console.log('Normal booking..');
  }

  const ORE_DIECI = '10:00'
  const ORE_QUINDICI = '15:00'

  const browser = await chromium.launch({headless: true, slowMo: 0});
  const page = await browser.newPage();
  for(const il_ragazzo of i_ragazzi) {
    bookingMorning = await book(page, il_ragazzo, ORE_DIECI, service[0])
    if(!bookingMorning)
      await book(page, il_ragazzo, ORE_DIECI, service[1])
    
    bookingAfternoon = await book(page, il_ragazzo, ORE_QUINDICI, service[0])
    if(!bookingAfternoon)
      await book(page, il_ragazzo, ORE_QUINDICI, service[1])
  }

  await browser.close();
}

main()