window.addEventListener('load',
  () => {
    document.querySelector('.problems__block').addEventListener('click',
      (e) => {
        console.log('ok')
        if (e.target.closest('.problem__instance')) {
          e.target.closest('.problem__instance').querySelector('.problem__instance-ans').classList.toggle('reveal')
        }
      }
    )
  }

)
