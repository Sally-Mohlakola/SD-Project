const functions = require("firebase-functions");
const admin = require("firebase-admin");
admin.initializeApp();
const db = admin.firestore();

exports.createOrder = functions.https.onCall(async (data, context) => {
  try {
    const {
      address,
      nameofshop,
      status,
      userid,
      cart_items, // subcollection Products {nameofitem, price, quantity}
    } = data;

    if (!userid || !cart_items || !Array.isArray(cart_items)) {
      throw new functions.https.HttpsError("invalid-argument", "Missing order data");
    }

    // Create the main order document
    const orderRef = await db.collection("Orders").add({
      address,
      nameofshop,
      status: status || "Pending",
      userid,
    });

    // Create subcollection `products`
    const productsRef = orderRef.collection("Products");

    const batch = db.batch();
    cart_items.forEach((item) => {
      const itemRef = productsRef.doc(); // Auto-ID
      batch.set(itemRef, {
        nameofitem: item.nameofitem,
        price: item.price,
        quantity: item.quantity,
      });
    });

    await batch.commit();

    return {success: true, orderId: orderRef.id};
  } catch (error) {
    alert("Order creation failed:");
    throw new functions.https.HttpsError("internal", "Order creation failed");
  }
});
