import axios from 'axios'
import crypto from 'crypto';
import {encrypt} from "./utils.js";

const BASE_URL = 'https://api.wayforpay.com/api';
export const SECRET_KEY = process.env.WAY_FOR_PAY_KEY;
export const createPayment = async (id, amount, plan, currency = 'EUR') => {
    const wayforpaySettings = {
        transactionType: 'CREATE_INVOICE',
        merchantAccount: 'test_merch_n1',
        merchantDomainName: 'utprozorro.com.ua',
        apiVersion: '1',
        serviceUrl: 'https://7dac-2a02-8440-d400-6d32-69b9-ca2c-9281-1fea.ngrok-free.app/wayforpay-callback'
    }

    const paymentData = {
        orderReference: `ORDER__${plan}__${id}__${Date.now()}`,
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

    const hash = encrypt(stringifyData, SECRET_KEY)

    const payload = {
        ...wayforpaySettings,
        ...paymentData,
        merchantSignature: hash
    };

    try {
        const { data, status } = await axios.post(BASE_URL, payload);
        if (status === 200) return data
    } catch (err) {
        console.error(err)
    }
}
