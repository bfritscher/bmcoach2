<template>
  <q-layout view="hHh LpR lFr">
    <q-header bordered class="bg-primary text-white">
      <q-toolbar>
        <q-btn
          v-if="!!route.meta?.back"
          flat
          dense
          round
          icon="arrow_back"
          aria-label="Back"
          :to="{name: 'team'}"
        />
        <q-btn
          v-if="!!route.meta?.leftDrawer"
          flat
          dense
          round
          icon="menu"
          aria-label="Menu"
          @click="uiStore.leftDrawerOpen = !uiStore.leftDrawerOpen"
        />
        <router-link
          :to="homeLink"
          class="q-toolbar__title ellipsis col-shrink text-white text-decoration-none"
          >{{ APP_NAME }}</router-link
        >
        <search-bar />
        <div class="col-grow row no-wrap items-center">
          <router-view v-slot="{ Component }" name="toolbar">
            <component :is="Component" v-if="Component" />
          </router-view>
        </div>
        <div v-if="accountStore.account">
          <q-btn flat round>
            <q-avatar size="md" class="cursor-pointer">
              <img :src="avatars.getInitials({name: accountStore.account.name})" />
            </q-avatar>
            <q-menu fit>
              <q-list style="min-width: 150px">
                <q-item clickable to="/account">
                  <q-item-section>
                    <q-item-label>Edit Account</q-item-label>
                    <q-item-label caption>{{ accountStore.account.name }}</q-item-label>
                  </q-item-section>
                </q-item>
                <q-separator />
                <q-item clickable @click="accountStore.logout()">
                  <q-item-section>Logout</q-item-section>
                </q-item>
              </q-list>
            </q-menu>
          </q-btn>
        </div>
        <div v-else>
          <router-link
            to="/login"
            class="q-toolbar__title ellipsis col-shrink text-white text-decoration-none"
            >Login</router-link
          >
        </div>
      </q-toolbar>
    </q-header>

    <q-drawer
      :model-value="!!(route.meta?.leftDrawer && uiStore.leftDrawerOpen)"
      side="left"
      bordered
      :show-if-above="!!route.meta?.leftDrawer"
      @update:model-value="uiStore.leftDrawerOpen = $event"
    >
      <router-view name="leftDrawer"></router-view>
    </q-drawer>

    <q-drawer v-model="uiStore.rightDrawerOpen" side="right" overlay elevated behavior="mobile">
      <router-view name="rightDrawer"></router-view>
    </q-drawer>

    <q-page-container>
      <router-view />
    </q-page-container>
  </q-layout>
</template>

<script setup lang="ts">
import { useAccountStore } from '@/stores/account'
import { avatars } from '@/api/appwrite'
import { useUIStore } from '@/stores/ui-store'
import { useRoute } from 'vue-router'
import { computed } from 'vue'
import SearchBar from '@/components/SearchBar.vue'
import { APP_NAME } from '@/utils/constants'

const accountStore = useAccountStore()
const uiStore = useUIStore()
const route = useRoute()
const homeLink = computed(() => {
  if (route.params.teamId && route.name !== 'team') {
    return `/team/${route.params.teamId}`
  }
  return '/'
})
</script>
