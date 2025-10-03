<template>
  <v-container fluid grid-list-lg>
    <v-btn
      v-if="$store.state.currentUser"
      color="primary"
      fab
      class="floating-action"
      @click="createNewCanvas"
    >
      <v-icon>add</v-icon>
    </v-btn>
    <v-row wrap>
      <v-col
        v-for="{ info, settings = {}, key } in projects"
        :key="key"
        cols="12"
        sm="6"
        md="4"
        xl="3"
      >
        <v-card class="model">
          <v-img
            :contain="!!info.logoImage"
            :class="{
              'default-background': !info.logoImage,
              'fix-white': info.logoColor == 'rgb(255, 255, 255)',
            }"
            :style="{
              'background-color': info.logoColor
                ? info.logoColor
                : colorHash(info.name),
            }"
            :src="
              info.logoImage
                ? info.logoImage
                : require('@/assets/default_bmc_logo_background.jpg')
            "
            @click="$router.push({ name: 'bmc', params: { id: key } })"
          >
            <div v-if="info.updatedAt" class="left-icons">
              <v-icon dark> event_note </v-icon>
              <timeago :datetime="info.updatedAt"></timeago>
            </div>
            <div class="right-icons">
              <v-badge bottom overlap>
                <template #badge>
                  <span>{{ info.stickyCount || 0 }}</span>
                </template>
                <v-icon dark>note</v-icon>
              </v-badge>
              <v-badge bottom overlap>
                <template #badge>
                  <span>{{ info.usersCount || 1 }}</span>
                </template>
                <v-icon dark>account_box</v-icon>
              </v-badge>
              <v-spacer></v-spacer>
              <v-icon v-if="info.public" dark title="public">public</v-icon>
              <v-icon v-if="!info.public" dark title="private">lock</v-icon>
            </div>
            <v-container fill-height fluid>
              <v-row fill-height align-end>
                <v-col cols="12" class="headline white--text">{{
                  info.name
                }}</v-col>
              </v-row>
            </v-container>
          </v-img>
          <v-card-actions class="white">
            <v-btn icon @click="toggleFav(key, !settings.fav)">
              <v-icon :color="settings.fav ? 'primary' : 'grey'"
                >favorite</v-icon
              >
            </v-btn>
            <v-spacer></v-spacer>
            <v-btn
              text
              color="primary"
              :to="{ name: 'bmc', params: { id: key } }"
              >Open</v-btn
            >
          </v-card-actions>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script>
import ColorHash from 'color-hash';
import { mapActions, mapState } from 'vuex';

const colorHash = new ColorHash({
  saturation: [0.35, 0.4],
  lightness: [0.6, 0.65],
});

export default {
  name: 'Home',
  computed: {
    ...mapState({
      user: 'user',
    }),
    projects() {
      const projects = Object.keys(this.user.projects || {})
        .map((key) => {
          const p = this.user.projects[key];
          p.key = key;
          return p;
        })
        .filter((p) => {
          if (this.$route.name === 'favorites') {
            return p.settings.fav;
          }
          if (this.$route.name === 'inspire') {
            // only show user's current games
            return p.isGame;
          }
          return true;
        });

      if (this.$route.name === 'inspire') {
        // append public game starers?
      }

      projects.sort(
        (a, b) => new Date(b.info.updatedAt) - new Date(a.info.updatedAt),
      );
      return projects;
    },
  },
  methods: {
    ...mapActions([
      'createNewCanvas',
      'canvasInfoUpdate',
      'canvasUserSettingsUpdate',
    ]),
    colorHash(input) {
      return colorHash.hex(input);
    },
    toggleFav(canvasKey, fav) {
      this.canvasUserSettingsUpdate({
        fav,
        canvasKey,
      });
    },
  },
};
</script>

<style>
.model .headline {
  text-shadow: 1px 1px 1px rgba(0, 0, 0, 0.6);
}

.model .v-image {
  height: 160px !important;
}

.model .v-image__image {
  opacity: 0.8;
}

.model .default-background .v-image__image {
  opacity: 0.5;
  background-position: 0 0 !important;
}

.model .fix-white .v-responsive__content {
  background-color: rgba(69, 89, 100, 0.33);
}

.model .v-badge--overlap.v-badge--bottom:after {
  font-size: 12px;
  height: 18px;
  width: 18px;
}
.v-badge--overlap.v-badge--bottom .v-badge__badge {
  z-index: 10;
}

.model .right-icons {
  position: absolute;
  top: 0px;
  right: 15px;
  bottom: 4px;
  display: flex;
  flex-direction: column;
}

.model .left-icons {
  position: absolute;
  top: 5px;
  left: 10px;
  color: #fff;
  text-shadow: 1px 1px 1px rgba(0, 0, 0, 0.65);
  line-height: 12px;
}

.model .v-image .v-icon {
  margin: 4px 4px 0 4px;
  color: rgba(255, 255, 255, 0.9);
  text-shadow: 1px 1px 1px rgba(0, 0, 0, 0.5);
}

.model .container {
  padding: 16px;
}

.floating-action {
  position: fixed !important;
  right: 16px;
  bottom: 16px;
  z-index: 1;
}
</style>
