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

const ORARIO_DEAFULT = '10:00'
const LAST_ORARIO = 18

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

function parseHourToInt(hour) {
  return parseInt(hour.substring(0, 2), 10)
}

async function book(page, il_ragazzo, service) {
  hour = il_ragazzo.ora ?? ORARIO_DEAFULT

  let num_ore = LAST_ORARIO - parseHourToInt(hour)

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

  let n_seconds = num_ore * 60 * 60
  await page.selectOption('#durata_servizio', `${n_seconds}`)

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

  if (argv.lm || lm) {
    service = [services.LASTMINUTE, services.LASTMINUTE2];
    print('Last minute booking..', `<div>`, `</div>`);
  } else {
    service = [services.PIANOTERRA, services.PIANOTERRA_SALOTTINO];
    print('Normal booking..', `<div>`, `</div>`);
    print(`[${getNextDay(3)}]`, `<div style="font-size: 18px; color: grey">`, `</div>`)
  }

  const browser = await chromium.launch({headless: false, slowMo: 100, chromiumSandbox: false});
  const page = await browser.newPage();
  for(const il_ragazzo of i_ragazzi) {
    bookingAttempt = await book(page, il_ragazzo, service[0])
    if(!bookingAttempt)
      await book(page, il_ragazzo, service[1])
    
  }

  await browser.close();
  endResponse()
}

//main()

module.exports = main