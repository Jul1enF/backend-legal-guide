
const moment = require('moment')

const formatCalendarEvents = (items)=>{

    let events = {}
    let markers = {}


    // Fonction pour ajouter des évenèments et des markers pour une période/évènement de plusieurs jours

    const addDayEvent = (event, marker, i, numberOfDays) => {
        let newEvent = { ...event }
        let newMarker = {...marker}

        newMarker.startingDay = false

        const newStartingDate = moment(newEvent.startingDate).add(i, 'days').format('YYYY-MM-DD')
        const newId = event.id + i.toString()
        newEvent.id = newId

        
        newEvent.startingDate = newStartingDate

        if (i !== numberOfDays){
            newEvent.allDay = true
        }else{
            newEvent.lastDayPeriod = true
            newMarker.endingDay = true
        }

        if (events[newStartingDate]) {
            events[newStartingDate].push(newEvent)
        } else {
            events[newStartingDate] = [newEvent]
        }

        if (markers[newStartingDate]) {
            markers[newStartingDate].periods.push(newMarker)
        } else {
            markers[newStartingDate] = {periods : [newMarker]}
        }
            
    }

    // Boucle sur tous les évènements reçu de Google Calendar
    for (let item of items) {
        let event = {}
        let marker = {}

        const startingDate = moment(item.start.dateTime).format('YYYY-MM-DD')
        const startingTime = moment(item.start.dateTime).format('HH:mm')
        const endingDate = moment(item.end.dateTime).format('YYYY-MM-DD')
        const endingTime = moment(item.end.dateTime).format('HH:mm')

        const periodEvent = startingDate === endingDate ? false : true

        event.title = item.summary
        event.description = item.description
        event.location = item.location
        event.startingDate = startingDate
        event.startingTime = startingTime
        event.endingDate = endingDate
        event.endingTime = endingTime
        event.periodEvent = periodEvent
        event.id = item.id


        // Si c'est une période de plusieurs jours, rajout des évènements et des markers
        if (periodEvent) {
            const end = moment(endingDate)
            const start = moment(startingDate)
            const numberOfDays = end.diff(start, 'days')


            // Rajout du marker du premier jour
            marker.startingDay = true
            marker.endingDay = false
            marker.color = "#b90000"

            if (markers[startingDate]) {
                markers[startingDate].periods.push(marker)
            } else {
                markers[startingDate] = {periods : [marker]}
            }

            // Fonction pour les jours supplémentaires à rajouter en évènement et markers
            for (let i = 1; i <= numberOfDays ; i++){
                addDayEvent(event, marker, i, numberOfDays)
            }

            // Premier jour de l'évènement
            event.firstDayPeriod = true
        }

        if (!periodEvent){
            marker.startingDay = true
            marker.endingDay = true
            marker.color = "#b90000"

            if (markers[startingDate]) {
                markers[startingDate].periods.push(marker)
            } else {
                markers[startingDate] = {periods : [marker]}
            }
        }


        if (events[startingDate]) {
            events[startingDate].push(event)
        } else {
            events[startingDate] = [event]
        }


    }

    return { events, markers}

}

 module.exports={formatCalendarEvents}