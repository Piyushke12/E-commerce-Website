var Product = require("../models/product");

var mongoose = require("mongoose");
mongoose.connect("mongodb+srv://piyush:1lgA9BLtRfdmDrAS@cluster-1.sh8nn.mongodb.net/?retryWrites=true&w=majority&appName=Cluster-1", 
    {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });

var product = [
    new Product({
        imagePath: "https://cdn.wccftech.com/wp-content/uploads/2020/06/PS5-Reveal.jpg",
        title: "Play Station 5",
        description: "Some Description about Products",
        brand: "Sony Interactive Entertainment",
        category: "Appliances",
        price: 39990
    }),
    new Product({
        imagePath: "https://thumbs.dreamstime.com/b/sport-shoes-isolated-white-background-41616578.jpg",
        title: "Adidas Shoes",
        description: "Some Description about Products",
        price: 999,
        brand: "Adidas",
        category: "Shoes"
    }),
    new Product({
        imagePath: "https://wingrep.com/wp-content/uploads/2015/11/SoundMAGIC-ES18-Best-Sound-Isolating-Headphones.jpg",
        title: "Boat Earphones",
        description: "Some Description about Products",
        price: 599,
        brand: "Boat",
        category: "Earphones"
    }),
    new Product({
        imagePath:"https://i.pinimg.com/originals/c7/5f/93/c75f93a4f9170bfcef062013227cb6be.png",
        title: "World War 3 Game",
        description: "Some Description about Products",
        price: 799,
        brand: "Tencent",
        category: "Games"
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
