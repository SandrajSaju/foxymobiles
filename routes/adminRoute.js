const express=require("express");
const adminRoute=express();
const session=require("express-session")
const adminControllers=require("../controllers/adminControllers");
const productControllers=require('../controllers/productControllers')
const orderControllers=require('../controllers/orderControllers')
const couponControllers=require('../controllers/couponControllers')
const adminAuth=require("../middlewares/adminAuth")
const multer = require('multer')
const path=require("path")


adminRoute.use(session({
    secret:"mySecretKey1234",
    resave:false,
    saveUninitialized:true
}))

adminRoute.use(express.static('public'));

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, './public/productImages')
    },
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
      cb(null, file.fieldname + '-' + uniqueSuffix + file.originalname)
    }
  })
  
  const upload = multer({
    storage,
    fileFilter: (req, file, cb) => {
      const filetypes = /jpeg|jfif|jpg|png|webp/
      const extname = filetypes.test(path.extname(file.originalname).toLowerCase())
      const mimetype = filetypes.test(file.mimetype)
      if (mimetype && extname) {
        return cb(null, true)
      } else {
        return cb(null, false)
      }
    }
  })

  
  const bannerStorage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, './public/bannerImages');
    },
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      const extension = path.extname(file.originalname);
      const filename = file.fieldname + '-' + uniqueSuffix + extension;
      cb(null, filename);
    },
  });
  
  const bannerUpload = multer({
    storage: bannerStorage,
    fileFilter: (req, file, cb) => {
      const filetypes = /jpeg|jfif|jpg|png|webp/;
      const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
      const mimetype = filetypes.test(file.mimetype);
      if (mimetype && extname) {
        cb(null, true);
      } else {
        cb(new Error('Invalid file type'));
      }
    },
  });
  

adminRoute.set('view engine','ejs');
adminRoute.set('views','./views/adminViews');


adminRoute.use(express.urlencoded({extended:false}))

adminRoute.get('/',adminAuth.isAdminLogout,adminControllers.getAdminLogin);
adminRoute.post('/',adminControllers.verifyAdminLogin)
adminRoute.get('/home',adminAuth.isAdminLogin,adminControllers.getAdminHome)
adminRoute.get('/home/loadMore',adminAuth.isAdminLogin,adminControllers.getMoreDashboardPage)
adminRoute.get('/sales',adminAuth.isAdminLogin,adminControllers.getSalesFilterPage)
adminRoute.get('/salesReport', adminAuth.isAdminLogin, adminControllers.getSalesReportPage);
adminRoute.get('/salesReport/download',adminAuth.isAdminLogin, adminControllers.downloadSalesReport);

adminRoute.get('/logout',adminAuth.isAdminLogin,adminControllers.getAdminLogout)
adminRoute.get('/users',adminAuth.isAdminLogin,adminControllers.getUserList)
adminRoute.post('/block/:user_id',adminAuth.isAdminLogin,adminControllers.blockUser)
adminRoute.post('/unblock/:user_id',adminAuth.isAdminLogin,adminControllers.unblockUser)
adminRoute.get('/products',adminAuth.isAdminLogin,productControllers.getProductsPage)
adminRoute.get('/addProduct',adminAuth.isAdminLogin,productControllers.getAddProductPage)
adminRoute.get('/editProduct/:product_id',adminAuth.isAdminLogin,productControllers.getEditProductPage)
adminRoute.get('/deleteSingleImage/:product_id/:imageIndex',adminAuth.isAdminLogin,productControllers.deleteSingleImage)
adminRoute.post('/editProduct/:product_id',adminAuth.isAdminLogin,upload.fields([{name: 'image1', maxCount: 1}, {name: 'image2', maxCount: 1 }, {name: 'image3', maxCount: 1 },]),productControllers.updateProduct)
adminRoute.post('/addProduct',adminAuth.isAdminLogin,upload.fields([{ name: 'image1', maxCount: 1 }, { name: 'image2', maxCount: 1 }, { name: 'image3', maxCount: 1 },]),productControllers.insertProduct)
adminRoute.get('/categories',adminAuth.isAdminLogin,adminControllers.getCategoriesPage);
adminRoute.post('/addCategory',adminAuth.isAdminLogin,adminControllers.addCategory);
adminRoute.post("/unlistCategory/:category_id",adminAuth.isAdminLogin,adminControllers.unlistCategory)
adminRoute.post("/listCategory/:category_id",adminAuth.isAdminLogin,adminControllers.listCategory)
adminRoute.post('/deleteProduct/:product_id',adminAuth.isAdminLogin,productControllers.deleteProduct)
adminRoute.post('/recoverProduct/:product_id',adminAuth.isAdminLogin,productControllers.recoverProduct)
adminRoute.get("/orders",adminAuth.isAdminLogin,orderControllers.getAdminOrdersPage)
adminRoute.post("/orders/updateOrderStatus/:purchasedProduct_id/:product_id",adminAuth.isAdminLogin,orderControllers.updateOrderStatus)


adminRoute.get('/banners',adminAuth.isAdminLogin,adminControllers.getBannersPage)
adminRoute.post('/addNewBanner',adminAuth.isAdminLogin,bannerUpload.single('bannerImage'),adminControllers.addNewBanner)
adminRoute.post("/banner/deleteBanner/:banner_id",adminAuth.isAdminLogin,adminControllers.deleteBanner)
adminRoute.post("/banner/recoverBanner/:banner_id",adminAuth.isAdminLogin,adminControllers.recoverBanner)

adminRoute.get('/coupons',adminAuth.isAdminLogin,couponControllers.getCouponsPage)
adminRoute.get("/addCoupon",adminAuth.isAdminLogin,couponControllers.getAddCouponPage)
adminRoute.post('/addNewCoupon',adminAuth.isAdminLogin,couponControllers.addNewCoupon)
adminRoute.post("/deleteCoupon/:coupon_id",adminAuth.isAdminLogin,couponControllers.deleteCoupon)
adminRoute.post("/recoverCoupon/:coupon_id",adminAuth.isAdminLogin,couponControllers.recoverCoupon)
adminRoute.get('/offers',adminAuth.isAdminLogin,adminControllers.getAdminOffersPage)
adminRoute.get('/offer/addOffer',adminAuth.isAdminLogin,adminControllers.getAddOfferPage)
adminRoute.post('/offer/addOffer',adminAuth.isAdminLogin,adminControllers.insertNewOffer)
adminRoute.get('/deleteOffer/:offer_id',adminControllers.deleteOffer)


module.exports=adminRoute