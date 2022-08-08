
const app = require('express')()
const mongodb = require('mongodb')
const fetch = require('node-fetch')
const settings = require('./settings.json')
const ObjectId = mongodb.ObjectId
const MongoClient = mongodb.MongoClient

const PORT = 3001
const buienradarAPI = 'https://data.buienradar.nl/2.0/feed/json'
const db = {
    host: 'mongodb://127.0.0.1:27017',
    db: "eWeather",
    collection: "stations"
}
const options = {
    useUnifiedTopology: true,
    useNewUrlParser: true,
}

setInterval( async function() {

        // get actual data from buienradar API
        const res = await fetch(buienradarAPI)
        const data = await res.json()

        // initiate client, connect to db, definde collection
        let client = new MongoClient(db.host, options)
        let clientPromise = await client.connect()
        const dbConnection = await clientPromise
        const eWeatherDB = dbConnection.db(db.db)
        const collection = eWeatherDB.collection(db.collection)

        // create new array for measurements
        let array = []

        // fill it
        const currDate = Date.parse(new Date())
        for (let i = 0; i < data.actual.stationmeasurements.length; i++) {
            const msrmnt = {
                _id: new ObjectId(),
                date: currDate,
                stationname: data.actual.stationmeasurements[i].stationname,
                region: data.actual.stationmeasurements[i].regio,
                temperature: data.actual.stationmeasurements[i].temperature,
                sunpower: data.actual.stationmeasurements[i].sunpower,
                feeltemperature: data.actual.stationmeasurements[i].feeltemperature,
                rainFallLastHour: data.actual.stationmeasurements[i].rainFallLastHour,
                groundtemperature: data.actual.stationmeasurements[i].groundtemperature,
                winddirection: data.actual.stationmeasurements[i].winddirection
            }
            array.push(msrmnt)
        }

        // store it
        const insert = await collection.insertMany(array)
        console.log('inserted actaul data.. date:', currDate)

        // close client
        client.close()
    }
    , settings.timeout 
)

app.get('/', async (req, res) => {

    let client = new MongoClient(db.host, options)
    let clientPromise = await client.connect()
    const dbConnection = await clientPromise
    const eWeatherDB = dbConnection.db(db.db)
    const collection = eWeatherDB.collection(db.collection)

    const result = await collection.find().toArray()
    client.close()

    res.status(200).json(result)

})

app.get('/:station', async (req, res) => {

    const station = req.params.station

    let client = new MongoClient(db.host, options)
    let clientPromise = await client.connect()
    const dbConnection = await clientPromise
    const eWeatherDB = dbConnection.db(db.db)
    const collection = eWeatherDB.collection(db.collection)

    const result = await collection.find({stationname: station}).toArray()
    client.close()

    res.status(200).json(result)

})

app.get('/:station/details', async (req, res) => {

    const station = req.params.station
    const query = req._parsedUrl.query
    
    let startDate
    let endDate
    const defaultPeriod = 1000 * 60 * 60 * 24 * 7

    const splitI = query.match(/&/)?.index || -1
    
    if (splitI > -1) {   // if both startDate & endDate
        const endI = query.match(/endDate=/).index
        const startI = query.match(/startDate=/).index

        if (startI > endI) {
            endDate = parseInt(query.substring(endI + 8, startI - 1))
            startDate = parseInt(query.substring(startI + 10, query.length))
        }
        else {
            endDate = parseInt(query.substring(endI + 8, query.length))
            startDate = parseInt(query.substring(startI + 10, endI - 1))
        }

    }
    else {  // assume only endDate given use default to calc startDate
        endDate = parseInt(query.substring(8, query.length))
        startDate = endDate - defaultPeriod
    }

    let client = new MongoClient(db.host, options)
    let clientPromise = await client.connect()
    const dbConnection = await clientPromise
    const eWeatherDB = dbConnection.db(db.db)
    const collection = eWeatherDB.collection(db.collection)

    const result = await collection.find({stationname: station, date: { $lt: endDate, $gt: startDate }}).toArray()
    client.close()

    console.dir(result)

    res.status(200).json(result)

})

app.listen(
    PORT,
    () => console.log('server listening on port:', PORT)
)
