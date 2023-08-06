const mongoose=require('mongoose');
const User=require('../models/userModel');
const axios = require('axios')
const Product=require("../models/productModel");
const Category=require("../models/categoryModel");
const Cart=require("../models/cartModel")
const Offer=require('../models/offerModel')
const Order=require("../models/orderModel")
const Banner=require("../models/bannerModel")
const Coupon=require("../models/couponModel")
const Wallet=require("../models/walletModel")
const Razorpay = require("razorpay")
var moment = require("moment-timezone")

const addProductToCart=async(req,res)=>{
    try{
        res.set('Cache-Control', 'no-store');
        console.log("hello");
        const userId=req.params.user_id;
        const user=await User.findById(userId)
        const productId=req.params.product_id;
        let quantity=parseInt(req.body.numOfProducts)
        const product=await Product.findById(productId)
        let cart=await Cart.findOne({user:userId}).populate('products.product');
        const offer=await Offer.findOne({category:product.category._id})

        if(quantity<1){
            return res.render("productDetails1", { message: "Quantity should not be zero", product,user,cart,offer})
        }
        if(product.totalStock<1){
            return res.render("productDetails1", { message: "This product is Out of Stock", product,user,cart,offer})
        }
        if(quantity>product.totalStock){
            return res.render("productDetails1", { message: `Only ${product.totalStock} in stock`, product,user,cart,offer})
        }
        

        

        let cartItem={
            product:productId,
            productName:product.productName,
            quantity:quantity,
            price: offer ? product.offerPrice * quantity : product.price * quantity 
        }

        if(!cart){
            cart=new Cart({
                user:userId,
                products:[cartItem],
                totalAmount:cartItem.price
            })
            await cart.save()
        }else{

            const existingProduct = cart.products.find((item) =>
            item.product._id.toString() === product._id.toString()
        )

        if (existingProduct) {
            return res.render("productDetails1", { message: "Product is Already in the Cart", product,user,cart,offer})
        }

        cart.products.push(cartItem)
        cart.totalAmount += cartItem.price
        await cart.save()
        }

        // res.redirect(`/productDetails/${new mongoose.Types.ObjectId(userId)}/${new mongoose.Types.ObjectId(productId)}`)
        return res.render("productDetails1", { message2: "Product is Added to the Cart", product,user,cart,offer})

    }catch(err){
        console.log(err.message);
    }
}


const getShoppingCartPage=async (req,res)=>{
   try{
    res.set("Cache-Control", "no-store")
    const user=await User.findOne({_id:req.session.user_id})
    console.log(user)

    const coupons=await Coupon.find({is_active:true})

    const cartId=req.params.cart_id
    const order=await Order.findOne({cart:cartId})
    const products=await Product.find()
    const cart=await Cart.findById(cartId).populate("products.product").populate("user")
    const wallet=await Wallet.findOne({user:req.session.user_id})

    console.log(cart);

    res.render('shoppingCart',{user,products,cart,order,coupons,wallet})
   }catch(err){
    console.log(err.message);
   }
    
}

const deleteProductFromCart=async(req,res)=>{
    try{
        res.set("Cache-Control","no-store");
    const cartId=req.params.cart_id
    const productId=req.params.product_id

    const cartData=await Cart.findById(cartId).populate({
        path:"products.product",
        select:"price"
    });

    const productIndex=cartData.products.findIndex((item)=>item.product._id.toString() === new mongoose.Types.ObjectId(productId).toString());
    if(productIndex!==-1){
        cartData.products.splice(productIndex,1)
    }

    const updatedTotalAmount=cartData.products.reduce(
        (total,item)=> total +item.product.price * item.quantity,
        0
    );

    cartData.totalAmount=updatedTotalAmount;
    await cartData.save();

    res.redirect(`/shoppingCart/${new mongoose.Types.ObjectId(cartId)}`)
    }catch(err){
        console.log(err.message);
    }

}


const cartCheckout=async (req,res)=>{
    // res.render("loading")
    try {
        res.set("Cache-Control", "no-store")
        const userId = req.params.user_id
        const user = await User.findById(userId)
        const cartData = await Cart.findOne({ user: userId }).populate("products.product")
        const orderData = await Order.findOne({ cart: cartData._id })
        const coupons=await Coupon.find({is_active:true})
        const wallet = await Wallet.findOne({ user: userId });
        const paymentMethod=req.body.paymentMethod
        console.log(paymentMethod);
        console.log("hi");
        
        const addressIndex1=req.body.shippingAddress;

        if (cartData.products.length === 0) {
            return res.status(400).json({ message: "Cart is Empty" })
        }

        if (!orderData) {
            return res.render("shoppingCart", { message: "Please Enter a Shipping Address", user, cart: cartData, order:orderData ,coupons,wallet})
        }

        if(paymentMethod==="COD"){
    
            cartData.products.forEach(async (item) => {
                const purchasedProduct = {
                    userName: user.fullName,
                    product: item.product._id,
                    quantity: item.quantity,
                    paymentMethod:req.body.paymentMethod,
                    address:{
                        name:orderData.shippingAddress[addressIndex1].name,
                        houseName:orderData.shippingAddress[addressIndex1].houseName,
                        place:orderData.shippingAddress[addressIndex1].place,
                        city:orderData.shippingAddress[addressIndex1].city,
                        district:orderData.shippingAddress[addressIndex1].district,
                        state:orderData.shippingAddress[addressIndex1].state,
                        pinCode:orderData.shippingAddress[addressIndex1].pinCode,
                        phoneNumber:orderData.shippingAddress[addressIndex1].phoneNumber
                    } ,
                    status: "Pending",
                    date: moment().format("YYYY-MM-DD HH:mm:ss")
                }
                console.log(purchasedProduct);
                orderData.purchasedProducts.push(purchasedProduct)
    
                const product = await Product.findById(item.product._id)
                product.totalStock -= item.quantity
                await product.save()
    
            })
    
            await orderData.save()
    
            cartData.products = []
            cartData.totalAmount = 0
    
            await cartData.save()
    
            res.render('orderSuccess',{user})

        }else if(paymentMethod==="wallet"){
            if(wallet.balance >= cartData.totalAmount  && wallet.balance > 0){
                cartData.products.forEach(async (item)=>{
                    
                    const purchasedProducts={
                        userName:user.fullName,
                        product:item.product._id,
                        quantity:item.quantity,
                        paymentMethod:"Wallet",
                        address:{
                            name: orderData.shippingAddress[addressIndex1].name,
                            houseName: orderData.shippingAddress[addressIndex1].houseName,
                            place: orderData.shippingAddress[addressIndex1].place,
                            city: orderData.shippingAddress[addressIndex1].city,
                            district: orderData.shippingAddress[addressIndex1].district,
                            state: orderData.shippingAddress[addressIndex1].state,
                            pinCode: orderData.shippingAddress[addressIndex1].pinCode,
                            phoneNumber: orderData.shippingAddress[addressIndex1].phoneNumber
                        },
                        status:"Pending",
                        date: moment().format('YYYY-MM-DD HH:mm:ss')
                    };
                    orderData.purchasedProducts.push(purchasedProducts)
                    const product = await Product.findById(item.product._id);
                    product.quantity -= item.quantity;
                    await product.save();
                })
    
                await orderData.save();
                wallet.balance-=cartData.totalAmount;
    
                const debit={
                    order: orderData._id,
                    date: new Date(),
                    amount: cartData.totalAmount
                };
                wallet.debits.push(debit)
    
                await wallet.save();
                cartData.products=[]
                cartData.totalAmount=0;
                await wallet.save();
    
                await cartData.save();
    
                res.render('orderSuccess',{user})
    
    
            }else if(wallet.balance < cartData.totalAmount){
                const debit={
                    order:orderData._id,
                    date:new Date(),
                    amount:wallet.balance
                };
                wallet.debits.push(debit);
    
                cartData.totalAmount-=wallet.balance;
                await cartData.save();
    
                wallet.balance=0;
                await wallet.save();
    
                res.redirect(`/shoppingCart/${new mongoose.Types.ObjectId(cartData._id)}`)
            }else{
                res.redirect(`/shoppingCart/${new mongoose.Types.ObjectId(cartData._id)}`)
            }
            
        } else {
            console.log("Razor_pay");
            if (!orderData) {
                return res.render("shoppingCart", { message: "Please Enter a Shipping Address", user, cart: cartData, order:orderData ,coupons,wallet})
            }
            const { RAZORPAY_ID_KEY, RAZORPAY_SECRET_KEY } = process.env

            const razorpay = new Razorpay({
                key_id: RAZORPAY_ID_KEY,
                key_secret: RAZORPAY_SECRET_KEY
            })
            const amount = cartData.totalAmount * 100
            const options = {
                amount: amount,
                currency: "INR",
                receipt: "razorPayUser@gmail.com"
            }

            razorpay.orders.create(options, async (error, order) => {
                if (!error) {

                    res.status(200).send({
                        success: true,
                        msg: "Order Created",
                        order_id: order.id,
                        amount: amount,
                        key_id: RAZORPAY_ID_KEY,
                    })

                    const paymentId = req.body.paymentId;
                    const orderId = req.body.orderId;
                    const signature = req.body.signature;
                    const addressIndex=req.body.addressIndex;
                    console.log(paymentId, orderId, signature)

                    if (paymentId === undefined || paymentId === null) {
                        // return res.status(400).json({ success: false, message: "Payment Cancelled" });
                        return console.log("Order is in Progress")
                    }
                        
                    cartData.products.forEach(async (item) => {

                            const purchasedProduct = {
                                userName: user.fullName,
                                product: item.product._id,
                                quantity: item.quantity,
                                paymentMethod:req.body.paymentMethod,
                                address:{
                                    name:orderData.shippingAddress[addressIndex].name,
                                    houseName:orderData.shippingAddress[addressIndex].houseName,
                                    place:orderData.shippingAddress[addressIndex].place,
                                    city:orderData.shippingAddress[addressIndex].city,
                                    district:orderData.shippingAddress[addressIndex].district,
                                    state:orderData.shippingAddress[addressIndex].state,
                                    pinCode:orderData.shippingAddress[addressIndex].pinCode,
                                    phoneNumber:orderData.shippingAddress[addressIndex].phoneNumber
                                },
                                status: "Pending",
                                date: moment().format("YYYY-MM-DD HH:mm:ss")
                            }
                            console.log(purchasedProduct);
                            orderData.purchasedProducts.push(purchasedProduct)
    
                            const product = await Product.findById(item.product._id)
                            product.totalStock -= item.quantity
                            await product.save()
    
                        })
    
                        await orderData.save()
    
                        cartData.products = []
                        cartData.totalAmount = 0
    
                        await cartData.save()
                        
                } else {
                    res.status(400).send({ success: false, message: "Something Went Wrong" })
                }
            })
        }


    } catch (error) {
        console.log(error.message)
    }
}


const updateCart = async (req, res) => {
    try {
        res.set("Cache-Control", "no-store")
        const userId = req.session.user_id
        const cartData = await Cart.findOne({ user: userId }).populate({
            path: "products.product",
            select: "price product category totalStock offerPrice"
        })
        
        console.log(cartData.products)
        const cartId = cartData._id
        const quantities = req.body.numOfproducts;


        cartData.products.forEach((item, index) => {
            item.quantity = quantities[index];
            item.price = item.product.offerPrice > 0 ? item.product.offerPrice * item.quantity : item.product.price * item.quantity;
          });

        const updatedTotalAmount = cartData.products.reduce(
            (total, item) => total + item.price,
            0
        );

        cartData.totalAmount = updatedTotalAmount;

        await cartData.save();
        res.json({
            subtotal: cartData.totalAmount,
            total: cartData.totalAmount 
        })
    } catch (error) {
        console.log(error.message);
        res.status(500).json({ error: "An error occurred while updating the cart." })
    }
}


module.exports={
    addProductToCart,
    getShoppingCartPage,
    deleteProductFromCart,
    cartCheckout,
    updateCart
}