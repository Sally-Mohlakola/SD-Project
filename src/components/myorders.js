import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getFunctions, httpsCallable } from 'firebase/functions';
import '../styles/myorders.css';
import '../styles/searchTab.css';


//Get products for the user's shop
export const getProductsInShop = async (shopid) => {
  try {
    const functions = getFunctions();
    const getProductsFn = httpsCallable(functions, "getProductsInShop");
    const products = await getProductsFn({ shopid });
    const AllProducts = products.data.docs.map((doc) => ({ id: doc.id, ...doc }));
    return AllProducts;
  } catch (error) {
    console.error("ERROR getting products: ", error);
    return [];
  }
};

export const MyOrders = () => {
  const [orderlist, setorderlist] = useState([]);
  const currentUserId = localStorage.getItem("userid");
  const currentuserstore = localStorage.getItem("shopname");
  const [productsMap, setProductsMap] = useState([]);
  const [loading, setLoading] = useState(false);
  const [ordersListLoading, setOrdersLoading] = useState(true);
  const [orderstatus, setorderstatus] = useState('');
  const [editingOrderid, setEditingOrderid] = useState(null);

  const navigate = useNavigate();

  function navigateDashboard() {
    navigate('/shopdashboard');
  }

  //Get the order list by using Cloud Function
  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const functions = getFunctions();
        const getOrders = httpsCallable(functions, 'getOrders');
        const result = await getOrders({});
        setorderlist(result.data.orders || []);
      } catch (error) {
        console.error('Error fetching orders:', error);
      } finally {
        setOrdersLoading(false);
      }
    };
    fetchOrders();
  }, []);

  useEffect(() => {
    const fetchUserShopProducts = async () => {
      try {
        const functions = getFunctions();
        const getAllShops = httpsCallable(functions, 'getAllShops');
        const result = await getAllShops({});
        const userShop = (result.data.shops || []).filter(shop => shop.userid === currentUserId);
        if (userShop.length > 0) {
          const shopId = userShop[0].id;
          const products = await getProductsInShop(shopId);
          setProductsMap(products);
        } else {
          console.error("ERROR: No shops found for this user.");
        }
      } catch (error) {
        console.error("ERROR getting this shop or products:", error);
      }
    };
    fetchUserShopProducts();
  }, [currentUserId]);

  
  // Filter total orders by the user's shop
  const myorders = orderlist.filter((order) => order.nameofshop === currentuserstore);

  //Calculate baseline stats from the user's order data (These will be used in the CSV)
  const sales = myorders.reduce((acc, order) => {
    order.products.forEach((product) => {
      const { nameofitem, quantity, price } = product;
      if (!acc[nameofitem]) {
        acc[nameofitem] = { totalQuantity: 0, totalRevenue: 0, price: 0, orderCount: 0 };
      }
      acc[nameofitem].totalQuantity += quantity;
      acc[nameofitem].totalRevenue += quantity * price;
      acc[nameofitem].price = price;
      acc[nameofitem].orderCount += 1;
    });
    return acc;
  }, {});

  //Average quantity of products for growth divisor
  const totalProducts = Object.keys(sales).length;
  const totalQuantity = Object.values(sales).reduce((sum, stat) => sum + stat.totalQuantity, 0);
  const averageQuantity = totalProducts > 0 ? totalQuantity / totalProducts : 0;

  // Convert sales stats to array for CSV, including growth percentage
  const salesGrowth = Object.entries(sales)
    .map(([name, stats]) => ({
      productName: name,
      price: stats.price.toFixed(2),
      totalQuantity: stats.totalQuantity,
      totalRevenue: stats.totalRevenue.toFixed(2),
      salesGrowthPercentage: averageQuantity > 0 
        ? ((stats.totalQuantity - averageQuantity) / averageQuantity * 100).toFixed(2)
        : 0,
    }))
    .sort((a, b) => b.price - a.price); // Sort by price in descending order (most profitable)


  const downloadCSVFile = () => {
    if (salesGrowth.length === 0) {
      alert("No sales data available to download.");
      return;
    }

    const orderFields = ['productName', 'price', 'totalQuantity', 'totalRevenue', 'salesGrowthPercentage'];
    const csvFields = [
      orderFields.join(','), // Header row
      ...salesGrowth.map((item) =>
        orderFields.map((field) => `"${item[field]}"`).join(',')
      ),
    ];

    // Generate the sales report here (CSV file)
    const csvFile = csvFields.join('\n');
    const blob = new Blob([csvFile], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'sales_trends_report.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };


  // Call the firebase function that records updated order statuses
  const updatestatus = async (ordid) => {
    setLoading(true);
    try {
      const functions = getFunctions();
      const updateOrderStatus = httpsCallable(functions, 'updateOrderStatus');
      await updateOrderStatus({ orderStatus: orderstatus, orderId: ordid });
      if (orderstatus === 'Collected') {

        /*The order no longer appears in the order list presented in the UI as it no longer concerns the seller on the dashboard
        As soon as this Collected is selected, the order will remove itself from the UI but the data is still in memory
        The order is still in database for tracking purposes*/
        alert('The order has been received by customer.');
        setorderlist(prevOrders => 
          prevOrders.filter(order => order.orderid !== ordid)
        );
      } else {
        setorderlist(prevOrders => 
          prevOrders.map(order => 
            order.orderid === ordid ? { ...order, status: orderstatus } : order
          )
        );
      }
      setEditingOrderid(null);
      setorderstatus('');
    } catch (err) {
      console.error('Error updating order status:', err);
      alert('Failed to update this order status. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className='Cover'>
      <section className='order-section'>
        <h1>My Orders</h1>
        <button className='back-button' onClick={navigateDashboard}>← Dashboard</button>
        <button className='download-button' onClick={downloadCSVFile}>Download Sales Trends Report</button>
        
        {ordersListLoading && (
          <section className='loader-wrapper'><section className='loader'></section></section>
        )}
        
        {!ordersListLoading && myorders.length === 0 && (
          <section className='empty-alert'>You have no orders. Try again later.</section>
        )}
        
        {loading && <section className='loading-alert'>Updating status...</section>}

        {/*Showcase orderlist that was procured thorugh the Cloud Function*/ }
        {myorders.map((ord, idx) => (
          <section className='Order' key={idx}>
            <h3>Order #{idx+1}</h3>
            {ord.products.map((prod, index2) => (
              <section key={index2}>
                <p><strong>Name:</strong> {prod.nameofitem}</p>
                <p><strong>Quantity:</strong> {prod.quantity}</p>
                <p><strong>Price:</strong> R{prod.price}</p>
              </section>
            ))}
            <p><strong>Address:</strong> {ord.address}</p>
            {ord.orderid === editingOrderid ? (
              <section>
                <select 
                  value={orderstatus}
                  onChange={(e) => setorderstatus(e.target.value)}
                >
                  {/*Seller updates the status of each order they receive on their shop. Simulates delivery*/}
                  <option value='' disabled>Update status</option>
                  <option value='Ordered'>Ordered</option>
                  <option value='Delivery ready'>Delivery ready</option>
                  <option value='Dispatched'>Dispatched</option>
                  <option value='Collected'>Collected</option>
                </select>
                <section className='button-container'>
                  <button id="save-button" onClick={() => updatestatus(ord.orderid)}>Save</button>
                  <button id="cancel-button" onClick={() => setEditingOrderid(null)}>Cancel</button>
                </section>
              </section>
            ) : (
              <section className='status-container'>
                <p><strong>Status:</strong> {ord.status}</p>
                <button onClick={() => {
                  setEditingOrderid(ord.orderid);
                  setorderstatus(ord.status);
                }}>
                  Update status
                </button>
              </section>
            )}
          </section>
        ))}
      </section>
    </section>
  );
};
