var Product = require('../models/product');

var mongoose = require('mongoose');
mongoose.connect("mongodb://127.0.0.1/shopping", { useNewUrlParser: true, useUnifiedTopology: true });
var product = [
    new Product({
        imagePath:"https://cdn.wccftech.com/wp-content/uploads/2020/06/PS5-Reveal.jpg",
        title: 'Play Station 5',
        description: 'Latest Games!!',
        brand: 'Sony Interactive Entertainment',
        category: 'Appliances',
        price: 500
    }),
    new Product({
        imagePath: "https://cdn.wccftech.com/wp-content/uploads/2020/06/PS5-Reveal.jpg",
        title: 'Play Station 4',
        description: 'Latest Games!!',
        price: 400,
        brand: 'Sony Interactive Entertainment',
        category: 'mobile'
    }),
    new Product({
        imagePath: "https://cdn.wccftech.com/wp-content/uploads/2020/06/PS5-Reveal.jpg",
        title: 'Play Station 3',
        description: 'Latest Games!!',
        price: 300,
        brand: 'Sony Interactive Entertainment',
        category: 'mobile'
    }),
    new Product({
        imagePath: "https://cdn.wccftech.com/wp-content/uploads/2020/06/PS5-Reveal.jpg",
        title: 'Play Station 2',
        description: 'Latest Games!!',
        price: 200,
        brand: 'Sony Interactive Entertainment',
        category: 'mobile'
    })
];

var done = 0;
for (var i = 0; i < product.length; i++) {
    product[i].save(() => {
        done++;
        if (done === product.length)
            exit();
    });
}
function exit() {
    mongoose.disconnect();
}