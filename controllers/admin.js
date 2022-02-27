const Sequelize = require('sequelize')
require('dotenv').config()
/* eslint-disable */
const db = require('../models')
const utils = require('../utils.js')
/* eslint-enable */

const { USERNAME, ACCESSTOKEN, PRIZEALBUM_ID, MENUALBUM_ID } = process.env // imgur
const websiteTitle = '管理後臺'
const limit = 5 // 一頁最多顯示的訂單筆數
const digits = 6 // csrfToken 的長度
const { Op } = Sequelize
const { User, Prize, Menu, FAQ, CartDetail, Order, OrderDetail, sequelize } = db
const { csrfTokenGenerator, uploadImgur, deleteImgur, sendEmail, generatePageUrl, getTime, getTradeInfo, createMpgAesDecrypt } = utils // 引入函數

const adminController = {
  renderAdminPrize: (req, res, next) => {
    const { prizes, totalWeight } = req
    res.render('admin_prize', {
      websiteTitle,
      adminNavbarId: 0,
      totalWeight,
      prizes
    })
  },

  renderPrizeEdit: (req, res, next) => {
    const { prize } = req
    res.render('prize_edit', {
      websiteTitle,
      adminNavbarId: 0,
      prize
    })
  },

  renderPrizeDelete: (req, res, next) => {
    // 製作 csrf token
    const csrfToken = csrfTokenGenerator(digits)
    req.session.csrfToken = csrfToken
    const { prize } = req
    res.render('prize_delete', {
      websiteTitle,
      adminNavbarId: 0,
      csrfToken,
      prize
    })
  },

  renderDishDelete: (req, res, next) => {
    // 製作 csrf token
    const csrfToken = csrfTokenGenerator(digits)
    req.session.csrfToken = csrfToken
    const { id } = req.query
    const { dishes } = req
    res.render('menu_delete', {
      websiteTitle,
      adminNavbarId: 1,
      csrfToken,
      id,
      dishes
    })
  },

  renderFAQDelete: (req, res, next) => {
    // 製作 csrf token
    const csrfToken = csrfTokenGenerator(digits)
    req.session.csrfToken = csrfToken
    const { id } = req.query
    const { faq } = req
    res.render('FAQ_delete', {
      websiteTitle,
      adminNavbarId: 2,
      csrfToken,
      id,
      faq
    })
  },

  renderFAQEdit: (req, res, next) => {
    const { faq } = req
    res.render('FAQ_edit', {
      websiteTitle,
      adminNavbarId: 2,
      faq
    })
  },

  renderOrderEdit: (req, res, next) => {
    const { order, orderDetails } = req
    res.render('order_edit', {
      websiteTitle,
      adminNavbarId: 3,
      order,
      orderDetails
    })
  },

  renderAdminMenu: (req, res, next) => {
    const { dishes } = req
    res.render('admin_menu', {
      websiteTitle,
      adminNavbarId: 1,
      dishes
    })
  },

  renderAdminFAQ: (req, res, next) => {
    const { FAQs } = req
    res.render('admin_FAQ', {
      websiteTitle,
      adminNavbarId: 2,
      FAQs
    })
  },

  renderAdminOrder: (req, res, next) => {
    let status
    if ('status' in req) {
      status = req.status
    }
    const { orders, page, totalOrders, totalPages, queryFilter } = req
    res.render('admin_order', {
      websiteTitle,
      adminNavbarId: 3,
      status,
      orders,
      page,
      totalOrders,
      totalPages,
      limit,
      queryFilter,
      generatePageUrl,
      getTime
    })
  },

  checkCreatePrizeInput: (req, res, next) => {
    const { name, desc, weight } = req.body
    if (!name || !desc || !weight || !req.file) {
      req.flash('errorMessage', '資料不齊全')
      return res.redirect('back')
    }
    if (weight < 0 || weight > 100 || weight % 1 !== 0) {
      req.flash('errorMessage', '請填入合法的權重')
      return res.redirect('back')
    }
    next()
  },

  checkDeletePrizeInput: (req, res, next) => {
    const { csrfToken } = req.body
    const { id } = req.query
    if (!csrfToken || !id) {
      req.flash('errorMessage', '資料不齊全')
      return res.redirect('back')
    }
    next()
  },

  checkDeleteDishInput: (req, res, next) => {
    const { csrfToken } = req.body
    const { id } = req.query
    if (!csrfToken || !id) {
      req.flash('errorMessage', '資料不齊全')
      return res.redirect('back')
    }
    next()
  },

  checkDeleteFAQInput: (req, res, next) => {
    const { csrfToken } = req.body
    const { id } = req.query
    if (!csrfToken || !id) {
      req.flash('errorMessage', '資料不齊全')
      return res.redirect('back')
    }
    next()
  },

  checkCreateDishInput: (req, res, next) => {
    const { name, price, amount } = req.body
    if (!name || !price || !amount || !req.file) {
      req.flash('errorMessage', '資料不齊全')
      return res.redirect('back')
    }
    next()
  },

  checkCreateFAQInput: (req, res, next) => {
    const { serial, question, answer } = req.body
    if (!serial || !question || !answer) {
      req.flash('errorMessage', '資料不齊全')
      return res.redirect('back')
    }
    next()
  },

  checkEditProbabilityInput: (req, res, next) => {
    let probSum = 0
    let min = 999
    let minIndex
    const valid = req.prizes.every((prize, i) => {
      if (!(prize.id in req.body)) {
        req.flash('probErrorMessage', '更新機率失敗')
        return false
      }
      if (!req.body[prize.id]) {
        req.flash('probErrorMessage', '資料不齊全')
        return false
      }
      prize.probability = req.body[prize.id]
      probSum += Number(req.body[prize.id])
      // 找最小值
      if (prize.probability < min) {
        minIndex = i
        min = prize.probability
      }
      return true
    })
    if (!valid) {
      return res.redirect('back')
    }
    // 機率總和必須為 1
    if (probSum !== 1) {
      req.flash('probErrorMessage', '機率總和必須為 1')
      return res.redirect('/admin-prize')
    }
    req.minIndex = minIndex
    next()
  },

  checkAddCartInput: (req, res, next) => {
    const { dishId } = req.body
    if (!dishId) {
      req.flash('errorMessage', '資料不齊全')
      return res.redirect('back')
    }
    next()
  },

  checkEditCartInput: (req, res, next) => {
    let { dishId, amount } = req.body
    if (!dishId && !amount) {
      dishId = []
      amount = []
      req.dishId = dishId
      req.amount = amount
      return next()
    }
    // 商品與數量轉陣列
    if (!Array.isArray(dishId)) {
      dishId = [dishId]
    }
    if (!Array.isArray(amount)) {
      amount = [amount]
    }
    if (dishId.length !== amount.length) {
      req.flash('errorMessage', '無法核對商品與數量')
      return res.redirect('back')
    }
    for (const ele of amount) {
      if (ele <= 0) {
        req.flash('errorMessage', '商品至少需購買一件')
        return res.redirect('back')
      }
    }
    req.dishId = dishId
    req.amount = amount
    next()
  },

  checkSubmitCartInput: (req, res, next) => {
    const { name, phone, mail, address } = req.body
    let { dishId, amount } = req.body
    // 檢查訂購人資訊
    if (!dishId || !amount) {
      req.flash('errorMessage', '購物車不可為空')
      return res.redirect('back')
    }
    if (!name || !phone || !mail || !address) {
      req.flash('errorMessage', '訂購人資訊不齊全')
      return res.redirect('back')
    }
    // 商品與數量轉陣列
    if (!Array.isArray(dishId)) {
      dishId = [dishId]
    }
    if (!Array.isArray(amount)) {
      amount = [amount]
    }
    // 比較商品與數量是否筆數相同
    if (dishId.length !== amount.length) {
      req.flash('errorMessage', '無法匹配商品與數量')
      return res.redirect('back')
    }
    for (const ele of amount) {
      if (ele <= 0) {
        req.flash('errorMessage', '商品至少需購買一件')
        return res.redirect('back')
      }
    }
    req.dishId = dishId
    req.amount = amount
    next()
  },

  checkEditOrderInput: (req, res, next) => {
    const { serial, status, name, phone, mail, address } = req.body
    if (!serial || !status || !name || !phone || !mail || !address) {
      req.flash('errorMessage', '資料不齊全')
      return res.redirect('back')
    }
    const possibleStatus = ['1', '2', '3']
    if (possibleStatus.findIndex((item) => item === status) < 0) {
      req.flash('errorMessage', '未定義的訂單狀態')
      return res.redirect('back')
    }
    next()
  },

  checkQuerySerial: async(req, res, next) => {
    const { serial } = req.query
    if (!serial) {
      return res.redirect('back')
    }
    next()
  },

  adjustWeights: async(req, res, next) => {
    const { prizes, totalWeight } = req
    let weightSum = 0
    for (const prize of prizes) {
      prize.weight = Math.round(prize.probability * totalWeight)
      weightSum += prize.weight
    }
    // 校正
    const diff = weightSum - totalWeight
    const { minIndex } = req
    prizes[minIndex].weight -= diff
    req.prizes = prizes
    next()
  },

  checkEditPrizeInput: (req, res, next) => {
    const { name, desc, weight } = req.body
    if (!name || !desc || !weight) {
      req.flash('errorMessage', '資料不齊全')
      return res.redirect('back')
    }
    if (weight < 0 || weight > 100 || weight % 1 !== 0) {
      req.flash('errorMessage', '請填入合法的權重')
      return res.redirect('back')
    }
    if (!req.file) {
      return next('route')
    }
    next()
  },

  checkEditFAQInput: (req, res, next) => {
    const { serial, question, answer } = req.body
    if (!serial || !question || !answer) {
      req.flash('errorMessage', '資料不齊全')
      return res.redirect('back')
    }
    next()
  },

  checkEditDishInput: (req, res, next) => {
    const { name, amount, price } = req.body
    if (!name || !amount || !price) {
      req.flash('errorMessage', '資料不齊全')
      return res.redirect('back')
    }
    if (!req.file) {
      return next('route')
    }
    next()
  },

  checkQueryId: (req, res, next) => {
    const { id } = req.query
    if (!id) {
      return res.redirect('back')
    }
    next()
  },

  uploadPrizeImage: (req, res, next) => {
    const image = req.file.buffer
    uploadImgur(ACCESSTOKEN, image, PRIZEALBUM_ID, (error, response, body) => {
      if (error) {
        req.flash('errorMessage', '上傳圖片失敗')
        return res.redirect('back')
      }
      let parsedBody
      try {
        parsedBody = JSON.parse(body)
      } catch (err) {
        req.flash('errorMessage', '上傳圖片失敗')
        return res.redirect('back')
      }
      if (parsedBody.success) {
        const { data } = parsedBody
        req.deleteHash = data.deletehash
        req.imageUrl = data.link
        return next()
      }
      req.flash('errorMessage', '上傳圖片失敗')
      res.redirect('back')
    })
  },

  uploadDishImage: (req, res, next) => {
    const image = req.file.buffer
    uploadImgur(ACCESSTOKEN, image, MENUALBUM_ID, (error, response, body) => {
      if (error) {
        req.flash('errorMessage', '上傳失敗')
        return res.redirect('back')
      }
      let parsedBody
      try {
        parsedBody = JSON.parse(body)
      } catch (err) {
        req.flash('errorMessage', '上傳失敗')
        return res.redirect('back')
      }
      if (parsedBody.success) {
        const { data } = parsedBody
        req.deleteHash = data.deletehash
        req.imageUrl = data.link
        return next()
      }
      req.flash('errorMessage', '上傳失敗')
      res.redirect('back')
    })
  },

  getAllPrizes: async(req, res, next) => {
    try {
      const prizes = await Prize.findAll()
      req.prizes = prizes
      const totalWeight = await Prize.sum('weight')
      req.totalWeight = totalWeight
    } catch (err) {
      return res.redirect('/index')
    }
    next()
  },

  getAllDishes: async(req, res, next) => {
    try {
      const dishes = await Menu.findAll({
        order: [['sales', 'DESC']]
      })
      req.dishes = dishes
    } catch (err) {
      return res.redirect('/index')
    }
    next()
  },

  getBestsellings: async(req, res, next) => {
    try {
      const bestsellings = await Menu.findAll({
        limit: 4,
        order: [['amount', 'ASC']]
      })
      req.bestsellings = bestsellings
    } catch (err) {
      return res.redirect('back')
    }
    next()
  },

  getExpensiveDishes: async(req, res, next) => {
    try {
      const dishes = await Menu.findAll({
        limit: 4,
        order: [['price', 'DESC']]
      })
      req.dishes = dishes
    } catch (error) {
      // 圖跑不出來也沒關係
      return next()
    }
    next()
  },

  getAllFAQs: async(req, res, next) => {
    try {
      const FAQs = await FAQ.findAll()
      req.FAQs = FAQs
    } catch (err) {
      return res.redirect('/index')
    }
    next()
  },

  uploadPrizeInformation: async(req, res, next) => {
    const { name, desc, weight } = req.body
    const { deleteHash, imageUrl } = req
    try {
      await Prize.create({
        name,
        desc,
        weight,
        deleteHash,
        imageUrl
      })
    } catch (err) {
      req.flash('errorMessage', '上傳失敗')
      return res.redirect('back')
    }
    next()
  },

  uploadDishInformation: async(req, res, next) => {
    const { name, price, amount } = req.body
    const { deleteHash, imageUrl } = req
    const sales = 0
    try {
      await Menu.create({
        name,
        price,
        amount,
        sales,
        deleteHash,
        imageUrl
      })
    } catch (err) {
      req.flash('errorMessage', '上傳失敗')
      return res.redirect('back')
    }
    next()
  },

  uploadFAQInformation: async(req, res, next) => {
    const { serial, question, answer } = req.body
    try {
      await FAQ.create({
        serial,
        question,
        answer
      })
    } catch (err) {
      if (err.name === 'SequelizeUniqueConstraintError') {
        req.flash('errorMessage', '流水號已被使用')
        return res.redirect('back')
      }
      req.flash('errorMessage', '上傳失敗')
      return res.redirect('back')
    }
    next()
  },

  updatePrizeInformation: async(req, res, next) => {
    const { name, desc, weight } = req.body
    const input = {
      name,
      desc,
      weight
    }
    const keys = ['deleteHash', 'imageUrl']
    if (keys.every((key) => Object.keys(req).includes(key))) {
      const { deleteHash, imageUrl } = req
      input.deleteHash = deleteHash
      input.imageUrl = imageUrl
    }
    try {
      await Prize.update(input, {
        where: {
          id: req.query.id
        }
      })
    } catch (err) {
      req.flash('errorMessage', '更新獎項資訊失敗')
      return res.redirect('back')
    }
    res.redirect('/admin-prize')
  },

  updateDishInformation: async(req, res, next) => {
    const { name, amount, price } = req.body
    const input = {
      name,
      amount,
      price
    }
    if ('deleteHash' in req && 'imageUrl' in req) {
      const { deleteHash, imageUrl } = req
      input.deleteHash = deleteHash
      input.imageUrl = imageUrl
    }
    try {
      await Menu.update(input, {
        where: {
          id: req.query.id
        }
      })
    } catch (err) {
      return res.redirect('back')
    }
    res.redirect('/admin-menu')
  },

  updateFAQInformation: async(req, res, next) => {
    const { serial, question, answer } = req.body
    const { id } = req.query
    try {
      await FAQ.update({
        serial,
        question,
        answer
      }, {
        where: {
          id
        }
      })
    } catch (err) {
      if (err.name === 'SequelizeUniqueConstraintError') {
        req.flash('errorMessage', '流水號已被使用')
        return res.redirect('back')
      }
      req.flash('errorMessage', '上傳失敗')
      return res.redirect('back')
    }
    res.redirect('/admin-faq')
  },

  updateOrderInformation: async(req, res, next) => {
    const { name, phone, mail, address, serial } = req.body
    let { status } = req.body
    const order = await Order.findOne({
      where: {
        serial
      }
    })
    // 狀態沒改變直接返回
    if (Number(order.status) === Number(status)) {
      return res.redirect('/admin-order')
    }
    // 訂單取消不能更改
    if (Number(order.status) !== 1 && Number(order.status) !== 2) {
      status = 3
    }
    try {
      await sequelize.transaction(async(transaction) => {
        await Order.update({
          status,
          name,
          phone,
          mail,
          address
        }, {
          where: {
            serial
          },
          transaction
        })
        // 改為訂單取消
        if (Number(status) === 3) {
          // 找出訂單
          const orderDetails = await OrderDetail.findAll({
            where: {
              serial
            },
            transaction
          })
          // 逐一修改庫存數量
          const results = []
          for (const orderDetail of orderDetails) {
            results.push(
              Menu.increment({
                sales: (orderDetail.amount * -1),
                amount: orderDetail.amount
              }, {
                where: {
                  id: orderDetail.dishId
                },
                transaction
              })
            )
          }
          await Promise.all(results)
        }
      })
    } catch (err) {
      req.flash('errorMessage', err)
      return res.redirect('back')
    }
    res.redirect('/admin-order')
  },

  updateCartInformation: async(req, res, next) => {
    const { dishId, amount } = req
    if (dishId.length === 0 && amount.length === 0) {
      try {
        await CartDetail.destroy({
          where: {
            userId: req.session.userId
          }
        })
        return next()
      } catch (err) {
        req.flash('errorMessage', err.toString())
        return res.redirect('back')
      }
    }
    // 把 input 整理成 object
    const inputObject = []
    for (const i in dishId) {
      inputObject.push({
        dishId: dishId[i],
        amount: Number(amount[i])
      })
    }
    // 把 inputObject 濃縮成單一 index
    const uniqueInputObject = []
    for (const ele of inputObject) {
      const index = uniqueInputObject.findIndex((item) => item.dishId === ele.dishId)
      if (index >= 0) {
        uniqueInputObject[index].amount += ele.amount
      } else {
        uniqueInputObject.push(ele)
      }
    }
    const results = []
    await sequelize.transaction(async(transaction) => {
      try {
        await CartDetail.destroy({
          where: {
            userId: req.session.userId
          },
          transaction
        })
        for (const ele of uniqueInputObject) {
          results.push(
            CartDetail.create(
              {
                amount: ele.amount,
                dishId: ele.dishId,
                userId: req.session.userId
              },
              {
                transaction
              }
            )
          )
        }
        await Promise.all(results)
      } catch (err) {
        req.flash('errorMessage', err.toString())
        return res.redirect('back')
      }
    })
    next()
  },

  createOrder: async(req, res, next) => {
    const { name, phone, mail, address } = req.body

    // create serial
    // setHours(0,0,0,0) will set 'local time' to 0
    const TODAY_START = new Date(new Date(+new Date() + 8 * 3600 * 1000).setHours(0, 0, 0, 0) - (8 * 3600 * 1000))
    let NOW = new Date(+new Date())
    const lastOrder = await Order.findOne({
      limit: 1,
      where: {
        createdAt: {
          [Op.gt]: TODAY_START,
          [Op.lt]: NOW
        }
      },
      order: [['createdAt', 'DESC']]
    })
    NOW = new Date(+new Date() + 8 * 3600 * 1000)
    let serial = `${NOW.getFullYear()}${(NOW.getMonth() + 1).toString().padStart(2, '0')}${NOW.getDate().toString().padStart(2, '0')}`
    if (!lastOrder) {
      serial += '0001'
    } else {
      serial += (Number(lastOrder.serial.slice(-4)) + 1).toString().padStart(4, '0')
    }
    try {
      let totalPrice = 0
      let desc = ''
      await sequelize.transaction(async(transaction) => {
        // 創建訂單
        await Order.create({
          serial,
          userId: req.session.userId,
          status: 3,
          amount: 0,
          name,
          phone,
          mail,
          address
        }, {
          transaction
        })
        // 創建訂單詳細資訊 & 計算總額
        const cartDetails = await CartDetail.findAll({
          where: {
            userId: req.session.userId
          },
          include: Menu,
          transaction
        })
        /* eslint-disable no-await-in-loop */
        const results = []
        for (const cartDetail of cartDetails) {
          totalPrice = totalPrice + (cartDetail.amount * cartDetail.Menu.price)
          desc += `${cartDetail.Menu.name}x${cartDetail.amount}`
          const dish = await Menu.findOne({
            where: {
              id: cartDetail.dishId
            }
          })
          // 檢查商品庫存
          const errorMessage = '商品庫存不足'
          if (dish.amount < cartDetail.amount) {
            throw errorMessage
          }
          // 創建訂單詳細資訊
          results.push(
            OrderDetail.create({
              serial,
              dishId: cartDetail.dishId,
              amount: cartDetail.amount
            }, {
              transaction
            })
          )
        }
        await Promise.all(results)
        /* eslint-enable no-await-in-loop */
        // 更新訂單金額
        await Order.update({
          amount: totalPrice
        }, {
          where: {
            serial
          },
          transaction
        })
        // 取得 orderDetail
        const orderDetails = await OrderDetail.findAll({
          where: {
            serial
          },
          include: Menu,
          transaction
        })
        req.orderDetails = orderDetails
        req.totalPrice = totalPrice
        totalPrice = totalPrice >= 1000 ? totalPrice : (totalPrice + 99)
        // 取得交易參數
        const tradeInfo = getTradeInfo(serial, totalPrice, desc, mail)
        req.tradeInfo = tradeInfo
      })
    } catch (err) {
      req.flash('errorMessage', err.toString())
      return res.redirect('/cart')
    }
    next()
  },

  countCartDetails: async(req, res, next) => {
    let cartDetailsAmount
    if (req.session.username) {
      cartDetailsAmount = await CartDetail.count({
        where: {
          userId: req.session.userId
        }
      })
      req.cartDetailsAmount = cartDetailsAmount
    }
    next()
  },

  cartItemIncrement: async(req, res, next) => {
    const { dishId } = req.body
    const { userId } = req.session
    let cartDetail
    try {
      cartDetail = await CartDetail.findOne({
        where: {
          userId,
          dishId
        }
      })
    } catch (err) {
      req.flash('errorMessage', err.toString())
      return res.redirect('back')
    }
    if (!cartDetail) {
      try {
        await CartDetail.create({
          userId,
          dishId,
          amount: 1
        })
      } catch (err) {
        req.flash('errorMessage', err.toString())
        return res.redirect('back')
      }
      return res.redirect('/cart')
    }
    await cartDetail.increment('amount')
    return res.redirect('/cart')
  },

  deletePrizeInformation: async(req, res, next) => {
    const { id } = req.query
    const { csrfToken } = req.body
    if (req.session.csrfToken !== csrfToken) {
      req.flash('errorMessage', '刪除獎項失敗')
      return res.redirect('back')
    }
    try {
      const prize = await Prize.findOne({
        where: {
          id
        }
      })
      if (!prize) {
        return res.redirect('/admin-prize')
      }
      req.deleteHash = prize.deleteHash
    } catch (err) {
      req.flash('errorMessage', '刪除獎項失敗')
      return res.redirect('back')
    }
    try {
      await Prize.destroy({
        where: {
          id
        }
      })
    } catch (err) {
      req.flash('errorMessage', '刪除獎項失敗')
      return res.redirect('back')
    }
    next()
  },

  deleteDishInformation: async(req, res, next) => {
    const { id } = req.query
    try {
      await sequelize.transaction(async(transaction) => {
        const orderDetails = await OrderDetail.findAll({
          where: {
            dishId: id
          },
          transaction
        })
        // 刪除菜單品項
        const dish = await Menu.findOne({
          where: {
            id
          },
          transaction
        })
        if (!dish) {
          return res.redirect('/admin-menu')
        }
        req.deleteHash = dish.deleteHash
        await Menu.destroy({
          where: {
            id
          },
          transaction
        })
        // 抓出受影響的訂單
        const whereCondition = []
        for (const orderDetail of orderDetails) {
          whereCondition.push({ serial: orderDetail.serial })
        }
        const orders = await Order.findAll({
          where: {
            [Op.or]: whereCondition
          },
          transaction
        })
        // 重新修改訂單金額
        const results = []
        /* eslint-disable no-await-in-loop */
        for (const order of orders) {
          const orderDetails = await OrderDetail.findAll({
            where: {
              serial: order.serial
            },
            include: Menu,
            transaction
          })
          let totalPrice = 0
          if (orderDetails.length === 0) {
            results.push(
              order.update({
                amount: 0,
                status: 3
              }, {
                transaction
              })
            )
            continue
          }
          for (const orderDetail of orderDetails) {
            totalPrice = totalPrice + (orderDetail.amount * orderDetail.Menu.price)
          }
          results.push(
            order.update({
              amount: totalPrice
            }, {
              transaction
            })
          )
        }
        /* eslint-enable no-await-in-loop */
        await Promise.all(results)
      })
    } catch (err) {
      return res.redirect('/admin-menu')
    }
    next()
  },

  deleteFAQInformation: async(req, res, next) => {
    const { id } = req.query
    const { csrfToken } = req.body
    if (req.session.csrfToken !== csrfToken) {
      req.flash('errorMessage', '刪除問答失敗')
      return res.redirect('back')
    }
    try {
      const result = await FAQ.destroy({
        where: {
          id
        }
      })
      if (!result) {
        req.flash('errorMessage', '刪除問答失敗')
        return res.redirect('back')
      }
    } catch (err) {
      req.flash('errorMessage', '刪除問答失敗')
      return res.redirect('back')
    }
    return res.redirect('/admin-faq')
  },

  deleteImage: (req, res, next) => {
    const { deleteHash } = req
    deleteImgur(ACCESSTOKEN, USERNAME, deleteHash, (error, response, body) => {
      if (error) {
        req.flash('errorMessage', '刪除原圖失敗')
        return res.redirect('back')
      }
      let parsedBody
      try {
        parsedBody = JSON.parse(body)
      } catch (err) {
        req.flash('errorMessage', '刪除原圖失敗')
        return res.redirect('back')
      }
      // 成功
      if (parsedBody.success) {
        return next()
      }
      // imgur 回傳錯誤
      req.flash('errorMessage', '刪除原圖失敗')
      return res.redirect('back')
    })
  },

  getPrizeByQueryId: async(req, res, next) => {
    const { id } = req.query
    try {
      const prize = await Prize.findOne({
        where: {
          id
        }
      })
      if (!prize) {
        return res.redirect('/admin-prize')
      }
      req.prize = prize
      req.deleteHash = prize.deleteHash
    } catch (err) {
      return res.redirect('back')
    }
    next()
  },

  getDishByQueryId: async(req, res, next) => {
    const { id } = req.query
    try {
      const dish = await Menu.findOne({
        where: {
          id
        }
      })
      req.dish = dish
      req.deleteHash = dish.deleteHash
    } catch (err) {
      return res.redirect('back')
    }
    next()
  },

  getFAQByQueryId: async(req, res, next) => {
    const { id } = req.query
    try {
      const faq = await FAQ.findOne({
        where: {
          id
        }
      })
      if (!faq) {
        return res.redirect('back')
      }
      req.faq = faq
    } catch (err) {
      return res.redirect('back')
    }
    next()
  },

  getCartDetailsByUserId: async(req, res, next) => {
    const { userId } = req.session
    try {
      const cartDetails = await CartDetail.findAll({
        where: {
          userId
        },
        include: Menu
      })
      req.cartDetails = cartDetails
    } catch (err) {
      req.flash('errorMessage', err.toString())
      return res.redirect('back')
    }
    next()
  },

  getOrdersByUserId: async(req, res, next) => {
    const { userId } = req.session
    const searchInput = { userId }
    if ('serial' in req.query) {
      const { serial } = req.query
      searchInput.serial = serial
    }
    let orders
    try {
      orders = await Order.findAll({
        where: searchInput,
        order: [['createdAt', 'DESC']]
      })
      req.orders = orders
    } catch (err) {
      req.flash('errorMessage', err.toString())
      return res.redirect('back')
    }
    next()
  },

  getAllOrders: async(req, res, next) => {
    // 篩選條件
    const searchInput = {}
    const queryFilter = {}
    const destination = req.headers.referer.indexOf('/admin-order?') > 0 ? '/admin-order' : '/admin-prize'
    if ('serial' in req.query) {
      const { serial } = req.query
      searchInput.serial = serial
      queryFilter.serial = serial
    }
    if ('username' in req.query) {
      const { username } = req.query
      const user = await User.findOne({
        where: {
          username
        }
      })
      if (!user) {
        // 找不到帳號
        return res.redirect('/admin-order')
      }
      const userId = user.id
      searchInput.userId = userId
      queryFilter.username = username
    }
    if ('status' in req.query) {
      let { status } = req.query
      status = Number(status)
      // 檢查狀態是否是 1, 2, 3
      for (let i = 1; i <= 3; i++) {
        if (status === i) {
          req.status = status
          searchInput.status = status
          queryFilter.status = status
          break
        }
      }
      if (!req.status) {
        return res.redirect('/admin-order')
      }
    }
    // 頁數篩選
    let page
    if ('page' in req.query) {
      page = Number(req.query.page)
    } else {
      page = 1
    }
    req.page = page
    const offset = limit * (page - 1)
    let result
    try {
      // 選出符合條件的 row 並計算符合條件的 row 有幾個
      result = await Order.findAndCountAll({
        where: searchInput,
        offset,
        limit,
        // 訂單從新到舊排列
        order: [['createdAt', 'DESC']],
        include: User
      })
      req.orders = result.rows
      req.totalOrders = result.count
      req.totalPages = Math.ceil(result.count / limit)
      if (!result.rows.length) {
        // 如果是沒攜參數造訪 admin-order 返回 admin-prize
        return res.redirect(destination)
      }
    } catch (err) {
      return res.redirect(destination)
    }
    // 如果是最後一頁 取到最後一筆資料為止
    if (page === req.totalPages) {
      try {
        result = await Order.findAndCountAll({
          where: searchInput,
          offset,
          order: [['createdAt', 'DESC']],
          include: User
        })
        req.orders = result.rows
        if (!result.rows.length) {
          return res.redirect(destination)
        }
      } catch (err) {
        return res.redirect(destination)
      }
    }
    req.queryFilter = queryFilter
    next()
  },

  getOrderBySerial: async(req, res, next) => {
    const { serial } = req.query
    const { userId } = req.session
    let order
    try {
      if (res.locals.isAdmin) {
        order = await Order.findOne({
          where: {
            serial
          }
        })
      } else {
        order = await Order.findOne({
          where: {
            serial,
            userId
          }
        })
      }
      req.order = order
    } catch (err) {
      req.flash('errorMessage', err.toString())
      return res.redirect('back')
    }
    if (!order) {
      return res.redirect('back')
    }
    next()
  },

  getOrderDetailsBySerial: async(req, res, next) => {
    const { serial } = req.query
    let orderDetails
    try {
      orderDetails = await OrderDetail.findAll({
        where: {
          serial
        },
        include: Menu
      })
      req.orderDetails = orderDetails
    } catch (err) {
      req.flash('errorMessage', err.toString())
      return res.redirect('back')
    }
    if (!orderDetails.length) {
      return res.redirect('back')
    }
    next()
  },

  updateWeights: async(req, res, next) => {
    const { prizes } = req
    const results = []
    for (const prize of prizes) {
      results.push(
        Prize.update(
          {
            weight: prize.weight
          },
          {
            where: {
              id: prize.id
            }
          }
        )
      )
    }
    try {
      await Promise.all(results)
    } catch (err) {
      res.flash('errorMessage', '更新中獎機率失敗')
      return next()
    }
    next()
  },

  lottery: async(req, res, next) => {
    const { prizes } = req
    let pool = []
    prizes.forEach((prize) => {
      pool = pool.concat(Array(Math.floor(prize.weight)).fill(prize.id))
    })
    const randomElement = Number(pool[Math.floor(Math.random() * pool.length)])
    let prize
    try {
      prize = await Prize.findOne({
        where: {
          id: randomElement
        }
      })
    } catch (err) {
      res.json({ success: false })
    }
    res.header('Access-Control-Allow-Origin', '*')
    const { name, desc, imageUrl } = prize
    return res.json({
      success: true,
      prize: {
        name,
        desc,
        imageUrl
      }
    })
  },

  spgatewayCallbackNotify: async(req, res, next) => {
    if (req.query.from === 'ReturnURL') {
      return next('route')
    }
    console.log('===== spgatewayCallback =====')
    console.log(req.method)
    console.log(req.query)
    console.log(req.body)
    console.log('==========')

    console.log('===== spgatewayCallback: TradeInfo =====')
    console.log(req.body.TradeInfo)

    const data = JSON.parse(createMpgAesDecrypt(req.body.TradeInfo))
    console.log('===== spgatewayCallback: create_mpg_aes_decrypt、data =====')
    console.log(data)

    if (data.Status !== 'SUCCESS') {
      return
    }

    await Order.update({
      status: 1
    }, {
      where: {
        serial: data.Result.MerchantOrderNo
      }
    })
    return res.end()
  },

  spgatewayCallbackReturn: async(req, res, next) => {
    console.log('===== spgatewayCallback =====')
    console.log(req.method)
    console.log(req.query)
    console.log(req.body)
    console.log('==========')

    const data = JSON.parse(createMpgAesDecrypt(req.body.TradeInfo))
    console.log('===== spgatewayCallback: create_mpg_aes_decrypt、data =====')
    console.log(data)

    if (data.Status !== 'SUCCESS') {
      req.flash('errorMessage', data.Message)
      return res.redirect('/cart')
    }
    try {
      await sequelize.transaction(async(transaction) => {
        // 修改庫存
        const cartDetails = await CartDetail.findAll({
          where: {
            userId: req.session.userId
          },
          include: Menu,
          transaction
        })
        const results = []
        for (const cartDetail of cartDetails) {
          // 扣除商品庫存
          const dish = cartDetail.Menu
          results.push(
            Menu.update({
              amount: dish.amount - cartDetail.amount,
              sales: dish.sales + cartDetail.amount
            }, {
              where: {
                id: dish.id
              },
              transaction
            })
          )
        }
        await Promise.all(results)
        // 清空購物車
        await CartDetail.destroy({
          where: {
            userId: req.session.userId
          },
          transaction
        })
      })
    } catch (error) {
      req.flash('errorMessage', '系統錯誤，請洽客服人員')
      return res.redirect('/cart')
    }
    // 發送確認訂購信
    const orderInfo = await Order.findOne({
      where: {
        serial: data.Result.MerchantOrderNo
      }
    })
    const { mail, name, serial } = orderInfo
    try {
      await sendEmail(mail, name, serial)
    } catch (error) {
      console.log(error)
    }
    res.redirect('/order')
  },

  redirectAdminPrize: (req, res, next) => (
    res.redirect('/admin-prize')
  ),

  redirectAdminMenu: (req, res, next) => (
    res.redirect('/admin-menu')
  ),

  redirectBack: (req, res, next) => {
    if (req.headers.referer) {
      return res.redirect('back')
    }
    return res.redirect('/login')
  }
}

module.exports = adminController
