
const moment = require('moment')

const formatCalendarEvents = (items) => {

    let events = {}
    let markers = {}


    // Fonction pour ajouter des évenèments et des markers pour une période/ un évènement de plusieurs jours

    const addDayEvent = (event, marker, i, numberOfDays) => {
        let newEvent = { ...event }
        let newMarker = { ...marker }

        // Ce n'est plus le premier jour
        newEvent.startingDay = false
        // Modification sur marker de période numéro 1 ou 2
        if (newMarker.periodMarker2) {
            newMarker.startingDay2 = false
        } else {
            newMarker.startingDay = false
        }


        const newStartingDate = moment(newEvent.startingDate).add(i, 'days').format('YYYY-MM-DD')
        const newId = event.id + i.toString()
        newEvent.id = newId


        newEvent.startingDate = newStartingDate

        // On détermine si c'est le dernier jour de la période ou s'il est au miliei
        if (i !== numberOfDays) {
            newEvent.middleDay = true
        } else {
            newEvent.endingDay = true
            // Modification sur marker de période numéro 1 ou 2
            if (newMarker.periodMarker2) {
                newMarker.endingDay2 = true
            } else {
                newMarker.endingDay = true
            }
        }


        // Ajout du nouvel évènement
        if (events[newStartingDate]) {
            events[newStartingDate].push(newEvent)
        } else {
            events[newStartingDate] = [newEvent]
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
        let event = {}
        let marker = {}

        const startingDate = item.start.dateTime ? moment(item.start.dateTime).format('YYYY-MM-DD') : item.start.date
        const startingTime = item.start.dateTime ? moment(item.start.dateTime).format('HH:mm') : ""

        const endingDate = item.end.dateTime ? moment(item.end.dateTime).format('YYYY-MM-DD') : moment(item.end.date).subtract(1, 'days').format('YYYY-MM-DD')
        const endingTime = item.end.dateTime ? moment(item.end.dateTime).format('HH:mm') : ""

        const allDayEvent = startingTime ? false : true

        const periodEvent = startingDate === endingDate ? false : true

        event.title = item.summary
        event.description = item.description
        event.location = item.location
        event.startingDate = startingDate
        event.startingTime = startingTime
        event.endingDate = endingDate
        event.endingTime = endingTime
        event.periodEvent = periodEvent
        event.allDayEvent = allDayEvent
        event.id = item.id



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
                event.periodNumber = 2
            } else
            // Si il n'y a pas déjà un marker de période
            {
                // Mode premier jour
                marker.startingDay = true
                marker.endingDay = false
                // Pour indiquer que c'est un marqueur sur plusieurs jours
                marker.periodMarker = true

                // Évènement en mode période (numéro 1):
                event.periodNumber = 1
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
            event.startingDay = true


            // Fonction pour les jours supplémentaires à rajouter en évènement et markers
            for (let i = 1; i <= numberOfDays; i++) {
                addDayEvent(event, marker, i, numberOfDays)
            }
        }



        // On rajoute l'évènement dans les events, en mode période s'il est rentré dans le if (periodEvent) au dessus.
        if (events[startingDate]) {
            events[startingDate].push(event)
        } else {
            events[startingDate] = [event]
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