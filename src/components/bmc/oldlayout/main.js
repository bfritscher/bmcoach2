import Vue from 'vue';
import vuetify from './plugins/vuetify';
import VueTimeago from 'vue-timeago';
import humanFormat from 'human-format';
import { auth, db } from '@/utils/firebase';
import VueAnalytics from 'vue-analytics';
import * as Sentry from '@sentry/vue';
import { Integrations } from '@sentry/tracing';
import { mapActions } from 'vuex';
import InstantSearch from 'vue-instantsearch';

import App from './App';
import router from './router';
import store from './store';
import './registerServiceWorker';

Vue.use(InstantSearch);

Vue.use(VueTimeago, {
  locale: 'en-US',
  locales: {
    en: require('date-fns/locale/en-GB'),
  },
});

Vue.use(VueAnalytics, {
  id: 'UA-20936263-1',
  router,
});

Vue.filter('humanformat', (input) =>
  isNaN(input) ? input : humanFormat(input),
);

if (process.env.NODE_ENV === 'production') {
  Sentry.init({
    Vue,
    dsn: 'https://a3e9d60494a249d4bba6e6244380e411@sentry.j42.org/15',
    release: process.env.COMMIT_HASH,
    integrations: [
      new Integrations.BrowserTracing({
        routingInstrumentation: Sentry.vueRouterInstrumentation(router),
        tracingOrigins: ['localhost', 'chat.bmcoach.app', 'bmdesigner.com', /^\//],
      }),
    ],
    tracesSampleRate: 1.0,
  });
}

Vue.config.productionTip = false;

const INVITE_TOKEN = 'inviteToken';

router.afterEach((to) => {
  if (to.name === 'login' && to.params.inviteCode) {
    localStorage.setItem(INVITE_TOKEN, to.params.inviteCode);
  }
});

new Vue({
  vuetify,
  router,
  store,
  components: { App },
  // Our earliest lifecycle hook
  beforeCreate() {
    auth.onAuthStateChanged((user) => {
      this.$store.commit('CURRENT_USER', user);
      if (user) {
        this.$ga.set('userId', user.uid);
        this.$store.dispatch('setUserRef', db.child('users').child(user.uid));
        const inviteCode = localStorage.getItem(INVITE_TOKEN);
        if (inviteCode) {
          const [projectUid, token] = inviteCode.split(':');
          const body = {
            userUid: user.uid,
            projectUid,
            token,
          };
          fetch(
            'https://us-central1-bmdesigner-50d6c.cloudfunctions.net/acceptInvite',
            {
              headers: {
                Accept: 'application/json',
                'Content-Type': 'application/json',
              },
              method: 'POST',
              body: JSON.stringify(body),
            },
          ).then((res) => {
            if (res.status === 200) {
              this.$router.push({ name: 'bmc', params: { id: projectUid } });
              localStorage.removeItem(INVITE_TOKEN);
            } else {
              this.$router.push({ name: 'home' });
            }
          });
        } else if (this.$route.name === 'login') {
          this.$router.push({ name: 'home' });
        }
      }
    });
  },
  mounted() {
    document.addEventListener('keydown', (e) => {
      if ((e.which || e.keyCode) === 116 && this.$route.name === 'bmc') {
        // F5
        e.preventDefault();
        this.presentationStart();
      }
      if (this.$route.name === 'bmc' && this.$store.state.layout.presentation) {
        if ((e.which || e.keyCode) === 27) {
          // ESC
          e.preventDefault();
          this.presentationExit();
        }
        if ((e.which || e.keyCode) === 37 || (e.which || e.keyCode) === 33) {
          // left pageup
          this.presentationPrevious();
        }
        if ((e.which || e.keyCode) === 39 || (e.which || e.keyCode) === 34) {
          // right pagedown
          this.presentationNext();
        }
        if ((e.which || e.keyCode) === 190) {
          // .
        }
      }
    });
    if (this.$route.name !== 'print') {
      setTimeout(() => {
        const ur = document.createElement('script');
        ur.type = 'text/javascript';
        ur.async = true;
        ur.src = '//cdn.userreport.com/userreport.js';
        document.body.appendChild(ur);
      }, 4000);
    }
  },
  methods: {
    ...mapActions([
      'presentationStart',
      'presentationExit',
      'presentationNext',
      'presentationPrevious',
    ]),
  },
  render: (h) => h(App),
}).$mount('#app');
