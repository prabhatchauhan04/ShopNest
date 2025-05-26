require('dotenv').config();
const port = 4000;
const express = require("express");
const app = express();
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const multer = require("multer");
const path = require("path");
const cors = require("cors");


app.use(express.json());
app.use(cors());

// Connect to MongoDB using URI from .env
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.error(err)); 

// API Creation

app.get("/",(req,res)=>{
    res.send("Express App is Running")
})

// Image Storage Engine

const storage = multer.diskStorage({
    destination: './upload/images',
    filename:(req,file,cb)=>{
        return cb(null,`${file.fieldname}_${Date.now()}${path.extname(file.originalname)}`);
    }
})

const upload = multer({storage:storage});

// Creating Upload End Point for images
app.use('/images',express.static('upload/images'))
app.post("/upload",upload.single('product'),(req,res)=>{
    res.json({
        success:1,
        image_url:`http://localhost:${port}/images/${req.file.filename}`
    })
})


// MiddleWare to fetch user from database
const fetchuser = async (req, res, next) => {
  const token = req.header("auth-token");
  if (!token) {
    res.status(401).send({ errors: "Please authenticate using a valid token" });
  }
  try {
    const data = jwt.verify(token, 'secret_ecom');
    req.user = data.user;
    next();
  } catch (error) {
    res.status(401).send({ errors: "Please authenticate using a valid token" });
  }
};

// Schema for Creating Products

const Product = mongoose.model("Product",{
    id:{
        type: Number,
        required: true,
    },
    name:{
        type: String,
        required: true,
    },
    image:{
        type: String,
        required: true,
    },
    category:{
        type: String,
        required: true,
    },
    new_price:{
        type: Number,
        required: true,
    },
    old_price:{
        type: Number,
        required: true,
    },
    date:{
        type: Date,
        default: Date.now,
    },
    available:{
        type: Boolean,
        default: true,
    }
})

app.post('/addproduct', async (req,res)=>{
    let products = await Product.find({});
    let id;
    if(products.length>0){
        let last_product_array = products.slice(-1);
        let last_product = last_product_array[0];
        id = last_product.id+1;
    }
    else{
        id=1;
    }
    const product = new Product({
        id: id,
        name: req.body.name,
        image: req.body.image,
        category: req.body.category,
        new_price: req.body.new_price,
        old_price: req.body.old_price,
    });
    console.log(product);
    await product.save(); // saves product in mongodb database
    console.log("Saved");
    res.json({
        success: true,
        name: req.body.name,
    });
})


// Creating API For Deleting Products

app.post('/removeproduct', async (req,res)=>{
    await Product.findOneAndDelete({id:req.body.id});
    console.log("Removed");
    res.json({
        success: true,
        name: req.body.name
    })
})


// Creating API for Getting All Products
app.get('/allproducts', async (req,res)=>{
    let products = await Product.find({});
    console.log("All Products Fetched");
    res.send(products);
})


// Schema for creating user model
const Users = mongoose.model("Users", {
  name: {
    type: String,
  },
  email: {
    type: String,
    unique: true,
  },
  password: {
    type: String,
  },
  cartData: {
    type: Object,
  },
  date: {
    type: Date,
    default: Date.now,
  },
});

//Create an endpoint for registering the user in data base
app.post('/signup', async (req, res) => {
        let check = await Users.findOne({ email: req.body.email });
        if (check) {
            return res.status(400).json({ success:false, errors: "existing user found with this email" });
        }
        let cart = {};
        for (let i = 0; i < 300; i++) {
          cart[i] = 0;
        }
        // creating user
        const user = new Users({
            name: req.body.username,
            email: req.body.email,
            password: req.body.password,
            cartData: cart,
        });
        await user.save(); // saving user in database
        const data = {
            user: {
                id: user.id
            }
        }
        
        const token = jwt.sign(data, 'secret_ecom');
        success = true; 
        res.json({ success:true, token })
    })


//Create an endpoint for user login
app.post('/login', async (req, res) => {
    let user = await Users.findOne({ email: req.body.email });
    if (user) {
        const passCompare = req.body.password === user.password; // checking user entered password
        if (passCompare) {
            const data = {
                user: {
                    id: user.id
                }
            }
			const token = jwt.sign(data, 'secret_ecom');
			res.json({success:true,token});
        }
        else {
            return res.status(400).json({success:false, errors: "Wrong Password"})
        }
    }
    else {
        // if there is no user with that mail
        return res.status(400).json({success: false, errors: "Wrong email id"})
    }
})


// Creating end point for new collections data
app.get("/newcollections", async (req, res) => {
  let products = await Product.find({});
  let arr = products.slice(1).slice(-8); // new collection array arr
  console.log("New Collections fetched");
  res.send(arr);
});

// Creating end point for popular in women category
app.get("/popularinwomen", async (req, res) => {
  let products = await Product.find({category:"women"});
  let arr = products.splice(0,  4);
  console.log("Popular In Women fetched");
  res.send(arr);
});

//Create an endpoint for adding product in cart
app.post('/addtocart', fetchuser, async (req, res) => {
    let userData = await Users.findOne({_id:req.user.id});
    userData.cartData[req.body.itemId] += 1; // increased item id by 1 for that user
    await Users.findOneAndUpdate({_id:req.user.id}, {cartData:userData.cartData});
    res.send("Added")
  })

//Create an endpoint for saving the product in cart
app.post('/removefromcart', fetchuser, async (req, res) => {
    let userData = await Users.findOne({_id:req.user.id}); // "_id" is user id in mongodb
    if(userData.cartData[req.body.itemId]!=0)
    {
      userData.cartData[req.body.itemId] -= 1;
    }
    await Users.findOneAndUpdate({_id:req.user.id}, {cartData:userData.cartData});
    res.send("Removed");
  })

//Create an endpoint to get cart data
app.post('/getcart', fetchuser, async (req, res) => {
  let userData = await Users.findOne({_id:req.user.id});
  res.json(userData.cartData);
})


app.listen(port,(error)=>{
    if(!error){
        console.log("Server Running on Port "+port);
    }else{
        console.log("Error : "+error);
    }
})