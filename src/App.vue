<template>
  <v-app theme="dark">
    <v-app-bar flat height="64" class="px-4">
      <template v-slot:prepend>
        <div class="d-flex align-center">
          <v-icon icon="mdi-briefcase" class="mr-2" color="primary" size="24"></v-icon>
          <v-app-bar-title class="text-primary font-weight-bold">
            Job Application Tracker
          </v-app-bar-title>
        </div>
      </template>

      <template v-slot:append>
        <v-chip color="info" variant="elevated" class="mr-2" size="small">
          Level: {{ characterLevel }}
        </v-chip>
        <v-chip :color="characterHP > 50 ? 'success' : 'error'" variant="elevated" class="mr-2" size="small">
          HP: {{ characterHP }}
        </v-chip>
        <v-chip color="primary" variant="elevated" class="mr-2" size="small">
          Today: {{ store.state.todayCount }}
        </v-chip>
        <v-chip color="success" variant="elevated" size="small">
          Streak: {{ store.state.currentStreak }}/5
        </v-chip>
      </template>
    </v-app-bar>

    <v-main class="bg-background">
      <v-container class="pa-4">
        <v-row class="mt-0">
          <v-col cols="12">
            <v-card elevation="3" class="rounded-lg main-card">
              <v-card-text class="pa-2">
                <v-row align="center" class="ma-0">
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
                      density="comfortable"
                      @update:model-value="handleJobBoardSelect"
                    ></v-autocomplete>
                  </v-col>
                  <v-col cols="12" sm="6" class="d-flex justify-end pa-2">
                    <v-btn
                      color="primary"
                      size="large"
                      prepend-icon="mdi-refresh"
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

        <v-card class="mt-4" elevation="3">
          <v-tabs
            v-model="activeTab"
            align-tabs="center"
            class="mb-0"
          >
            <v-tab value="recent" class="text-body-1">Recent</v-tab>
            <v-tab value="summary" class="text-body-1">Summary</v-tab>
            <v-tab value="data-management" class="text-body-1">Data Management</v-tab>
            <v-tab value="job-boards" class="text-body-1">Job Boards</v-tab>
            <v-tab value="character" class="text-body-1">
              <v-icon icon="mdi-account" class="mr-1"></v-icon>
              Character
            </v-tab>
          </v-tabs>

          <router-view class="content-area" />
        </v-card>
      </v-container>
    </v-main>

    <v-dialog v-model="showDeathDialog" persistent max-width="400">
      <v-card>
        <v-card-title class="text-h5 text-center">
          Your character is weakened!
        </v-card-title>
        <v-card-text class="text-center pa-4">
          You haven't been active for more than 24 hours.
          <br>
          Your level will be reduced from {{ deathData?.currentLevel }} to {{ deathData?.newLevel }}.
        </v-card-text>
        <v-card-actions class="justify-center pb-4">
          <v-btn color="primary" @click="resurrectCharacter">
            Continue
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
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
const characterLevel = ref(1)
const characterHP = ref(100)
const characterXP = ref(0)

const getCurrentTimeUTC5 = () => {
  const now = new Date();
  // Устанавливаем временную зону UTC+5
  return now.toLocaleString('en-US', { 
    timeZone: 'Asia/Yekaterinburg' // UTC+5
  });
}

const updateCounter = async () => {
  if (selectedJobBoard.value && !loading.value) {
    loading.value = true
    try {
      // Используем действие из store вместо прямого сохранения
      await store.dispatch('addResponse', selectedJobBoard.value)
    } catch (error) {
      console.error('Error updating counter:', error)
    } finally {
      loading.value = false
    }
  }
}

// Function to open cover letter template
const openCoverLetterTemplate = async () => {
  try {
    if (!window.electronAPI) {
      console.error('Electron API not available')
      return
    }
    await window.electronAPI.openCoverLetterTemplate()
  } catch (error) {
    console.error('Error opening cover letter template:', error)
  }
}

// Handle F9 shortcut
const setupShortcut = () => {
  window.electronAPI.onUpdateCounter(() => {
    if (selectedJobBoard.value) {
      updateCounter()
    }
  })
}

const cleanupShortcut = () => {
}

const handleJobBoardSelect = (value) => {
  selectedJobBoard.value = value
}

watch(activeTab, (newValue) => {
  router.push(newValue === 'recent' ? '/recent' : 
              newValue === 'summary' ? '/summary' : 
              newValue === 'job-boards' ? '/job-boards' : 
              newValue === 'character' ? '/character' : '/data-management')
})

watch(() => store.state.responses, () => {
  store.dispatch('updateCounts')
}, { deep: true })

const showDeathDialog = ref(false)
const deathData = ref(null)

const resurrectCharacter = async () => {
  if (deathData.value) {
    const character = await window.electronAPI.getCharacter()
    if (character) {
      character.level = deathData.value.newLevel
      character.hp = deathData.value.newHp
      character.lastDeathCheck = deathData.value.lastDeathCheck
      await window.electronAPI.saveCharacter(character)
      showDeathDialog.value = false
      deathData.value = null
      await updateCharacterInfo()
    }
  }
}

const updateCharacterInfo = async () => {
  try {
    const character = await window.electronAPI.getCharacter()
    if (character) {
      characterLevel.value = character.level
      characterHP.value = character.hp
      characterXP.value = character.xp
    }
  } catch (error) {
    console.error('Error updating character info:', error)
  }
}

onMounted(async () => {
  await updateCharacterInfo()
  const status = await window.electronAPI.checkCharacterStatus()
  if (status.died) {
    deathData.value = status
    showDeathDialog.value = true
  }
  await store.dispatch('loadData')
  const route = router.currentRoute.value.path
  activeTab.value = route === '/summary' ? 'summary' : 'recent'
  setupShortcut()

  const unsubscribeCharacterDied = window.electronAPI.onCharacterDied(async () => {
    await updateCharacterInfo()
  })

  const unsubscribeXP = window.electronAPI.onXPGained(async (event, result) => {
    if (result.levelUp) {
    }
    characterLevel.value = result.currentLevel
    characterXP.value = result.currentXP
    await updateCharacterInfo()
  })

  const unsubscribeCounter = window.electronAPI.onUpdateCounter(async () => {
    await store.dispatch('loadData')
    await updateCharacterInfo()
  })

  onUnmounted(() => {
    unsubscribeCharacterDied()
    unsubscribeXP()
    unsubscribeCounter()
    cleanupShortcut()
  })

  await updateCharacterInfo()
})

onUnmounted(() => {
  cleanupShortcut()
})
</script>

<style scoped>
.v-main {
  min-height: 100vh;
  background-color: #121212;
}

.v-container {
  max-width: 1400px;
  height: 100%;
}

.content-area {
  height: calc(100vh - 280px);
  min-height: 400px;
  padding: 16px;
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
}

.v-card {
  overflow: hidden;
}

.v-app-bar {
  border-bottom: 1px solid rgba(255, 255, 255, 0.12);
}

.v-app-bar-title {
  font-size: 1.25rem;
  letter-spacing: 0.0125em;
}

.v-chip {
  font-weight: 500;
}

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

.flex-grow-1 {
  flex-grow: 1;
}

.v-window {
  height: 100%;
}

.v-window__container {
  height: 100%;
}

.v-main {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.v-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  max-width: 1400px;
}

.content-card {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.v-window {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 400px;
}

.v-window__container {
  flex: 1;
  display: flex;
}

.v-window-item {
  flex: 1;
  display: flex;
}

.v-app-bar {
  border-bottom: 1px solid rgba(255, 255, 255, 0.12);
}

.v-app-bar-title {
  font-size: 1.25rem;
  letter-spacing: 0.0125em;
}

.v-chip {
  font-weight: 500;
}
</style>
