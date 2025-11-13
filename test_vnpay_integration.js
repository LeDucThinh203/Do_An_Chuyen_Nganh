// /**
//  * Script test VNPay API
//  * Chạy: node test_vnpay_integration.js
//  */

// // Test 1: Tạo payment URL
// async function testCreatePaymentUrl() {
//     console.log('\n========================================');
//     console.log('Test 1: Tạo VNPay Payment URL');
//     console.log('========================================');
    
//     const data = {
//         orderId: Date.now().toString(),
//         amount: 100000,
//         orderInfo: 'Test thanh toan don hang',
//         orderType: 'billpayment',
//         language: 'vn'
//     };
    
//     try {
//         const response = await fetch('http://localhost:3006/vnpay/create_payment_url', {
//             method: 'POST',
//             headers: {
//                 'Content-Type': 'application/json'
//             },
//             body: JSON.stringify(data)
//         });
        
//         const result = await response.json();
        
//         if (result.success) {
//             console.log('✅ SUCCESS');
//             console.log('Order ID:', result.data.orderId);
//             console.log('Payment URL:', result.data.paymentUrl.substring(0, 100) + '...');
//         } else {
//             console.log('❌ FAILED');
//             console.log('Message:', result.message);
//         }
//     } catch (error) {
//         console.log('❌ ERROR');
//         console.error(error.message);
//     }
// }

// // Test 2: Tạo đơn hàng
// async function testCreateOrder() {
//     console.log('\n========================================');
//     console.log('Test 2: Tạo đơn hàng');
//     console.log('========================================');
    
//     const orderData = {
//         name: "Test User",
//         phone: "0383190880",
//         address: "Test Address, Hanoi",
//         account_id: null,
//         total_amount: 120000,
//         payment_method: "vnpay",
//         is_paid: false,
//         order_details: [
//             {
//                 product_sizes_id: 1, // Cần kiểm tra ID này có tồn tại trong DB
//                 quantity: 1,
//                 price: 120000
//             }
//         ]
//     };
    
//     try {
//         const response = await fetch('http://localhost:3006/orders', {
//             method: 'POST',
//             headers: {
//                 'Content-Type': 'application/json'
//             },
//             body: JSON.stringify(orderData)
//         });
        
//         const result = await response.json();
        
//         if (response.ok && result.id) {
//             console.log('✅ SUCCESS');
//             console.log('Order ID:', result.id);
//             console.log('Order details:', result);
//             return result.id;
//         } else {
//             console.log('❌ FAILED');
//             console.log('Response:', result);
//         }
//     } catch (error) {
//         console.log('❌ ERROR');
//         console.error(error.message);
//     }
// }

// // Test 3: Tích hợp - Tạo order và payment URL
// async function testFullFlow() {
//     console.log('\n========================================');
//     console.log('Test 3: Luồng đầy đủ (Order + VNPay)');
//     console.log('========================================');
    
//     // Tạo đơn hàng
//     const orderId = await testCreateOrder();
    
//     if (orderId) {
//         console.log('\n→ Tạo payment URL cho order', orderId);
        
//         const vnpayData = {
//             orderId: orderId.toString(),
//             amount: 120000,
//             orderInfo: `Thanh toan don hang #${orderId}`,
//             orderType: 'billpayment',
//             language: 'vn'
//         };
        
//         try {
//             const response = await fetch('http://localhost:3006/vnpay/create_payment_url', {
//                 method: 'POST',
//                 headers: {
//                     'Content-Type': 'application/json'
//                 },
//                 body: JSON.stringify(vnpayData)
//             });
            
//             const result = await response.json();
            
//             if (result.success) {
//                 console.log('✅ Payment URL created successfully');
//                 console.log('→ Redirect to:', result.data.paymentUrl.substring(0, 100) + '...');
//             } else {
//                 console.log('❌ Failed to create payment URL');
//             }
//         } catch (error) {
//             console.log('❌ ERROR creating payment URL');
//             console.error(error.message);
//         }
//     }
// }

// // Chạy test
// async function runTests() {
//     console.log('╔════════════════════════════════════════╗');
//     console.log('║   VNPay Integration Test Suite       ║');
//     console.log('╚════════════════════════════════════════╝');
//     console.log('\nĐảm bảo backend đang chạy tại http://localhost:3006\n');
    
//     await testCreatePaymentUrl();
//     await new Promise(resolve => setTimeout(resolve, 1000));
    
//     await testCreateOrder();
//     await new Promise(resolve => setTimeout(resolve, 1000));
    
//     await testFullFlow();
    
//     console.log('\n========================================');
//     console.log('Test hoàn tất!');
//     console.log('========================================\n');
// }

// // Run
// runTests();
