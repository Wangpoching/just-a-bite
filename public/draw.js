// escape html tags
/* eslint-disable */
String.prototype.escape = function() {
  const tagsToReplace = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;'
  }
  return this.replace(/[&<>]/g, (tag) =>
    tagsToReplace[tag] || tag
  )
}
/* eslint-enable */
window.addEventListener('load', () => {
  document.querySelector('.lottery-button').addEventListener('click', () => {
    if (document.querySelector('.lottery-button').innerText === '點我抽獎') {
      draw((err, data) => {
        // 只要有錯誤就跳系統錯誤
        if (err) {
          alert(err)
          return
        }
        const { name, desc, imageUrl } = data.prize
        // 換封面
        document.querySelector('.image__banner').style.backgroundImage = `url(${imageUrl})`

        // 換內容
        document.querySelector('.image__banner').removeChild(document.querySelector('.lottery-ticket'))
        const div = document.createElement('div')
        const prizeMsg = `${name}: ${desc}`
        div.innerText = prizeMsg.escape()
        div.classList.add('prz-msg')
        document.querySelector('.image__banner').prepend(div)
        document.querySelector('.lottery-button').innerText = '再抽一次'
      })
    } else {
      window.location.reload()
    }
  })
})

const apiUrl = 'https://just-a-bite.bocyun.tw/lottery'
const errorMsg = '系統不穩定，請再試一次'

// call api
function draw(cb) {
  const request = new XMLHttpRequest()
  request.onerr = function() {
    cb(errorMsg)
  }
  request.open('GET', apiUrl, true)
  request.send()
  request.onload = function() {
    if (request.status >= 200 && request.status < 400) {
      let data
      try {
        data = JSON.parse(request.responseText)
      } catch (e) {
        cb(errorMsg)
        return
      }
      console.log(data.success)
      if (!data.success) {
        cb(errorMsg)
        return
      }
      cb(null, data)
    } else {
      cb(errorMsg)
    }
  }
}
