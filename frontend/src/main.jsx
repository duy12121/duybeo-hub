import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

console.log('🙏 Nam mô deploy thành công')
console.log('🧘‍♂️ Console opened. May bugs stay away.')

window.onerror = function(message, source, lineno, colno, error) {
  console.error('A di đà Phật, lại là nghiệp', { message, source, lineno, colno, error })
  return false
}

window.addEventListener('unhandledrejection', function(event) {
  console.error('A di đà Phật, lại là nghiệp (Promise)', event.reason)
})

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
