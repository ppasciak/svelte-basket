const randomNumber = (n, m) => Math.floor((Math.random() * m) + n);

const data = [
    {
        id: 0,
        name: 'Apple M1 Chip with 8-Core CPU and 7-Core GPU256GB Storage',
        price: 999.00,
        taxRate: 0.23,
        quantity: randomNumber(1,6),
        image: 'macbook-air-space-gray-select-201810.jpg'
    },{
        id: 1,
        name: 'Apple Watch Blue Aluminum Case with Solo Loop',
        price: 399.00,
        taxRate: 0.23,
        quantity: randomNumber(1,6),
        image: 'MJHL3ref_VW_34FR+watch-44-alum-blue-nc-6s_VW_34FR_WF_CO.jpg'
    },{
        id: 2,
        name: 'Apple Mac Mini M1 Chip with 8-Core CPU and 8-Core GPU 256GB Storage',
        price: 699.00,
        taxRate: 0.23,
        quantity: randomNumber(1,6),
        image: 'mac-mini-hero-202011.jpg'
    },{
        id: 3,
        name: 'Apple AirTag',
        price: 29.00,
        taxRate: 0.13,
        quantity: randomNumber(1,6),
        image: 'airtag-double-select-202104.jpg'
    },{
        id: 4,
        name: 'Apple iMac M1 Chip with 8-Core CPU and 7-Core GPU 256GB Storage',
        price: 1299.00,
        taxRate: 0.19,
        quantity: randomNumber(1,6),
        image: 'imac-24-blue-selection-hero-202104.jpg'
    },{
        id: 5,
        name: 'Apple 16-inch MacBook Pro 2.3GHz 8-Core Processor 1TB Storage AMD Radeon Pro 5500M',
        price: 2799.00,
        taxRate: 0.20,
        quantity: randomNumber(1,6),
        image: 'mbp16touch-space-select-201911.jpg'
    },{
        id: 6,
        name: 'Pro Display XDR',
        price: 4999.00,
        taxRate: 0.13,
        quantity: randomNumber(1,6),
        image: 'pro-display-hero.jpg'
    }
];

const pickRandomProducts = () => {
    const itemsCount = randomNumber(1, data.length - 1);
    const randomProducts = data.sort(() => .5 - Math.random()).slice(0,itemsCount);
    return randomProducts;
}

export const fetchProducts = () => {
    return new Promise((resolve, reject) => {
        setTimeout(function () {
            resolve(pickRandomProducts());
        }, Math.random() * 1000);
    });
}