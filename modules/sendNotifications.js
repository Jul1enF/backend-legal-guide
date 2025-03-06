const { Expo } = require("expo-server-sdk");

const User = require("../models/users");

// Fonction pour envoyer une notification

const sendNotifications = async (title, message) => {
  let expo = new Expo({
    accessToken: process.env.EXPO_ACCESS_TOKEN,
  });

  let allUsers = await User.find();

  let messages = [];

  for (let user of allUsers) {
    if (Expo.isExpoPushToken(user.push_token) && user.is_admin) {
        messages.push({
            to: user.push_token,
            sound: "default",
            title,
            body: message,
            priority: "high",
            channelId: "me-baudelin",
            ttl: 604800,
            data: {
              collapse: false,
            },
          });
    }
  }

  // Création de "morceaux" à envoyer à expo push notif (méthode la plus efficace)

  let chunks = expo.chunkPushNotifications(messages);
  let tickets = [];

  for (let chunk of chunks) {
    try {
      let ticketChunk = await expo.sendPushNotificationsAsync(chunk);
      console.log("Recivedticket :", ticketChunk);
      tickets.push(...ticketChunk);
    } catch (error) {
      console.log(error);
    }
  }

  // Vérification de la présence d'erreur dans les tickets de reçu
  // (Google et Apple peuvent bloquer une app qui envoie
  // des notifications pas reçues)

  // Tri des tickets pour ne garder que ceux qui ont franchi
  // la première étape (envoi) et contiennent une ID

  let ticketsWithId = [];

  let tokensToSuppress = [];

  for (let ticket of tickets) {
    if (ticket.status === "ok") {
      ticketsWithId.push(ticket.id);
    } else {
      console.log("Bad ticket : ", ticket);
      tokensToSuppress.push(ticket.details.expoPushToken);
    }
  }

  // Extraction des ID des tickets contenant des informations
  // supplémentaires (notamment si erreur)

  let ticketsWithIdChunks = expo.chunkPushNotificationReceiptIds(ticketsWithId);

  for (let chunk of ticketsWithIdChunks) {
    try {
      let receipts = await expo.getPushNotificationReceiptsAsync(chunk);
      console.log("Receipts :", receipts);

      // Boucle juste pour remplacer par une variable le nom du champ
      // (qui est une id qu'on ne connait pas) et pouvoir accéder à son contenu.

      for (let receiptId in receipts) {
        let { status, details } = receipts[receiptId];

        if (status === "error") {
          console.log("ReceiptId error :", receipts[informations]);

          if (
            details &&
            details.error &&
            !tokensToSuppress.some((e) => e === details.expoPushToken)
          ) {
            tokensToSuppress.push(details.expoPushToken);
          }
        }
      }
    } catch (error) {
      console.log(error);
    }
  }
  // Suppression des push tokens à problèmes
  if (tokensToSuppress.length > 0) {
    for (let pushToken of tokensToSuppress) {
      await User.updateOne({ push_token: pushToken }, { push_token: "" });
    }
  }
};

module.exports = { sendNotifications };