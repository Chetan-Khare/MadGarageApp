const axios = require('axios');

async function test() {
  try {
    const login = await axios.post('http://localhost:8080/api/auth/verify-otp', { 
        phone: '911234567890', 
        otp: '123456' 
    });
    
    const token = login.data.token;
    console.log('Got token');
    
    // Test the debug endpoint for Order ID 1
    try {
        const order = await axios.get('http://localhost:8080/api/orders/debug/1');
        console.log("Debug Endpoint Response:", order.data);
    } catch(err) {
        console.error("Debug Endpoint Error:", err.message);
    }

    // Test the actual order details endpoint
    try {
        const details = await axios.get('http://localhost:8080/api/orders/1', { 
            headers: { Authorization: `Bearer ${token}` }
        });
        console.log("Order Details Response Status:", details.status);
    } catch(err) {
        console.error("Order Details Error:", err.response ? err.response.status : err.message);
    }

  } catch(e) {
    console.error("Login Error:", e.response ? e.response.status : e.message);
  }
}

test();
