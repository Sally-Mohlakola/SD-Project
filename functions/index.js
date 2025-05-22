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
const { onCall, HttpsError } = require("firebase-functions/v2/https");
admin.initializeApp();
const db = admin.firestore();

// const logger = console;

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

exports.createOrder = onCall(async (request) => {
  const data = request.data;

  console.log("data received:", data.address, data.nameofshop, data.userid, data.cart_items, data.shopid);

  if (!data.address || !data.nameofshop || !data.userid || !data.cart_items|| !data.shopid) {
    console.log("Missing fields", {
      address: data.address,
      nameofshop: data.nameofshop,
      userid: data.userid,
      cart_items: data.cart_items,
      shopId: data.shopid
    });
    throw new HttpsError("invalid-argument", "Missing required order data");
  }

  try {
    const orderData = {
      address: data.address,
      nameofshop: data.nameofshop,
      status: data.status || "Ordered",
      userid: data.userid,
    };

    console.log("adding the order in orders");
    const orderRef = await db.collection("Orders").add(orderData);

    console.log("adding products from cart & updating sold count");

    const batch = db.batch();

    for (const item of data.cart_items) {
  const productOrderRef = orderRef.collection("Products").doc();
  batch.set(productOrderRef, {
    nameofitem: item.name,
    price: Number(item.price),
    quantity: Number(item.quantity),
  });

  console.log("Looking for product ID:", item.productId); 

  const productRef = db
    .collection("Shops")
    .doc(data.shopid)
    .collection("Products")
    .doc(item.id);

  const productDoc = await productRef.get();

  if (productDoc.exists) {
    const productData = productDoc.data();

    const currentSold = productData.sold || 0;
    const currentQuantity = productData.quantity || 0;

    const itemQty = Number(item.quantity);

    const newSold = currentSold + itemQty;
    const newQuantity = currentQuantity - itemQty;

    batch.update(productRef, {
      sold: newSold,
      quantity: newQuantity,
    });
  } else {
    console.warn(`Product with ID '${item.productId}' not found in shop '${data.nameofshop}'`);
  }
}


    await batch.commit();

    return {
      success: true,
      orderId: orderRef.id,
      message: "Order created and products updated successfully",
    };

  } catch (error) {
    console.error("Order creation failed:", error);
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


exports.getProductsInShop = onCall(async (request) => {
  const { shopid } = request.data;

  if (!shopid) {
    throw new functions.https.HttpsError(
      "invalid-argument",
      "Missing or invalid 'shopid' parameter."
    );
  }

  try {
    const db = admin.firestore();
    const productsRef = db.collection("Shops").doc(shopid).collection("Products");
    const snapshot = await productsRef.get();

    const allProducts = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    return allProducts;

  } catch (error) {
    console.error("ERROR getting products: ", error);
    throw new functions.https.HttpsError(
      "internal",
      "Failed to get products from shop.",
      error.message
    );
  }
});
const express = require("express");
const multer = require("multer");
const cors = require("cors");
const { v4: uuidv4 } = require("uuid");
const { onRequest } = require("firebase-functions/v2/https");

const app = express();
const upload = multer({ storage: multer.memoryStorage() });

app.use(cors({ origin: true }));

// Required because you're using admin.storage()
const storage = admin.storage().bucket();

app.post("/addProduct", upload.single("image"), async (req, res) => {
  try {
    const { itemName, itemdescription, price, quantity, shopid } = req.body;

    if (!itemName || !itemdescription || !price || !quantity || !shopid || !req.file) {
      return res.status(400).send({ error: "Missing fields" });
    }

    const file = req.file;
    const uniqueName = uuidv4() + "-" + file.originalname;
    const fileUpload = storage.file(`products/${uniqueName}`);

    await fileUpload.save(file.buffer, {
      metadata: {
        contentType: file.mimetype,
      },
    });

    const [url] = await fileUpload.getSignedUrl({
      action: "read",
      expires: "03-01-2030",
    });

    await db.collection("Shops").doc(shopid).collection("Products").add({
      name: itemName,
      itemdescription,
      price: Number(price),
      quantity: Number(quantity),
      sold: 0,
      imageURL: url,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
    });

    return res.status(200).send({ success: true, message: "Product added!" });
  } catch (error) {
    console.error("Upload failed:", error);
    return res.status(500).send({ error: "Internal server error" });
  }
});

// Export Express API as Firebase Function
exports.api = onRequest(app);


exports.updateOrderStatus = functions.https.onCall(async (request) => {
  const data = request.data;
  const { orderStatus, orderId } = data;

  console.log("Status:", orderStatus, "Order ID:", orderId);

  if (!orderStatus || !orderId) {
    throw new functions.https.HttpsError("invalid-argument", "Missing orderStatus or orderId");
  }

  const orderRef = db.collection("Orders").doc(orderId);
  const productsRef = orderRef.collection("Products");

  try {
    // Update the status
    await orderRef.update({ status: orderStatus });
    console.log(`Updated status to ${orderStatus}`);

    if (orderStatus.toLowerCase() === "collected") {
      // Delete all products in the subcollection
      const productsSnapshot = await productsRef.get();
      const deletePromises = [];
      
      productsSnapshot.forEach((doc) => {
        deletePromises.push(doc.ref.delete());
      });

      await Promise.all(deletePromises);
      console.log(`Deleted ${deletePromises.length} products.`);

      // Now delete the order document
      await orderRef.delete();
      console.log(`Order ${orderId} deleted from database.`);
    }

    return { success: true, message: "Order updated successfully." };

  } catch (error) {
    console.error("Error updating or deleting order:", error);
    throw new functions.https.HttpsError("internal", "Something went wrong.");
  }
});
