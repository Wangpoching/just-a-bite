window.addEventListener('load', () => {
  const CartGrossPrice = document.querySelector('.cart-grossprice span')
  const CartGrossPriceDeliveryFee = document.querySelector('.cart-grossprice-deliveryfee span')
  function updateCartGrossPrice() {
    const grossPricePerGood = document.querySelectorAll('.grossprice')
    const accumulatedSum = Array.from(grossPricePerGood).reduce((sum, number) => {
      const updatedSum = sum + Number(number.innerText)
      return updatedSum
    }, 0)
    CartGrossPrice.innerText = accumulatedSum
    CartGrossPriceDeliveryFee.innerText = Number(CartGrossPrice.innerText) >= 1000 ? CartGrossPrice.innerText : `${Number(CartGrossPrice.innerText) + 99}`
  }

  // 刪除品項
  document.querySelector('.cart__table').addEventListener('click', (event) => {
    if (event.target.classList.contains('button-delete')) {
      const { target } = event
      target.parentNode.parentNode.remove()
      return updateCartGrossPrice()
    }
  })

  // 動態改變價格
  const cartTable = document.querySelector('.cart__table')
  cartTable.addEventListener('change', (event) => {
    const { target } = event
    if (target.tagName === 'INPUT') {
      const unitPrice = Number(target.parentNode.parentNode.querySelector('.unitprice').innerText)
      const grossPriceDiv = target.parentNode.parentNode.querySelector('.grossprice')
      grossPriceDiv.innerText = unitPrice * target.value
      return updateCartGrossPrice()
    }
    if (target.tagName === 'SELECT') {
      const unitPriceTd = target.parentNode.parentNode.querySelector('.unitprice')
      const grossPriceTd = target.parentNode.parentNode.querySelector('.grossprice')
      const input = target.parentNode.parentNode.querySelector('input')
      unitPriceTd.innerText = target.options[event.target.selectedIndex].innerText.match(/\$.+/g)[0].slice(1)
      grossPriceTd.innerText = Number(unitPriceTd.innerText) * input.value
      return updateCartGrossPrice()
    }
  })

  // 新增欄位
  document.querySelector('.add-row').addEventListener('click', (event) => {
    const parentNode = document.querySelector('.cart__table tbody')
    const referenceNode = document.querySelector('.add-row').parentNode.parentNode
    const template = document.querySelector('.add-template')
    const tr = document.createElement('tr')
    tr.innerHTML = template.innerHTML
    const select = tr.querySelector('select')
    const input = tr.querySelector('input')
    const unitPriceTd = tr.querySelector('.unitprice')
    const grossPriceTd = tr.querySelector('.grossprice')
    const selectedOption = select.querySelectorAll('option')[0]
    unitPriceTd.innerText = selectedOption.innerText.match(/\$.+/g)[0].slice(1)
    grossPriceTd.innerText = Number(unitPriceTd.innerText) * input.value
    select.setAttribute('name', 'dishId')
    input.setAttribute('name', 'amount')
    parentNode.insertBefore(tr, referenceNode)
    return updateCartGrossPrice()
  })

  // 送出購物車
  const form = document.querySelector('form')
  document.querySelector('.button-upload').addEventListener('click', (event) => {
    event.preventDefault()
    form.setAttribute('action', '/payment')
    form.submit()
  })
})
