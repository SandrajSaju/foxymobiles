const express=require("express")
const userRoute=express()
const session=require("express-session")
const userControllers=require('../controllers/userControllers')
const productControllers=require('../controllers/productControllers')
const cartControllers=require('../controllers/cartControllers')
const addressControllers=require('../controllers/addressControllers')
const orderControllers=require('../controllers/orderControllers')
const couponControllers=require('../controllers/orderControllers')
const userAuth=require('../middlewares/userAuth')
const bodyParser = require('body-parser');

userRoute.use(session({
    secret:"mySecretKey1234",
    resave:false,
    saveUninitialized:true
}))

userRoute.use(bodyParser.urlencoded({ extended: true }));
userRoute.use(bodyParser.json());
userRoute.set('view engine','ejs')
userRoute.set('views','./views/userViews')




userRoute.use(express.urlencoded({extended:true}))

userRoute.get("/",userAuth.isLogout,userControllers.getGuestHome)
userRoute.get("/userSignup",userAuth.isLogout,userControllers.getSignupPage)
userRoute.get("/userLogin",userAuth.isLogout,userControllers.getLoginPage)
userRoute.post("/userSignup",userControllers.insertUser)
userRoute.post("/otpVerification/:phoneNumber",userControllers.verifyOtp)
userRoute.get("/otpVerify/:phoneNumber",userControllers.getOtpVerificationPage)
userRoute.post("/resendOtp/:phoneNumber",userControllers.resendOtp)


userRoute.post("/userLogin",userControllers.verifyLogin)
userRoute.get('/userHome',userAuth.isLogin,userControllers.getUserHome)
userRoute.get('/logout',userAuth.isLogin,userControllers.userLogout)
userRoute.get('/allProducts/:user_id',userAuth.isLogin,productControllers.getAllProductsPage)
userRoute.get('/productDetails/:user_id/:product_id',userAuth.isLogin,productControllers.getProductDetailsPage)
userRoute.get('/productDetails/:product_id',userAuth.isLogin,productControllers.getProductDetailsPage)
userRoute.get('/forgetPassword',userAuth.isLogout,userControllers.getForgetPasswordPage)
userRoute.post('/forgetPassword',userControllers.verifyForgetphoneNumber)
userRoute.post('/forgetOtpVerification/:phoneNumber',userControllers.verifyForgetOtp)
userRoute.get('/resetPassword/:phoneNumber',userAuth.isLogout,userControllers.getResetPasswordPage)
userRoute.post('/resetPassword/:phoneNumber',userControllers.resetPassword)
userRoute.get("/userProfile/:user_id",userAuth.isLogin,userControllers.getUserProfilePage)
userRoute.get("/userEdit/:user_id",userAuth.isLogin,userControllers.getUserEditPage)
userRoute.post("/userEdit/:user_id",userAuth.isLogin,userControllers.updateUserProfile)
userRoute.post("/productDetails/:user_id/:product_id",userAuth.isLogin,cartControllers.addProductToCart)
userRoute.get("/resendOTP/:phoneNumber",userAuth.isLogout,userControllers.resendOtp)

userRoute.get('/shoppingCart/:cart_id',userAuth.isLogin,cartControllers.getShoppingCartPage)
userRoute.get('/deleteProductFromCart/:cart_id/:product_id',cartControllers.deleteProductFromCart)
userRoute.get("/shippingDetails/:user_id",userAuth.isLogin,addressControllers.getShippingAddress)
userRoute.post("/shippingDetails/:user_id",userAuth.isLogin,addressControllers.insertNewShippingAddress)
userRoute.get("/addAddress/:user_id",userAuth.isLogin,addressControllers.getAddShippingAddressPage)
userRoute.get("/updateShippingAddress/:user_id",userAuth.isLogin,addressControllers.getEditShippingAddressPage)
userRoute.post("/updateShippingAddress/:user_id",userAuth.isLogin,addressControllers.updateShippingAddress)
userRoute.post("/deleteShippingAddress/:user_id",userAuth.isLogin,addressControllers.deleteShippingAddress)
userRoute.post("/shoppingCart/checkout/:user_id",userAuth.isLogin,cartControllers.cartCheckout)
userRoute.post("/updateCart",cartControllers.updateCart)
userRoute.post("/applyCoupon",userControllers.applyCoupon)
userRoute.get("/userOrders/:user_id",userAuth.isLogin,orderControllers.getUserOrdersPage)
userRoute.post("/cancelOrder/:order_id/:product_id/:user_id/:purchasedProduct_id",orderControllers.cancelOrder)
userRoute.get('/orderSuccess/:user_id',userAuth.isLogin,userControllers.getSuccessPage)
userRoute.get("/wallet/:user_id",userAuth.isLogin,userControllers.getWalletPage)
userRoute.post("/returnOrder/:order_id/:product_id/:user_id/:purchasedProducts_id",orderControllers.returnOrder)

userRoute.get("/search",userAuth.isLogin,userControllers.searchProducts)
userRoute.get("/shop/:category_id",userAuth.isLogin,userControllers.getShopByCategoryPage)
userRoute.get("/userInvoice/:cart_id/:purchased_date",userAuth.isLogin,userControllers.downloadInvoice)






module.exports=userRoute