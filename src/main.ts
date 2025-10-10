import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { Quasar, Dialog, Notify, Meta } from 'quasar'

// Import icon libraries
import "@fontsource/inter";
import "@fontsource/itim";
import '@quasar/extras/material-icons/material-icons.css'
import '@quasar/extras/material-icons-outlined/material-icons-outlined.css'

// Import Quasar css
import 'quasar/src/css/index.sass'

import App from './App.vue'
import router from './router'

import { configure } from "vue-gtag";

import * as Sentry from "@sentry/vue";
import { createSentryPiniaPlugin } from "@sentry/vue";

if (import.meta.env.PROD) {
  configure({
    tagId: "G-MRJ0WWE0ZG"
  })
}

const app = createApp(App)

Sentry.init({
  dsn: "https://2d1f50bd64ee48f78f399e4579f8b02f@e.bf0.ch/6",
   sendDefaultPii: true,
  integrations: [
    Sentry.browserTracingIntegration({ router }),
  ],
  tracesSampleRate: 1.0,
  release: process.env.COMMIT_HASH,
  tracePropagationTargets: ["localhost", "bmdesigner.com"],
});

const pinia = createPinia()
pinia.use(createSentryPiniaPlugin());


app.use(pinia)
app.use(router)
app.use(Quasar, {
  plugins: { Dialog, Notify, Meta }, // import Quasar plugins and add here
  config: {

  },
})

app.mount('#app')
