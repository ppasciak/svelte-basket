const data = [
    {
        id: 0,
        name: 'Standard',
        price: 0
    },{
        id: 1,
        name: 'UPS',
        price: 3.99
    },{
        id: 2,
        name: 'Express delivery',
        price: 5.90,
    }
];


export const fetchDeliveryMethods = () => {
    return new Promise((resolve, reject) => {
        setTimeout(function () {
            resolve(data);
        }, Math.random() * 1000);
    });
}