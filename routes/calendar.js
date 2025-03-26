var express = require('express');
var router = express.Router();


const mongoose = require('mongoose')
const connectionString = process.env.CONNECTION_STRING

const { formatCalendarEvents } = require('../modules/formatCalendarEvents')

const { google } = require('googleapis');


const projectNumber = process.env.CALENDAR_PROJECT_NUMBER
const privateKey = process.env.CALENDAR_PRIVATE_KEY
const clientEmail = process.env.CLIENT_EMAIL
const calendarId = process.env.CALENDAR_ID
const readScopes = 'https://www.googleapis.com/auth/calendar.readonly';

const jwtClient = new google.auth.JWT(
    clientEmail,
    null,
    privateKey,
    readScopes
);

const calendar = google.calendar({
    version: 'v3',
    project: projectNumber,
    auth: jwtClient
});



router.get('/getEvents', async (req, res) => {
    try {
        if (mongoose.connection.readyState !== 1) {
            console.log("NO DB CONNEXION")
            await mongoose.connect(connectionString, { connectTimeoutMS: 6000 })
        }

        const result = await calendar.events.list({
            calendarId: calendarId,
            timeMin: new Date('2025-01-01T03:24:00').toISOString(),
            singleEvents: true,
            orderBy: 'startTime',
        });

        if (result.data.items.length) {
            // Mise en forme pour react calendar

            const { items } = result.data

            const formatedEvents = formatCalendarEvents(items)

            const { events, markers } = formatedEvents
            // console.log("markers", markers)

            res.json({ result: true, events, markers })
        } else {
            res.json({ result: false, message: 'No upcoming events found.' })
        }

    } catch (err) {
        console.log("err :", err)
        res.json({ err, result: false })
    }

})


module.exports = router;