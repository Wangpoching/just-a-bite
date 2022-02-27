const express = require('express')
const path = require('path')
const bodyParser = require('body-parser')
const session = require('express-session')
const flash = require('connect-flash')
const multer = require('multer')
const adminController = require('./controllers/admin')
const userController = require('./controllers/user')
const restaurantController = require('./controllers/restaurant')
/* eslint-disable */
const db = require('./models')
/* eslint-enable */

const { User } = db
const app = express()
const port = 5005
const upload = multer({
  fileFilter(req, file, cb) {
    // 只接受三種圖片格式
    if (!file.originalname.match(/\.(jpg|jpeg|png)$/)) {
      cb(new Error('Please upload an image'))
    }
    cb(null, true)
  }
})

app.set('trust proxy', 1) // trust first proxy
app.set('view engine', 'ejs') // use ejs as template engine
// secret: seed for hash; resave: force session to store; saveUninitialized: force to save new and not modified session
app.use(session({
  secret: process.env.SESSIONSECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: true,
    sameSite: 'none'
  } // only https will set cookie
}))
app.use(bodyParser.urlencoded({ extended: false })) // parses urlencoded bodies
app.use(bodyParser.json()) // enable json type response
app.use(flash()) // enable flash
// set enviromental variables
app.use((req, res, next) => {
  res.locals.username = req.session.username
  res.locals.navbarId = null
  res.locals.adminNavbarId = null
  res.locals.pagesPerPagination = 5
  res.locals.deliveryFee = 99
  res.locals.errorMessage = req.flash('errorMessage')
  res.locals.probErrorMessage = req.flash('probErrorMessage')
  next()
})
// set static resources route
app.use(express.static(path.join(__dirname, 'public')))
app.use(async(req, res, next) => {
  let isLogin = false
  let isAdmin = false
  if (req.session.username) {
    isLogin = true
    const { username } = req.session
    const user = await User.findOne({
      where: {
        username
      }
    })
    // 是管管
    if (user.identity === 1) {
      isAdmin = true
    }
  }
  res.locals.isLogin = isLogin
  res.locals.isAdmin = isAdmin
  next()
})
// handle login/register/logout/setting
app.get('/login', userController.renderLogin)
app.post('/login', userController.checkLoginInput, userController.handleLogin, userController.redirectBack)

app.get('/register', userController.renderRegister)
app.post('/register', userController.checkRegisterInput, userController.handleRegister, userController.redirectBack)

app.get('/logout', userController.handleLogout, userController.redirectBack)

// handle admin
app.get('/admin-prize', userController.isAdmin, adminController.getAllPrizes, adminController.renderAdminPrize)
app.post('/prize-create', userController.isAdmin, upload.single('upload'), adminController.checkCreatePrizeInput, adminController.uploadPrizeImage, adminController.uploadPrizeInformation, adminController.redirectBack)
app.get('/prize-delete', userController.isAdmin, adminController.checkQueryId, adminController.getPrizeByQueryId, adminController.renderPrizeDelete)
app.post('/prize-delete', userController.isAdmin, adminController.checkDeletePrizeInput, adminController.deletePrizeInformation, adminController.deleteImage, adminController.redirectAdminPrize)
app.get('/prize-edit', userController.isAdmin, adminController.checkQueryId, adminController.getPrizeByQueryId, adminController.renderPrizeEdit)
app.post('/prize-edit', userController.isAdmin, adminController.checkQueryId, upload.single('upload'), adminController.checkEditPrizeInput, adminController.getPrizeByQueryId, adminController.deleteImage, adminController.uploadPrizeImage, adminController.updatePrizeInformation)
app.post('/prize-edit', adminController.updatePrizeInformation)
app.post('/edit-weights', userController.isAdmin, adminController.getAllPrizes, adminController.checkEditProbabilityInput, adminController.adjustWeights, adminController.updateWeights, adminController.redirectBack)

app.get('/admin-menu', userController.isAdmin, adminController.getAllDishes, adminController.renderAdminMenu)
app.post('/menu-create', userController.isAdmin, upload.single('upload'), adminController.checkCreateDishInput, adminController.uploadDishImage, adminController.uploadDishInformation, adminController.redirectBack)
app.get('/menu-delete', userController.isAdmin, adminController.checkQueryId, adminController.getAllDishes, adminController.renderDishDelete)
app.post('/menu-delete', userController.isAdmin, adminController.checkDeleteDishInput, adminController.deleteDishInformation, adminController.deleteImage, adminController.redirectAdminMenu)
app.post('/menu-edit', userController.isAdmin, adminController.checkQueryId, upload.single('upload'), adminController.checkEditDishInput, adminController.getDishByQueryId, adminController.deleteImage, adminController.uploadDishImage, adminController.updateDishInformation)
app.post('/menu-edit', adminController.updateDishInformation)

app.get('/admin-faq', userController.isAdmin, adminController.getAllFAQs, adminController.renderAdminFAQ)
app.post('/faq-create', userController.isAdmin, adminController.checkCreateFAQInput, adminController.uploadFAQInformation, adminController.redirectBack)
app.get('/faq-delete', userController.isAdmin, adminController.checkQueryId, adminController.getFAQByQueryId, adminController.renderFAQDelete)
app.post('/faq-delete', userController.isAdmin, adminController.checkDeleteFAQInput, adminController.deleteFAQInformation)
app.get('/faq-edit', userController.isAdmin, adminController.checkQueryId, adminController.getFAQByQueryId, adminController.renderFAQEdit)
app.post('/faq-edit', userController.isAdmin, adminController.checkQueryId, adminController.checkEditFAQInput, adminController.updateFAQInformation)

app.get('/admin-order', userController.isAdmin, adminController.getAllOrders, adminController.renderAdminOrder)
app.get('/order-edit', userController.isAdmin, adminController.checkQuerySerial, adminController.getOrderBySerial, adminController.getOrderDetailsBySerial, adminController.renderOrderEdit)
app.post('/order-edit', userController.isAdmin, adminController.checkEditOrderInput, adminController.updateOrderInformation)

// handle restaurant
app.get('/index', adminController.getExpensiveDishes, restaurantController.renderIndex)
app.get('/prize', restaurantController.renderPrize)
app.get('/FAQ', adminController.getAllFAQs, restaurantController.renderFAQ)
app.get('/menu', adminController.getBestsellings, adminController.getAllDishes, adminController.countCartDetails, restaurantController.renderMenu)
app.post('/cart-add', userController.isLogin, adminController.checkAddCartInput, adminController.cartItemIncrement)
app.post('/cart-edit', userController.isLogin, adminController.checkEditCartInput, adminController.updateCartInformation, adminController.redirectBack)
app.post('/payment', userController.isLogin, adminController.checkSubmitCartInput, adminController.updateCartInformation, adminController.createOrder, restaurantController.renderPayment)
app.post('/spgateway/callback', adminController.spgatewayCallbackNotify)
app.post('/spgateway/callback', adminController.spgatewayCallbackReturn)
app.get('/cart', userController.isLogin, adminController.getCartDetailsByUserId, adminController.getAllDishes, restaurantController.renderCart)
app.get('/order', userController.isLogin, adminController.getOrdersByUserId, restaurantController.renderOrder)
app.get('/detail', userController.isLogin, adminController.checkQuerySerial, adminController.getOrderBySerial, adminController.getOrderDetailsBySerial, restaurantController.renderDetail)
// handle lottery
app.get('/lottery', adminController.getAllPrizes, adminController.lottery)

// open the port
app.listen(port, () => {
  console.log(`app listening on port ${port}!`)
})
