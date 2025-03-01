
const moment = require('moment')

const formatCalendarEvents = (items) => {

    let events = []
    let markers = {}


    // Fonction pour ajouter des évenèments et des markers pour une période/ un évènement de plusieurs jours

    const addDayEvent = (eventData, marker, i, numberOfDays) => {
        let newEventData = { ...eventData }
        let newMarker = { ...marker }
        let newEventDay = {title : "", data : [newEventData]}

        // Ce n'est plus le premier jour
        newEventData.startingDay = false
        // Modification sur marker de période numéro 1 ou 2
        if (newMarker.periodMarker2) {
            newMarker.startingDay2 = false
        } else {
            newMarker.startingDay = false
        }


        const newStartingDate = moment(newEventData.startingDate).add(i, 'days').format('YYYY-MM-DD')
        const newId = eventData.id + i.toString()
        newEventData.id = newId


        newEventData.startingDate = newStartingDate
        newEventDay.title = newStartingDate

        // On détermine si c'est le dernier jour de la période ou s'il est au milieu
        if (i !== numberOfDays) {
            newEventData.middleDay = true
        } else {
            newEventData.endingDay = true
            // Modification sur marker de période numéro 1 ou 2
            if (newMarker.periodMarker2) {
                newMarker.endingDay2 = true
            } else {
                newMarker.endingDay = true
            }
        }


        // Ajout du nouvel évènement
        if (events.some(e=> e.title === newStartingDate)) {
            events = events.map(e=>{
                if (e.title === newStartingDate){
                    e.data.push(newEventData)
                }
                return e
            })
        } else {
            events.push(newEventDay)
        }



        // Ajout du nouveau marqueur
        if (markers[newStartingDate]?.marked || markers[newStartingDate]?.periodMarker || markers[newStartingDate]?.periodMarker2) {
            // Si la journée est déjà marquée d'un évènement d'un seul jour ou plusieurs, on le rajoute
            Object.assign(markers[newStartingDate], newMarker)
        } else {
            markers[newStartingDate] = newMarker
        }

    }



    // Boucle sur tous les évènements reçu de Google Calendar
    for (let item of items) {
        let eventData = {}
        let eventDay = {data : [eventData], title :""}
        let marker = {}

        const startingDate = item.start.dateTime ? moment(item.start.dateTime).format('YYYY-MM-DD') : item.start.date

        const startingTime = item.start.dateTime ? moment(item.start.dateTime).format('HH:mm') : ""

        const endingDate = item.end.dateTime ? moment(item.end.dateTime).format('YYYY-MM-DD') : moment(item.end.date).subtract(1, 'days').format('YYYY-MM-DD')

        const endingTime = item.end.dateTime ? moment(item.end.dateTime).format('HH:mm') : ""

        const allDayEvent = startingTime ? false : true

        const periodEvent = startingDate === endingDate ? false : true

        eventData.title = item.summary
        eventData.description = item.description
        eventData.location = item.location
        eventData.startingDate = startingDate
        eventData.startingTime = startingTime
        eventData.endingDate = endingDate
        eventData.endingTime = endingTime
        eventData.periodEvent = periodEvent
        eventData.allDayEvent = allDayEvent
        eventData.id = item.id

        eventDay.title = startingDate



        // Si c'est une période de plusieurs jours, rajout des évènements et des markers
        if (periodEvent) {
            const end = moment(endingDate)
            const start = moment(startingDate)
            const numberOfDays = end.diff(start, 'days')



            if (markers[startingDate]?.periodMarker) {
                // Si il y a déjà un marker de période pour cette date, celui ci sera enregistré en position numéro 2
                // Mode premier jour
                marker.startingDay2 = true
                marker.endingDay2 = false
                // Pour indiquer que c'est un marqueur sur plusieurs jours numéro 2
                marker.periodMarker2 = true


                // On modifie aussi l'évènement pour son enregistrement ultérieur en mode période (numéro 2):
                eventData.periodNumber = 2
            } else
            // Si il n'y a pas déjà un marker de période
            {
                // Mode premier jour
                marker.startingDay = true
                marker.endingDay = false
                // Pour indiquer que c'est un marqueur sur plusieurs jours
                marker.periodMarker = true

                // Évènement en mode période (numéro 1):
                eventData.periodNumber = 1
            }


            // On enregistre le marqueur
            if (markers[startingDate]?.marked || markers[startingDate]?.periodMarker || markers[startingDate]?.periodMarker2) {
                // Si la journée est déjà marquée d'un évènement d'un seul jour ou plusieurs, on le rajoute
                Object.assign(markers[startingDate], marker)
            } else {
                // Sinon on crée le marker
                markers[startingDate] = marker
            }


            // Premier jour de l'évènement
            eventData.startingDay = true


            // Fonction pour les jours supplémentaires à rajouter en évènement et markers
            for (let i = 1; i <= numberOfDays; i++) {
                addDayEvent(eventData, marker, i, numberOfDays)
            }
        }



        // On rajoute l'évènement dans les events, en mode période s'il est rentré dans le if (periodEvent) au dessus.
        if (events.some(e=> e.title === startingDate)) {
            events = events.map(e=>{
                if (e.title === startingDate){
                    e.data.push(eventData)
                }
                return e
            })
        } else {
            events.push(eventDay)
        }


        // Si ce n'est pas un évènement de plusieurs jour, on enregistre juste un marker avec marked = true ou marked2 = true (s'il y'en a déjà un et pour signaliser qu'il y'en a plusieurs)
        if (!periodEvent) {

            if (markers[startingDate]?.marked) {
                // S'il y a déjà un évènement d'un jour
                marker.marked2 = true
                Object.assign(markers[startingDate], marker)
            } else {
                marker.marked = true

                if (markers[startingDate]?.periodMarker || markers[startingDate]?.periodMarker2) {
                    // Si il y a déjà un évènement de plusieurs jours sur cette date
                    Object.assign(markers[startingDate], marker)
                } else {
                    // S'il n'y a pas de marqueur pour cette date
                    markers[startingDate] = marker
                }
            }
        }
    }

    return { events, markers }

}

module.exports = { formatCalendarEvents }