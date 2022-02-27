const websiteTitle = '餐廳網站'
const bcrypt = require('bcrypt')
/* eslint-disable */
const db = require('../models')
/* eslint-enable */

const { User } = db
const saltRounds = 10

const userController = {
  isLogin: (req, res, next) => {
    const { isLogin } = res.locals
    // 有登入
    if (isLogin) {
      return next()
    }
    // 沒登入直接跳到 renderck
    return res.redirect('/login')
  },

  isAdmin: (req, res, next) => {
    const { isAdmin } = res.locals
    // 是管管
    if (isAdmin) {
      return next()
    }
    // 不是管管直接跳到 render
    return res.redirect('/login')
  },

  checkRegisterInput: (req, res, next) => {
    const { username, password } = req.body
    if (!username || !password) {
      req.flash('errorMessage', '缺少必要欄位')
      return res.redirect('back')
    }
    next()
  },

  checkLoginInput: (req, res, next) => {
    const { username, password } = req.body
    if (!username || !password) {
      req.flash('errorMessage', '缺少必要欄位')
      return res.redirect('back')
    }
    next()
  },

  handleRegister: async(req, res, next) => {
    const { username, password } = req.body
    bcrypt.hash(password, saltRounds, (err, hash) => {
      if (err) {
        req.flash('errorMessage', '系統錯誤')
        return next()
      }
      User.create({
        username,
        password: hash,
        identity: 2
      }).then((user) => {
        // 產生一組新的 session id
        req.session.regenerate((err) => {
          if (err) {
            req.flash('errorMessage', '系統錯誤')
            return next()
          }
          req.session.userId = user.id // 在 session 存進使用者名稱
          req.session.username = username // 在 session 存進使用者名稱
          return res.redirect('/index')
        })
      }).catch((err) => {
        if (err.name === 'SequelizeUniqueConstraintError') {
          req.flash('errorMessage', '帳號已被使用')
          return next()
        }
        req.flash('errorMessage', '系統錯誤')
        return next()
      })
    })
  },

  handleLogin: async(req, res, next) => {
    const { username, password } = req.body
    // 檢查帳號
    let user
    try {
      user = await User.findOne({
        where: {
          username
        }
      })
    } catch (err) {
      req.flash('errorMessage', '系統錯誤')
      return next()
    }
    if (!user) {
      req.flash('errorMessage', '帳號不存在')
      return next()
    }
    // 檢查密碼
    bcrypt.compare(password, user.password, (err, result) => {
      if (err) {
        req.flash('errorMessage', '系統錯誤')
        return next()
      }
      if (!result) {
        req.flash('errorMessage', '密碼錯誤')
        return next()
      }
      // 產生一組新的 session id
      req.session.regenerate((err) => {
        if (err) {
          req.flash('errorMessage', '系統錯誤')
          return next()
        }
        req.session.userId = user.id // 在 session 存進使用者名稱
        req.session.username = username // 在 session 存進使用者名稱
        return res.redirect('/index')
      })
    })
  },

  handleLogout: (req, res, next) => {
    // 摧毀 session 後導回上一頁
    req.session.destroy((err) =>
      next()
    )
  },

  renderRegister: (req, res) => (
    // 有登入
    res.render('register', {
      websiteTitle
    })
  ),

  renderLogin: (req, res) => (
    // 有登入
    res.render('login', {
      websiteTitle,
      isLogin: true
    })
  ),

  redirectBack: (req, res, next) => {
    if (req.headers.referer) {
      return res.redirect('back')
    }
    return res.redirect('/login')
  }
}

module.exports = userController
