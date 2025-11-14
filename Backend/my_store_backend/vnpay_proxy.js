/**
 * VNPay Proxy Server - Port 8888
 * Nhận callback từ VNPay và redirect về frontend React
 */

const express = require('express');
const app = express();
const PORT = 8888;

// Route nhận callback từ VNPay
app.get('/order/vnpay_return', (req, res) => {
    try {
        console.log('📥 VNPay callback received at proxy server');
        console.log('Query params:', req.query);

        // Lấy tất cả query params từ VNPay
        const queryParams = new URLSearchParams(req.query).toString();
        
        // Redirect về frontend React với tất cả params
        const frontendUrl = `http://localhost:3000/vnpay-return?${queryParams}`;
        
        console.log('🔄 Redirecting to frontend:', frontendUrl);
        
        res.redirect(frontendUrl);
    } catch (error) {
        console.error('❌ Error in VNPay proxy:', error);
        res.redirect(`http://localhost:3000/vnpay-return?error=${encodeURIComponent(error.message)}`);
    }
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 VNPay Proxy Server running on http://localhost:${PORT}`);
    console.log(`📍 Listening for VNPay callbacks at http://localhost:${PORT}/order/vnpay_return`);
});
