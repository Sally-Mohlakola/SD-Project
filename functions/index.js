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

    return { orders };
  } catch (error) {
    console.error("Error getting orders:", error);
    throw new functions.https.HttpsError(
      "internal",
      "Error fetching order data",
    );
  }
});

exports.getShopsForAdmin = functions.https.onCall(async (data, context) => {
  try {
    const shopsSnapshot = await admin.firestore().collection("Shops").get();

    const shops = shopsSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    return { shops };
  } catch (error) {
    console.error("Error getting shops:", error);
    throw new functions.https.HttpsError(
      "internal",
      "Error fetching shop data",
    );
  }
});


const functions = require("firebase-functions");
const admin = require("firebase-admin");
admin.initializeApp();
const db = admin.firestore();

exports.createOrder = functions.https.onCall(async (data, context) => {
  // Verify authentication
  if (!context.auth) {
    throw new functions.https.HttpsError("unauthenticated", "Authentication required");
  }

  // Validate required fields
  if (!data.address || !data.nameofshop || !data.userid || !data.cart_items) {
    throw new functions.https.HttpsError(
      "invalid-argument", 
      "Missing required order data"
    );
  }

  // Verify user matches auth context
  if (data.userid !== context.auth.uid) {
    throw new functions.https.HttpsError(
      "permission-denied",
      "User ID mismatch"
    );
  }

  try {
    // Create order document
    const orderData = {
      address: data.address,
      nameofshop: data.nameofshop,
      status: data.status || "Pending",
      userid: data.userid,
      
    };

    const orderRef = await db.collection("Orders").add(orderData);

    // Add products subcollection
    const batch = db.batch();
    data.cart_items.forEach(item => {
      const productRef = orderRef.collection("Products").doc();
      batch.set(productRef, {
        nameofitem: item.nameofitem,
        price: parseFloat(item.price),
        quantity: parseInt(item.quantity),
    
      });
    });

    await batch.commit();

    return { 
      success: true, 
      orderId: orderRef.id,
      message: "Order created successfully"
    };

  } catch (error) {
    console.error("Order creation failed:", error);
    throw new functions.https.HttpsError(
      "internal", 
      "Order creation failed",
      error.message
    );
  }
});