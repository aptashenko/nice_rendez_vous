import axios from 'axios'
import crypto from 'crypto';

const BASE_URL = 'https://api.wayforpay.com/api';
export const SECRET_KEY = process.env.WAY_FOR_PAY_KEY;
export const createPayment = async (id, amount, currency = 'EUR') => {
    const wayforpaySettings = {
        transactionType: 'CREATE_INVOICE',
        merchantAccount: 'test_merch_n1',
        merchantDomainName: 'utprozorro.com.ua',
        apiVersion: '1',
    }

    const paymentData = {
        orderReference: `ORDER-${id}-${Date.now()}`,
        orderDate: Date.now(),
        amount,
        currency,
        productName: ['test'],
        productPrice: [1],
        productCount: [1]
    }

    const stringifyData = [
        wayforpaySettings.merchantAccount,
        wayforpaySettings.merchantDomainName,
        paymentData.orderReference,
        paymentData.orderDate,
        paymentData.amount,
        paymentData.currency,
        paymentData.productName[0],
        paymentData.productPrice[0],
        paymentData.productCount[0],
    ].join(';')

    const hmac = crypto.createHmac('md5', SECRET_KEY);

    hmac.update(stringifyData);
    const hash = hmac.digest('hex');

    const payload = {
        ...wayforpaySettings,
        ...paymentData,
        merchantSignature: hash
    };

    try {
        const { data, status } = await axios.post(BASE_URL, payload);
        console.log(data)
    } catch (err) {
        console.error(err)
    }
}
