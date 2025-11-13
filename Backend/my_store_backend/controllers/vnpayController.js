/**
 * VNPay Payment Controller
 * Xử lý thanh toán qua VNPay
 */

import crypto from 'crypto';
import querystring from 'qs';
import moment from 'moment';

// VNPay Configuration (Sandbox)
const vnpayConfig = {
    vnp_TmnCode: "AFHY5UKO",
    vnp_HashSecret: "A67W4EVFQOSKGMO5U38Y5HT20WFI0LE2",
    vnp_Url: "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html",
    vnp_Api: "https://sandbox.vnpayment.vn/merchant_webapi/api/transaction",
    vnp_ReturnUrl: "http://localhost:3000/vnpay-return" // Frontend return URL
};

// Hàm sắp xếp object theo alphabet
function sortObject(obj) {
    let sorted = {};
    let str = [];
    let key;
    for (key in obj) {
        if (obj.hasOwnProperty(key)) {
            str.push(encodeURIComponent(key));
        }
    }
    str.sort();
    for (key = 0; key < str.length; key++) {
        sorted[str[key]] = encodeURIComponent(obj[str[key]]).replace(/%20/g, "+");
    }
    return sorted;
}

// Tạo URL thanh toán VNPay
const createPaymentUrl = (req, res) => {
    try {
        process.env.TZ = 'Asia/Ho_Chi_Minh';
        
        let date = new Date();
        let createDate = moment(date).format('YYYYMMDDHHmmss');
        
        let ipAddr = req.headers['x-forwarded-for'] ||
            req.connection.remoteAddress ||
            req.socket.remoteAddress ||
            req.connection.socket.remoteAddress;

        let tmnCode = vnpayConfig.vnp_TmnCode;
        let secretKey = vnpayConfig.vnp_HashSecret;
        let vnpUrl = vnpayConfig.vnp_Url;
        let returnUrl = vnpayConfig.vnp_ReturnUrl;

        let orderId = req.body.orderId || moment(date).format('DDHHmmss');
        let amount = req.body.amount;
        let bankCode = req.body.bankCode || '';
        let orderInfo = req.body.orderInfo || 'Thanh toan don hang';
        let orderType = req.body.orderType || 'other';
        let locale = req.body.language || 'vn';
        
        if (!amount || amount <= 0) {
            return res.status(400).json({
                success: false,
                message: 'Số tiền không hợp lệ'
            });
        }

        let currCode = 'VND';
        let vnp_Params = {};
        vnp_Params['vnp_Version'] = '2.1.0';
        vnp_Params['vnp_Command'] = 'pay';
        vnp_Params['vnp_TmnCode'] = tmnCode;
        vnp_Params['vnp_Locale'] = locale;
        vnp_Params['vnp_CurrCode'] = currCode;
        vnp_Params['vnp_TxnRef'] = orderId;
        vnp_Params['vnp_OrderInfo'] = orderInfo;
        vnp_Params['vnp_OrderType'] = orderType;
        vnp_Params['vnp_Amount'] = amount * 100; // VNPay yêu cầu số tiền x100
        vnp_Params['vnp_ReturnUrl'] = returnUrl;
        vnp_Params['vnp_IpAddr'] = ipAddr;
        vnp_Params['vnp_CreateDate'] = createDate;
        
        if (bankCode !== null && bankCode !== '') {
            vnp_Params['vnp_BankCode'] = bankCode;
        }

        vnp_Params = sortObject(vnp_Params);

        let signData = querystring.stringify(vnp_Params, { encode: false });
        let hmac = crypto.createHmac("sha512", secretKey);
        let signed = hmac.update(Buffer.from(signData, 'utf-8')).digest("hex");
        vnp_Params['vnp_SecureHash'] = signed;
        vnpUrl += '?' + querystring.stringify(vnp_Params, { encode: false });

        res.json({
            success: true,
            data: {
                paymentUrl: vnpUrl,
                orderId: orderId
            }
        });

    } catch (error) {
        console.error('Error creating VNPay payment URL:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi tạo link thanh toán VNPay',
            error: error.message
        });
    }
};

// Xác thực callback từ VNPay (vnpay_return)
const vnpayReturn = (req, res) => {
    try {
        let vnp_Params = req.query;
        
        console.log('📥 VNPay Return Query Params:', vnp_Params);
        
        let secureHash = vnp_Params['vnp_SecureHash'];

        delete vnp_Params['vnp_SecureHash'];
        delete vnp_Params['vnp_SecureHashType'];

        vnp_Params = sortObject(vnp_Params);

        let secretKey = vnpayConfig.vnp_HashSecret;
        let signData = querystring.stringify(vnp_Params, { encode: false });
        let hmac = crypto.createHmac("sha512", secretKey);
        let signed = hmac.update(Buffer.from(signData, 'utf-8')).digest("hex");

        console.log('🔐 Signature check:', {
            receivedHash: secureHash,
            calculatedHash: signed,
            match: secureHash === signed
        });

        if (secureHash === signed) {
            // Checksum hợp lệ
            res.json({
                success: true,
                code: vnp_Params['vnp_ResponseCode'],
                message: vnp_Params['vnp_ResponseCode'] === '00' ? 'Giao dịch thành công' : 'Giao dịch thất bại',
                data: {
                    orderId: vnp_Params['vnp_TxnRef'],
                    amount: vnp_Params['vnp_Amount'] / 100,
                    orderInfo: vnp_Params['vnp_OrderInfo'],
                    responseCode: vnp_Params['vnp_ResponseCode'],
                    transactionNo: vnp_Params['vnp_TransactionNo'],
                    bankCode: vnp_Params['vnp_BankCode'],
                    payDate: vnp_Params['vnp_PayDate']
                }
            });
        } else {
            res.json({
                success: false,
                code: '97',
                message: 'Chữ ký không hợp lệ'
            });
        }
    } catch (error) {
        console.error('Error processing VNPay return:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi xử lý kết quả thanh toán',
            error: error.message
        });
    }
};

// IPN callback (dành cho server-to-server callback từ VNPay)
const vnpayIPN = (req, res) => {
    try {
        let vnp_Params = req.query;
        let secureHash = vnp_Params['vnp_SecureHash'];

        let orderId = vnp_Params['vnp_TxnRef'];
        let rspCode = vnp_Params['vnp_ResponseCode'];

        delete vnp_Params['vnp_SecureHash'];
        delete vnp_Params['vnp_SecureHashType'];

        vnp_Params = sortObject(vnp_Params);
        
        let secretKey = vnpayConfig.vnp_HashSecret;
        let signData = querystring.stringify(vnp_Params, { encode: false });
        let hmac = crypto.createHmac("sha512", secretKey);
        let signed = hmac.update(Buffer.from(signData, 'utf-8')).digest("hex");

        // Kiểm tra checksum
        if (secureHash === signed) {
            // TODO: Kiểm tra orderId có tồn tại trong DB không
            // TODO: Kiểm tra số tiền có khớp không
            // TODO: Kiểm tra trạng thái đơn hàng

            let checkOrderId = true; // Kiểm tra orderId trong DB
            let checkAmount = true; // Kiểm tra amount khớp
            
            if (checkOrderId) {
                if (checkAmount) {
                    if (rspCode === "00") {
                        // Thanh toán thành công
                        // TODO: Cập nhật trạng thái đơn hàng trong DB
                        console.log(`Payment success for order ${orderId}`);
                        res.status(200).json({ RspCode: '00', Message: 'Success' });
                    } else {
                        // Thanh toán thất bại
                        // TODO: Cập nhật trạng thái đơn hàng trong DB
                        console.log(`Payment failed for order ${orderId}`);
                        res.status(200).json({ RspCode: '00', Message: 'Success' });
                    }
                } else {
                    res.status(200).json({ RspCode: '04', Message: 'Amount invalid' });
                }
            } else {
                res.status(200).json({ RspCode: '01', Message: 'Order not found' });
            }
        } else {
            res.status(200).json({ RspCode: '97', Message: 'Checksum failed' });
        }
    } catch (error) {
        console.error('Error processing VNPay IPN:', error);
        res.status(500).json({ RspCode: '99', Message: 'Unknown error' });
    }
};

export default {
    createPaymentUrl,
    vnpayReturn,
    vnpayIPN
};
