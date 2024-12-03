<template>
  <v-app theme="dark">
    <v-app-bar flat>
      <v-container class="d-flex align-center">
        <div class="d-flex align-center">
          <v-icon icon="mdi-briefcase" class="mr-2" color="primary"></v-icon>
          <v-app-bar-title class="text-primary font-weight-bold">Job Application Tracker</v-app-bar-title>
        </div>
        <v-spacer></v-spacer>
        <v-chip
          class="ml-4"
          color="primary"
          variant="elevated"
        >
          Today: {{ store.state.todayCount }}
        </v-chip>
        <v-chip
          class="ml-4"
          color="success"
          variant="elevated"
        >
          Streak: {{ store.state.currentStreak }}/5
        </v-chip>
      </v-container>
    </v-app-bar>

    <v-main class="bg-background">
      <v-container fluid class="pa-6">
        <v-row>
          <v-col cols="12">
            <v-card
              elevation="3"
              class="rounded-lg main-card"
            >
              <v-card-text>
                <v-row align="center" no-gutters>
                  <v-col cols="12" sm="6" class="pa-2">
                    <v-autocomplete
                      v-model="selectedJobBoard"
                      :items="jobBoards"
                      label="Select Job Board"
                      chips
                      variant="outlined"
                      clearable
                      hide-details
                      class="mb-0"
                      @update:model-value="handleJobBoardSelect"
                    ></v-autocomplete>
                  </v-col>
                  <v-col cols="12" sm="6" class="d-flex justify-end pa-2">
                    <v-btn
                      color="primary"
                      size="large"
                      prepend-icon="mdi-plus"
                      :loading="loading"
                      @click="updateCounter"
                      class="px-6 mr-2"
                      min-width="200"
                    >
                      Update Counter (F9)
                    </v-btn>
                    <v-btn
                      color="secondary"
                      size="large"
                      prepend-icon="mdi-file-document-edit"
                      @click="openCoverLetterTemplate"
                      class="px-6"
                      min-width="200"
                    >
                      Cover Letter Template
                    </v-btn>
                  </v-col>
                </v-row>
              </v-card-text>
            </v-card>
          </v-col>
        </v-row>

        <v-card
          class="mt-6 content-card"
          elevation="3"
          min-height="400"
        >
          <v-tabs
            v-model="activeTab"
            color="primary"
            align-tabs="center"
            class="border-b"
            height="48"
          >
            <v-tab value="recent" class="text-body-1 px-6">Recent Responses</v-tab>
            <v-tab value="summary" class="text-body-1 px-6">Summary</v-tab>
            <v-tab value="data-management" class="text-body-1 px-6">Data Management</v-tab>
          </v-tabs>

          <v-window v-model="activeTab" class="fill-height">
            <v-window-item value="recent" class="fill-height">
              <router-view v-slot="{ Component }">
                <component :is="Component" />
              </router-view>
            </v-window-item>
            <v-window-item value="summary" class="fill-height">
              <router-view v-slot="{ Component }">
                <component :is="Component" />
              </router-view>
            </v-window-item>
            <v-window-item value="data-management" class="fill-height">
              <router-view v-slot="{ Component }">
                <component :is="Component" />
              </router-view>
            </v-window-item>
          </v-window>
        </v-card>
      </v-container>
    </v-main>
  </v-app>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import store from './store'

const router = useRouter()
const activeTab = ref('recent')
const selectedJobBoard = ref(null)
const jobBoards = ref(store.state.jobBoards)
const loading = ref(false)

const updateCounter = async () => {
  if (selectedJobBoard.value) {
    loading.value = true
    try {
      const response = await window.electronAPI.saveData({
        jobBoard: selectedJobBoard.value,
        timestamp: new Date().toISOString()
      })
      store.commit('incrementTodayCount')
      store.commit('updateCurrentStreak')
      selectedJobBoard.value = null
    } catch (error) {
      console.error('Error updating counter:', error)
    } finally {
      loading.value = false
    }
  }
}

// Function to open cover letter template
const openCoverLetterTemplate = () => {
  window.electronAPI.openCoverLetterTemplate()
}

// Handle F9 shortcut
const setupShortcut = () => {
  window.electronAPI.onUpdateCounter(() => {
    if (selectedJobBoard.value) {
      updateCounter()
    }
  })
}

// Cleanup shortcut listener
const cleanupShortcut = () => {
  // Cleanup is handled by Electron
}

const handleJobBoardSelect = (value) => {
  selectedJobBoard.value = value
}

// Watch for tab changes and update route
watch(activeTab, (newValue) => {
  router.push(newValue === 'recent' ? '/recent' : 
              newValue === 'summary' ? '/summary' : '/data-management')
})

// Watch for responses changes and update counts
watch(() => store.state.responses, () => {
  store.dispatch('updateCounts')
}, { deep: true })

onMounted(async () => {
  await store.dispatch('loadData')
  const route = router.currentRoute.value.path
  activeTab.value = route === '/summary' ? 'summary' : route === '/data-management' ? 'data-management' : 'recent'
  setupShortcut()
})

onUnmounted(() => {
  cleanupShortcut()
})
</script>

<style>
.bg-background {
  background-color: #121212;
}

.border-b {
  border-bottom: 1px solid rgba(255, 255, 255, 0.12);
}

.main-card {
  min-height: 100px;
}

.content-card {
  min-height: calc(100vh - 280px);
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.15s cubic-bezier(0.4, 0, 0.2, 1);
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.v-window {
  height: calc(100% - 48px);
}

.v-window-item {
  height: 100%;
}

.v-card {
  transition: all 0.3s ease-in-out;
}

.v-btn {
  transition: all 0.2s ease-in-out;
  text-transform: none !important;
  letter-spacing: 0.5px;
}
</style>
