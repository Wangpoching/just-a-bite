/* eslint-disable no-unused-vars */
function focusinRemoveErrmsg(delegation, errmsg) {
  delegation.addEventListener('focusin', () => {
    if (!errmsg.classList.contains('hidden')) {
      errmsg.classList.add('hidden')
    }
  })
}
