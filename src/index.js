const fs = require('fs');
    
    let rp = require("request-promise")
    const cheerio = require('cheerio');
    const hostname = "orari-be.divsi.unimi.it"
    const path = "/PortaleEasyPlanning/biblio/index.php"
    rp = rp.defaults({jar: true, transform: (body) => cheerio.load(body)})

    let paramsFile = fs.readFileSync('src/params.json');


async function book(infos, hour) {
    //hour should be 10:00 or 15:00

    infos['data_inizio'] = getDateDDMMYYYY(getWeekday(new Date()))
    let options = {
        uri: `https://${hostname}${path}`,
        qs : {
            "customer": "biblio",
            "include": "form",
            ...infos
        }
    };

    var $ = await rp(options)
    let form = $("#main_form")
        .serializeArray()
        .map(({name,value}) => ({[name]: value}))
        .reduce((acc,curr) => Object.assign(acc,curr), infos);

    options = {
        uri: `https://${hostname}${path}?include=timetable`,
        method: "POST",
        form
    }
    var $ = await rp(options) 
    
    let res = $(".month-container").children().map((_,e) => e).toArray()
    let index = res.reverse().findIndex(x => $(x).is(".interval-outer-div"))
    var r = $(res[index]).find("p.slot_available").not(".slot_altri_impegni").map((_,e) => ({
                text: $(e).text().trim(),
                onClick: $(e).attr("onclick")
            })).toArray()
    
    var slot = search(hour, r)
    if(slot == undefined || r.length == 0) {
        console.log(infos['cognome_nome'] + ", sei già prenotato o sono finiti i posti")
        return
    }

    form = {...form, ...getVals(slot['onClick'])}
    form['durata_servizio'] = (form['end_time'] - form['timestamp']).toString()
    options = {
        uri: `https://${hostname}${path}?include=review`,
        method: "POST",
        form
    }

    var $ = await rp(options)
    form = $(".col-xs-12 .col-sm-6").find("form")
                .serializeArray()
                .map(({name,value}) => ({[name]: value}))
                .reduce((acc,curr) => Object.assign(acc,curr));
    options = {
        uri: `https://${hostname}${path}?include=confirmed`,
        method: "POST",
        form
    }            

    var $ = await rp(options)

    document.getElementById("result").innerHTML = "dd"//infos['cognome_nome'] + ", " + $("h1.page-title").text()
    console.log(infos['cognome_nome'] + ", " + $("h1.page-title").text())
} 

function getVals(str) {
    var splitted = str.split("\n")

    function getSingleVal(str) {
        return str.substr(str.lastIndexOf('(\'') + 2, str.lastIndexOf(')') - 3 - str.lastIndexOf('(\''))
    }

    return {
        'timestamp': getSingleVal(splitted[0]),
        'end_time': getSingleVal(splitted[1]),
        'risorsa': getSingleVal(splitted[2])
    }
}


function search(key, myArray){
    for (var i=0; i < myArray.length; i++) {
        if (myArray[i].text === key) {
            return myArray[i];
        }
    }
}

function getWeekday (d) {
    let nextDay = new Date(d)
    if(d.getDay() == 0) {
        nextDay.setDate(nextDay.getDate() + 1)
    } else if(d.getDay() == 6) {
        nextDay.setDate(nextDay.getDate() + 2)
    }    
    return nextDay
}

function getDateDDMMYYYY(d) {
    let date = ("0" + d.getDate()).slice(-2);
    let month = ("0" + (d.getMonth() + 1)).slice(-2);
    let year = d.getFullYear();

    return date + "-" + month + "-" + year
}

async function main() {
    let i_ragazzi = JSON.parse(paramsFile);
    for(const il_ragazzo of i_ragazzi) {
        await book(il_ragazzo, '10:00')
        //await book(il_ragazzo, '15:00')
    }

}

//main()