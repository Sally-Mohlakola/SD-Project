import { useNavigate } from "react-router-dom";
import React, { useEffect, useState } from "react";
import '../styles/removeproducts.css'
import { getFunctions, httpsCallable } from 'firebase/functions';

export const DeleteProduct = () => {

  let navigate = useNavigate();
  const [loading, setloading] = useState(false);

  // grabbing the current product + shop info from storage
  let shopid = localStorage.getItem('shopid');
  const Item = localStorage.getItem('Item');
  const productid = localStorage.getItem('productid');
  const producturl = localStorage.getItem('producturl');

  //Confirming the item clicked for deletion
  console.log("Have the item stored as " + Item)
  console.log("Item stored in localStorage:", localStorage.getItem("Item"));

  // wait for Item to load in localStorage before continuing (fallback check)
  useEffect(() => {
    let intervalId = setInterval(() => {
      if (Item) { 
        clearInterval(intervalId); 
        console.log("Item captured");
      } else {
        console.log("still waiting for item");
      }
    }, 5000);
  }, []);

  // convert full URL to path Firebase Storage understands
  function getStoragePathFromUrl(iurl) {
    try {
      const decodedUrl = decodeURIComponent(iurl);
      const startIndex = decodedUrl.indexOf("/o/") + 3;
      const endIndex = decodedUrl.indexOf("?alt=");
      return decodedUrl.substring(startIndex, endIndex);
    } catch (e) {
      return null;
    }
  }

  // confirming again in console just to be safe
  console.log("path", producturl);
  console.log("productid", productid);

  // cloud function to actually delete product from DB + Storage
  const delete_item = async () => {
    setloading(true);
    try {
      const functions = getFunctions();
      const deleteProduct = httpsCallable(functions, 'deleteProduct');
      const filepath = getStoragePathFromUrl(producturl); // Locating item path in storage
      console.log("path", filepath);
      // Call the deletion Cloud Function. Located the item slated for deletion
      await deleteProduct({ shopId: shopid, productId: productid, path: filepath });
    } catch (err) {
      console.log(productid, ": Item. Cannot delete item", err);
    } finally {
      setloading(false);
    }

    // after delete, go back to product list
    navigate('/displayproducts');
  }

  // just a simple back button
  const Back = () => {
    navigate('/displayproducts');
  }

  // JSX for confirmation UI
  return (
    <section className="Wrap">
      <section className="delete_wrapper">
        <section className="back-button-delete">
          <button onClick={Back}><i className="bx bx-x"></i>Close</button>
        </section>

        <section className="myicon"><i className="bx bx-trash"></i> </section>

        {loading ? (
          <p>Loading...</p>
        ) : (
          <>
            <section className="H2">
              <h1>Do you want to remove this product?</h1><br />
            </section>

            <section className="H1">
              <h1>{Item}</h1>
            </section>

            <section className="delete_button-dp">
              <button onClick={delete_item}>Confirm</button>
            </section>
          </>
        )}
      </section>
    </section>
  );
};
