import axios from 'axios'
import crypto from 'crypto';
import {encrypt} from "./utils.js";

const BASE_URL = 'https://api.wayforpay.com/api';
export const SECRET_KEY = process.env.WAY_FOR_PAY_KEY;
export const createPayment = async (id, {amount, currency, products, label}) => {
    const wayforpaySettings = {
        transactionType: 'CREATE_INVOICE',
        merchantAccount: 'freelance_user_676d9a1c9555d',
        merchantDomainName: 't.me/rendezVousNice_bot',
        apiVersion: '1',
        serviceUrl: 'https://6b21-2a02-8440-d400-6d32-f58d-8a0c-5cb9-39bb.ngrok-free.app/wayforpay-callback'
    }

    const paymentData = {
        orderReference: `ORDER__${label}__${id}__${Date.now()}`,
        orderDate: Date.now(),
        amount,
        currency,
        ...products
    }



    const stringifyData = [
        wayforpaySettings.merchantAccount,
        wayforpaySettings.merchantDomainName,
        paymentData.orderReference,
        paymentData.orderDate,
        paymentData.amount,
        paymentData.currency,
        paymentData.productName[0],
        paymentData.productCount[0],
        paymentData.productPrice[0],
    ].join(';')

    const hash = encrypt(stringifyData, SECRET_KEY)

    console.log('resp1', SECRET_KEY)

    const payload = {
        ...wayforpaySettings,
        ...paymentData,
        merchantSignature: hash
    };

    console.log(stringifyData, 'resp1')

    try {
        const { data, status } = await axios.post(BASE_URL, payload);
        if (status === 200) return data
    } catch (err) {
        console.error(err)
    }
}
