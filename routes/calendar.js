var express = require('express');
var router = express.Router();

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

       const result = await calendar.events.list({
            calendarId: calendarId,
            timeMin: new Date('2025-01-01T03:24:00').toISOString(),
            singleEvents: true,
            orderBy: 'startTime',
        });

        if (result.data.items.length) {
            res.json({ events: result.data.items })
        } else {
            res.json({ message: 'No upcoming events found.' })
        }

    } catch (err) {
        console.log("err :", err)
        res.json({ err })
    }

})


module.exports = router;