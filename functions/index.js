/**
 * Import function triggers from their respective submodules:
 *
 * const {onCall} = require("firebase-functions/v2/https");
 * const {onDocumentWritten} = require("firebase-functions/v2/firestore");
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

// const {onRequest} = require("firebase-functions/v2/https");
// const logger = require("firebase-functions/logger");

// Create and deploy your first functions
// https://firebase.google.com/docs/functions/get-started

// exports.helloWorld = onRequest((request, response) => {
//   logger.info("Hello logs!", {structuredData: true});
//   response.send("Hello from Firebase!");
// });

// In your Firebase project's functions/index.js

const functions = require("firebase-functions");
const admin = require("firebase-admin");
admin.initializeApp();

exports.getOrders = functions.https.onCall(async (data, context) => {
  try {
    const ordersSnapshot = await admin.firestore().collection("Orders").get();

    const orders = await Promise.all(
        ordersSnapshot.docs.map(async (doc) => {
          const productsSnapshot = await doc.ref.collection("Products").get();
          const products = productsSnapshot.docs.map(
              (itemDoc) => itemDoc.data());

          return {
            orderid: doc.id,
            ...doc.data(),
            products: products,
          };
        }),
    );

    return {orders};
  } catch (error) {
    console.error("Error getting orders:", error);
    throw new functions.https.HttpsError(
        "internal",
        "Error fetching order data",
    );
  }
});
