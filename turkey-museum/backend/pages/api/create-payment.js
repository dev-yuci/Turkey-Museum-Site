import Iyzipay from 'iyzipay';

const iyzipay = new Iyzipay({
    apiKey: 'sandbox-AEpYKksX5pXbIP9uugMqNB7MmPrdmIfo',
    secretKey: 'sandbox-rcGBFiHBgiKXjN3ndDtuL6XPxYEFpGUE',
    uri: 'https://sandbox-api.iyzipay.com'
});

// Promise wrapper for iyzipay
const createCheckoutForm = (request) => {
    return new Promise((resolve, reject) => {
        iyzipay.checkoutFormInitialize.create(request, (err, result) => {
            if (err) {
                reject(err);
            } else {
                resolve(result);
            }
        });
    });
};

export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method not allowed' });
    }

    try {
        const { cart } = req.body;
        
        const request = {
            locale: 'tr',
            conversationId: '123456789',
            price: cart.reduce((total, item) => total + parseFloat(item.urunFiyati), 0).toString(),
            paidPrice: cart.reduce((total, item) => total + parseFloat(item.urunFiyati), 0).toString(),
            currency: 'TRY',
            basketId: 'B67832',
            paymentGroup: 'PRODUCT',
            callbackUrl: 'http://localhost:3000/api/payment-callback',
            
            buyer: {
                id: 'BY789',
                name: 'John',
                surname: 'Doe',
                gsmNumber: '+905350000000',
                email: 'email@email.com',
                identityNumber: '74300864791',
                registrationAddress: 'Nidakule Göztepe, Merdivenköy Mah. Bora Sok. No:1',
                ip: '85.34.78.112',
                city: 'Istanbul',
                country: 'Turkey'
            },
            
            shippingAddress: {
                contactName: 'Jane Doe',
                city: 'Istanbul',
                country: 'Turkey',
                address: 'Nidakule Göztepe, Merdivenköy Mah. Bora Sok. No:1',
            },
            
            billingAddress: {
                contactName: 'Jane Doe',
                city: 'Istanbul',
                country: 'Turkey',
                address: 'Nidakule Göztepe, Merdivenköy Mah. Bora Sok. No:1',
            },
            
            basketItems: cart.map((item, index) => ({
                id: `BI${index}`,
                name: item.urunIsmi,
                category1: 'Müze Ürünleri',
                itemType: 'PHYSICAL',
                price: item.urunFiyati
            }))
        };

        try {
            const result = await createCheckoutForm(request);
            return res.status(200).json(result);
        } catch (err) {
            console.error('İyzico hatası:', err);
            return res.status(400).json({ error: err.message });
        }

    } catch (error) {
        console.error('Ödeme oluşturulurken hata:', error);
        return res.status(500).json({ message: 'Ödeme işlemi başlatılamadı.' });
    }
} 