
const request = require('request')
const AWS = require('aws-sdk')
const crypto = require('crypto') // 加密
require('dotenv').config()

const SES_CONFIG = {
  accessKeyId: process.env.ACCESSKEY_ID,
  secretAccessKey: process.env.SECRETACCESSKEY,
  region: process.env.REGION
}
const { HASH_KEY, HASH_IV, MERCHANT_ID } = process.env
const URL = 'https://just-a-bite.bocyun.tw'
const PAYGATEWAY = 'https://ccore.spgateway.com/MPG/mpg_gateway' // 付款網址
const RETURNURL = `${URL}/spgateway/callback?from=ReturnURL` // 支付完成返還商店網址
const NOTIFYURL = `${URL}/spgateway/callback?from=NotifyURL` // 支付通知網址
const CLIENTBACKURL = `${URL}/order` // 支付取消返回網址
const AWS_SES = new AWS.SES(SES_CONFIG) // creating a SES object

// generate csrfToken
function csrfTokenGenerator(digits) {
  let text = ''
  const possible = 'abcdefghijklmnopqrstuvwxyz1234567890'
  for (let i = 0; i < digits; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length))
  }
  return text
}

// upload image to imgur
function uploadImgur(accessToken, image, album, cb) {
  const url = 'https://api.imgur.com/3/image'
  request.post(
    {
      url,
      headers: {
        Authorization: `Bearer ${accessToken}`
      },
      formData: {
        image,
        album
      }
    },
    (error, response, body) => {
      cb(error, response, body)
    }
  )
}

// delete image from imgur
function deleteImgur(accessToken, username, deleteHash, cb) {
  const url = `https://api.imgur.com/3/account/${username}/image/${deleteHash}`
  request.delete(
    {
      url,
      headers: {
        Authorization: `Bearer ${accessToken}`
      }
    },
    (error, response, body) => {
      cb(error, response, body)
    }
  )
}

// sendEmail through aws ses
function sendEmail(recipientEmail, name, serial) {
  const params = {
    Source: 'hi@mail.bocyun.tw',
    Destination: {
      ToAddresses: [
        recipientEmail
      ]
    },
    ReplyToAddresses: [],
    Message: {
      Body: {
        Html: {
          Charset: 'UTF-8',
          Data: `
          Hi! ${name}! Your order on JUST A BITE is established.
          <br />
          The serial number is ${serial}.
          <br />
          You can check the order details through <a href='https://getprize/order'>this link</a>.
          <br />
          If you have any problem. Please feel free to contact us.
          <br />
          <br />
          JUST A BITE
          `
        }
      },
      Subject: {
        Charset: 'UTF-8',
        Data: 'JUST A BITE-Order established'
      }
    }
  }
  return AWS_SES.sendEmail(params).promise()
}

// url tempalte
function generatePageUrl(page, queryFilter) {
  let template = `/admin-order?page=${page}`
  for (const [key, value] of Object.entries(queryFilter)) {
    template += `&${key}=${value}`
  }
  return template
}

// tranform datetime format
function getTime(date) {
  // convert date to number and plus 8 hours
  const ISOString = new Date(+date + 8 * 3600 * 1000).toISOString()
  const formatYmd = `${ISOString.slice(0, 10)} ${ISOString.slice(11, 19)}`
  return formatYmd
}

// 放入 createMpgAesEncrypt 將交易資訊轉成字串，以便加密使用
function genDataChain(tradeInfo) {
  const results = []
  for (const kv of Object.entries(tradeInfo)) {
    results.push(`${kv[0]}=${kv[1]}`)
  }
  return results.join('&')
}

function createMpgAesEncrypt(tradeInfo) {
  const encrypt = crypto.createCipheriv('aes256', HASH_KEY, HASH_IV)
  const enc = encrypt.update(genDataChain(tradeInfo), 'utf8', 'hex')
  return enc + encrypt.final('hex')
}

function createMpgShaEncrypt(tradeInfo) {
  const sha = crypto.createHash('sha256')
  const plainText = `HashKey=${HASH_KEY}&${tradeInfo}&HashIV=${HASH_IV}`

  return sha
    .update(plainText)
    .digest('hex')
    .toUpperCase()
}

// 交易完成後回傳資料使用的反向解密
function createMpgAesDecrypt(tradeInfo) {
  const decrypt = crypto.createDecipheriv('aes256', HASH_KEY, HASH_IV)
  decrypt.setAutoPadding(false)
  const text = decrypt.update(tradeInfo, 'hex', 'utf8')
  const plainText = text + decrypt.final('utf8')
  /* eslint-disable */
  const result = plainText.replace(/[\x00-\x20]+/g, '')
  /* eslint-enable */
  return result
}

function getTradeInfo(serial, amt, desc, mail) {
  console.log('===== getTradeInfo =====')
  console.log(serial, amt, desc, mail)
  console.log('==========')

  const data = {
    MerchantID: MERCHANT_ID, // 商店代號
    RespondType: 'JSON', // 回傳格式
    TimeStamp: Date.now(), // 時間戳記
    Version: 1.6, // 串接程式版本
    MerchantOrderNo: serial, // 商店訂單編號
    LoginType: 0, // 智付通會員
    OrderComment: 'OrderComment', // 商店備註
    Amt: amt, // 訂單金額
    ItemDesc: desc, // 產品名稱
    Email: mail, // 付款人電子信箱
    ReturnURL: RETURNURL, // 支付完成返回商店網址
    NotifyURL: NOTIFYURL, // 支付通知網址/每期授權結果通知
    ClientBackURL: CLIENTBACKURL // 支付取消返回商店網址
  }

  console.log('===== getTradeInfo: data =====')
  console.log(data)

  const mpgAesEncrypt = createMpgAesEncrypt(data)
  const mpgShaEncrypt = createMpgShaEncrypt(mpgAesEncrypt)

  console.log('===== getTradeInfo: mpg_aes_encrypt, mpg_sha_encrypt =====')
  console.log(mpgAesEncrypt)
  console.log(mpgShaEncrypt)

  const tradeInfo = {
    MerchantID: MERCHANT_ID, // 商店代號
    TradeInfo: mpgAesEncrypt, // 加密後參數
    TradeSha: mpgShaEncrypt,
    Version: 1.6, // 串接程式版本
    PayGateWay: PAYGATEWAY,
    MerchantOrderNo: data.MerchantOrderNo
  }

  console.log('===== getTradeInfo: tradeInfo =====')
  console.log(tradeInfo)

  return tradeInfo
}

module.exports = {
  csrfTokenGenerator,
  uploadImgur,
  deleteImgur,
  sendEmail,
  generatePageUrl,
  getTime,
  getTradeInfo,
  createMpgAesDecrypt
}
