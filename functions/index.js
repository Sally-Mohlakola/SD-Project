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
const {onCall} = require("firebase-functions/v2/https");
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
console.log(admin.app().options.credential.clientEmail);
exports.getShopsForAdmin = functions.https.onCall(async (data, context) => {
  try {
    const shopsSnapshot = await admin.firestore().collection("Shops").get();

    const shops = shopsSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    return {shops};
  } catch (error) {
    console.error("Error getting shops:", error);
    throw new functions.https.HttpsError(
        "internal",
        "Error fetching shop data",
    );
  }
});
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
        "Missing required order data",
    );
  }

  // Verify user matches auth context
  if (data.userid !== context.auth.uid) {
    throw new functions.https.HttpsError(
        "permission-denied",
        "User ID mismatch",
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
    data.cart_items.forEach((item) => {
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
      message: "Order created successfully",
    };
  } catch (error) {
    console.error("Order creation failed:", error);
    throw new functions.https.HttpsError(
        "internal",
        "Order creation failed",
        error.message,
    );
  }
});
exports.getAllShops = functions.https.onCall(async (data, context) => {
  try {
    const shopsSnapshot = await admin.firestore().collection("Shops").get();

    const shops = await Promise.all(
        shopsSnapshot.docs.map(async (doc) => {
          const productsSnapshot = await doc.ref.collection("Products").get();
          const products = productsSnapshot.docs.map(
              (itemDoc) => itemDoc.data());

          return {
            id: doc.id,
            ...doc.data(),
            products: products,
          };
        }),
    );

    return {shops};
  } catch (error) {
    console.error("Error getting shops:", error);
    throw new functions.https.HttpsError(
        "internal",
        "Error fetching order data",
    );
  }
});

exports.deleteShop= onCall(async (request) => {
  const data = request.data;
  const {shopId, userId, url} = data;

  console.log(`shopid: ${shopId}`);
  console.log(`userid: ${userId}`);
  console.log(`userid: ${url}`);
  try {
    console.log(`Deleting shop data for shop : ${shopId}`);
    // Delete Firestore doc
    const db = admin.firestore();
    const storage = admin.storage().bucket();
    await db.collection("Shops").doc(shopId).delete();
    console.log(`Deleted shop: ${shopId}`);
    console.log(`Deleted image for shop: ${shopId}`);
    // Try deleting image
    const filePath = `Shop/${url}`;
    const file = storage.file(filePath);
    const [exists] = await file.exists();
    if (exists) {
      await file.delete();
      console.log(`Deleted image: ${filePath}`);
    }
    return {success: true, message: "Shop and image deleted successfully."};
  } catch (error) {
    console.error("Error deleting shop/image:", error);
    throw new functions.https.HttpsError("internal", "Failed to delete shop or image.");
  }
});
exports.findShopImage = onCall(async (request) => {
  const data = request.data;
  const {url} = data;
  console.log("Received url:", data.url);
  try {
    const storage = admin.storage().bucket();
    let imageUrl = null;
    const filePath = `Shop/${url}`;
    const file = storage.file(filePath);
    const [exists] = await file.exists();
    console.log(`Checking path: ${filePath}`); // Debug log
    if (exists) {
      const [urls] = await file.getSignedUrl({
        action: "read",
        expires: Date.now() + 604800 * 1000, // 7 days
      }).catch((err) => {
        console.error(`Error generating URL for ${filePath}:`, err);
        throw err;
      });
      imageUrl = urls;
    }

    if (!imageUrl) {
      throw new functions.https.HttpsError(
          "not-found",
          "No shop image found for this user.",
      );
    }
    return {imageUrl}; // Return as object 
  } catch (error) {
    console.error("Error fetching shop image:", error);


    if (error instanceof functions.https.HttpsError) {
      throw error; // Re-throw existing Firebase errors
    }

   
    throw new functions.https.HttpsError(
        "internal",
        "Failed to retrieve shop image.",
        error.message,
    );
  }
});
