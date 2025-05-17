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
const { onCall } = require("firebase-functions/v2/https");
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
console.log(admin.app().options.credential.clientEmail);
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


exports.createOrder = onCall(async (data, context) => {
  //const data = request.data;
  //const context = request;  // context.auth is available on request.auth

  // if (!context.auth) {
  //   throw new HttpsError("unauthenticated", "Authentication required");
  // }

  if (!data.address || !data.nameofshop || !data.userid || !data.cart_items) {
    throw new HttpsError("invalid-argument", "Missing required order data");
  }

  // if (data.userid !== context.auth.uid) {
  //   throw new HttpsError("permission-denied", "User ID mismatch");
  // }

  try {
    const orderData = {
      address: data.address,
      nameofshop: data.nameofshop,
      status: data.status || "Ordered",
      userid: data.userid,
    };

    const orderRef = await db.collection("Orders").add(orderData);

    const batch = db.batch();
    data.cart_items.forEach((item) => {
      const productRef = orderRef.collection("Products").doc();
      batch.set(productRef, {
        name: item.name,
        price: Number(item.price),
        quantity: Number(item.quantity),
      });
    });

    await batch.commit();

    return {
      success: true,
      orderId: orderRef.id,
      message: "Order created successfully",
    };
  } catch (error) {
    logger.error("Order creation failed:", error);
    throw new HttpsError("internal", "Order creation failed", error.message);
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

    return { shops };
  } catch (error) {
    console.error("Error getting shops:", error);
    throw new functions.https.HttpsError(
      "internal",
      "Error fetching order data",
    );
  }
});

exports.deleteShop = onCall(async (request) => {
  const data = request.data;
  const { shopId, userId, url } = data;

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
    return { success: true, message: "Shop and image deleted successfully." };
  } catch (error) {
    console.error("Error deleting shop/image:", error);
    throw new functions.https.HttpsError("internal", "Failed to delete shop or image.");
  }
});
exports.findShopImage = onCall(async (request) => {
  const data = request.data;
  const { url } = data;
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
    return { imageUrl }; // Return as object 
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
exports.createShop = onCall(async (request) => {
  const data = request.data;
  const { userid, nameofshop, description, status, category, image, ext } = data;

  const filePath = `Shop/${userid}.${ext}`;
  const bucket = admin.storage().bucket();
  const file = bucket.file(filePath);

  try {
    const buffer = Buffer.from(image, "base64"); // Just decode the image we encoded
    await file.save(buffer, {
      metadata: {
        contentType: `image/${ext}`,
      },
      public: false,
    });

    const shopData = {
      userid,
      nameofshop,
      description,
      status,
      category,
      imageurl: `${userid}.${ext}`,
    };

    const db = admin.firestore();
    await db.collection("Shops").add(shopData);

    return { success: true, message: "Shop submitted successfully!" };
  } catch (error) {
    console.error("Error submitting shop:", error);
    throw new functions.https.HttpsError(
      "internal",
      "Failed to submit shop.",
      error.message
    );
  }
});
