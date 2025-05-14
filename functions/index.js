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

exports.updateShopStatus = functions.https.onCall(async (data, context) => {
  const { shopName, newStatus } = data;

  if (!shopName || !newStatus) {
    throw new functions.https.HttpsError("invalid-argument", "Missing shopName or newStatus");
  }

  try {
    const shopsRef = admin.firestore().collection("Shops");
    const snapshot = await shopsRef.where("nameofshop", "==", shopName).get();

    if (snapshot.empty) {
      throw new functions.https.HttpsError("not-found", "Shop not found");
    }

    const docRef = snapshot.docs[0].ref;
    await docRef.update({ status: newStatus });

    return { message: "Shop status updated successfully." };
  } catch (error) {
    console.error("Error updating shop status:", error);
    throw new functions.https.HttpsError("internal", "Failed to update shop status");
  }
});

exports.addProduct = functions.https.onCall(async (data, context) => {
  const {
    shopId,
    name,
    itemdescription,
    price,
    quantity,
    imageURL,
  } = data;

  // Validate the input.
  if (!shopId || !name || !itemdescription || !price || !quantity || !imageURL) {
    throw new functions.https.HttpsError("invalid-argument", "Missing required product fields");
  }

  try {
    // Add the product to the shop's products collection
    await admin.firestore().collection("Shops").doc(shopId).collection("Products").add({
      name,
      itemdescription,
      price: Number(price),
      quantity: Number(quantity),
      sold: 0, // Default to 0 sold
      imageURL,
    });

    return { message: "Product added successfully" };
  } catch (error) {
    console.error("Error adding product:", error);
    throw new functions.https.HttpsError("internal", "Failed to add product");
  }
});
