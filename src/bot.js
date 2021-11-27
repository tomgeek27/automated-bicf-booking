const { chromium } = require('playwright');
const fs = require('fs');

const { hideBin } = require('yargs/helpers')
const yargs = require('yargs');

const path = require("path");

let res;

const services = {
  PIANOTERRA: '92',
  PIANOTERRA_SALOTTINO: '91',
  LASTMINUTE: '50',
  LASTMINUTE2: '26'
}

const PERIODO = {
  MATTINA: 0,
  POMERIGGIO: 1
}

const ORARIO_DEAFULT = ['10:00', '15:00']

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

async function book(page, il_ragazzo, index_hours, service) {
  let hour = ORARIO_DEAFULT[index_hours]
  switch(index_hours) {
    case PERIODO.MATTINA:
      hour = il_ragazzo.ora_mattina ?? hour
      break
    case PERIODO.POMERIGGIO:
      hour = il_ragazzo.ora_pomeriggio ?? hour
      break
  }

  print(`Prenotazione in corso: ${il_ragazzo.cognome_nome}, ${hour}, ${getKeyByValue(services, service)}`, `<div style="font-size: 18px; color: grey">`, `</div>`)
  await page.goto(URL);
  
  await page.waitForLoadState("networkidle")
  
  const sede = await page.$('#area');
  await sede.selectOption("25")
  
  const servizio = await page.$('#servizio')
  await servizio.selectOption(`${service}`)

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
    print(`---> ${il_ragazzo.cognome_nome} posto gia' prenotato o posti finiti (ore: ${hour})`, `<div style="font-size: 20px">`, `</div>`)
    return false
  }

  await page.waitForLoadState("networkidle")
  await page.click("#conferma")

  print(`---> ${il_ragazzo.cognome_nome} prenotato alle ${hour}`, `<div style="font-size: 20px">`, `</div>`)
  return true
}

function print(str, htmlTags_open, htmlTags_close) {
  if(res != null)
    res.write(htmlTags_open + str + htmlTags_close)
  console.log(str)
}

function endResponse() {
  if(res != null)
    res.end()
}

async function main (res_, lm) {
  const argv = yargs(hideBin(process.argv)).argv
  res = res_;
  let params;
  if(fs.existsSync(path.resolve(__dirname, "./params.json"))) {
    console.log("File detected: ", path.resolve(__dirname, "./params.json"))
    params = fs.readFileSync(path.resolve(__dirname, "./params.json"))
  }

  //process.env.I_RAGAZZI is an env var in heroku that represent all the users to book
  let i_ragazzi = JSON.parse(process.env.I_RAGAZZI || params); 
  console.log(i_ragazzi)

  if (argv.lm || lm) {
    service = [services.LASTMINUTE, services.LASTMINUTE2];
    print('Last minute booking..', `<div>`, `</div>`);
  } else {
    service = [services.PIANOTERRA, services.PIANOTERRA_SALOTTINO];
    print('Normal booking..', `<div>`, `</div>`);
  }

  const browser = await chromium.launch({headless: true, slowMo: 0, chromiumSandbox: false});
  const page = await browser.newPage();
  for(const il_ragazzo of i_ragazzi) {
    bookingMorning = await book(page, il_ragazzo, PERIODO.MATTINA, service[0])
    if(!bookingMorning)
      await book(page, il_ragazzo, PERIODO.MATTINA, service[1])
    
    bookingAfternoon = await book(page, il_ragazzo, PERIODO.POMERIGGIO, service[0])
    if(!bookingAfternoon)
      await book(page, il_ragazzo, PERIODO.POMERIGGIO, service[1])
  }

  await browser.close();
  endResponse()
}

//main()

module.exports = main