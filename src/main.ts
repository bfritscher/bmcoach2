import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { Quasar, Dialog, Notify, Meta } from 'quasar'

// Import icon libraries
import '@quasar/extras/roboto-font/roboto-font.css'
import '@quasar/extras/material-icons/material-icons.css'
import '@quasar/extras/material-icons-outlined/material-icons-outlined.css'

// Import Quasar css
import 'quasar/src/css/index.sass'

import App from './App.vue'
import router from './router'

const app = createApp(App)

app.use(createPinia())
app.use(router)
app.use(Quasar, {
  plugins: { Dialog, Notify, Meta }, // import Quasar plugins and add here
  config: {

  },
})

app.mount('#app')
