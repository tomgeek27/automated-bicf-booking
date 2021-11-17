const { chromium } = require('playwright');

const paramsFile = 
[
    {
        "cognome_nome": "Amadori Tommaso",
        "email": "tommi27@live.it",
        "codice_fiscale": "MDRTMS97T02F205Y"
    },
    {
        "cognome_nome": "Carmini Marco",
        "email": "marco9755@gmail.com",
        "codice_fiscale": "crmmrc97e05f205f"
    },
    // {
    //     "cognome_nome": "Fogacci Francesca",
    //     "email": "Francescafogacci1@gmail.com",
    //     "codice_fiscale": "FGCFNC97H48F205M"
    // },
    {
        "cognome_nome": "Pastore Piero",
        "email": "pastore7714@gmail.com",
        "codice_fiscale": "PSTPRI97E21L736V"
    },
    // {
    //     "cognome_nome": "Calcagni Paolo",
    //     "email": "paolo.calcagni@studenti.unimi.it",
    //     "codice_fiscale": "CLCPLA97A03G438J"
    // },
    {  
        "cognome_nome": "Ventura Rafael",
        "email": "rafaeldavid.venturapadilla@studenti.unimi.it",
        "codice_fiscale": "VNTRLD96R24Z505C"
    },
    // {
    //     "cognome_nome": "Pinese Gabriele",
    //     "email": "gabriele.pinese@studenti.unimi.it",
    //     "codice_fiscale": "PNSGRL97L19L872T"
    // },
    // {  
    //     "cognome_nome": "Dagri Massimiliano",
    //     "email": "massimiliano.dagri@studenti.unimi.it",
    //     "codice_fiscale": "DGRMSM95L27F205Z"
    // },
    // {
    //     "cognome_nome": "Intagliata Giacomo",
    //     "email": "giacomoint@gmail.com",
    //     "codice_fiscale": "NTGGCM97B23I754X"
    // },
]

async function book(page, il_ragazzo, hour) {
  await page.goto('https://orari-be.divsi.unimi.it/PortaleEasyPlanning/biblio/index.php?include=form');
  
  const sede = await page.$('#area');
  await sede.selectOption("25")
  
  const servizio = await page.$('#servizio')
  await servizio.selectOption("50")

  await page.type("#codice_fiscale", il_ragazzo.codice_fiscale)
  await page.type("#cognome_nome", il_ragazzo.cognome_nome)
  await page.type("#email", il_ragazzo.email)

  await page.click("#verify")
  await page.click(`text=${hour}`);
  await page.click("#conferma")

  console.log(`${il_ragazzo.cognome_nome} prenotato alle ${hour}`)
}

async function main () {

  let i_ragazzi = paramsFile;
  const ORE_DIECI = '10:00'
  const ORE_QUINDICI = '15:00'

  const browser = await chromium.launch({headless: false, slowMo: 100});
  const page = await browser.newPage();

  for(const il_ragazzo of i_ragazzi) {
    await book(page, il_ragazzo, ORE_DIECI)
    await book(page, il_ragazzo, ORE_QUINDICI)
  }

  await browser.close();
}

main()