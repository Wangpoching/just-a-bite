/* eslint-disable */
const utils = require('../utils.js')
/* eslint-enable */

const { getTime } = utils // 引入函數
const websiteTitle = '餐廳官網'
const restaurantController = {
  renderIndex: (req, res, next) => {
    const { dishes } = req
    return res.render('index', {
      websiteTitle,
      dishes
    })
  },

  renderFAQ: (req, res, next) => {
    const { FAQs } = req
    return res.render('FAQ', {
      websiteTitle,
      navbarId: 3,
      FAQs
    })
  },

  renderPrize: (req, res, next) => (
    res.render('prize', {
      websiteTitle,
      navbarId: 0
    })
  ),

  renderMenu: (req, res, next) => {
    const { bestsellings, dishes, cartDetailsAmount } = req
    return res.render('menu', {
      websiteTitle,
      navbarId: 1,
      cartDetailsAmount,
      bestsellings,
      dishes
    })
  },

  renderCart: (req, res, next) => {
    const { cartDetails, dishes } = req
    return res.render('cart', {
      websiteTitle,
      navbarId: 1,
      dishes,
      cartDetails
    })
  },

  renderPayment: (req, res, next) => {
    const { tradeInfo, totalPrice, orderDetails } = req
    return res.render('payment', {
      websiteTitle,
      navbarId: 1,
      tradeInfo,
      totalPrice,
      orderDetails
    })
  },

  renderOrder: (req, res, next) => {
    const { orders } = req
    return res.render('order', {
      websiteTitle,
      navbarId: 2,
      orders,
      getTime
    })
  },

  renderDetail: (req, res, next) => {
    const { order, orderDetails } = req
    return res.render('detail', {
      websiteTitle,
      navbarId: 2,
      order,
      orderDetails
    })
  }
}

module.exports = restaurantController
