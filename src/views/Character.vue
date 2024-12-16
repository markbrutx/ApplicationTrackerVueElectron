<template>
  <v-container fluid class="pa-4 fill-height">
    <div class="overflow-y-auto" style="height: 100%">
      <v-row class="ma-0">
        <!-- Room Column -->
        <v-col cols="12" md="8" class="pa-4">
          <v-card elevation="2" class="room-card">
            <v-card-title class="py-4 px-6 bg-primary">
              <v-icon icon="mdi-home" class="mr-2" size="32" color="white"></v-icon>
              <span class="text-h5 font-weight-bold white--text">Your Room</span>
            </v-card-title>
            
            <v-card-text class="pa-0">
              <v-img
                :src="roomImage"
                width="800"
                height="600"
                class="mx-auto"
                contain
              ></v-img>
            </v-card-text>
          </v-card>
        </v-col>

        <!-- Stats Column -->
        <v-col cols="12" md="4" class="pa-4">
          <v-card elevation="2" class="h-100">
            <v-card-title class="py-4 px-6 bg-primary">
              <v-icon icon="mdi-account" class="mr-2" size="32" color="white"></v-icon>
              <span class="text-h5 font-weight-bold white--text">Your Character</span>
            </v-card-title>
            
            <v-card-text class="pa-6">
              <v-list class="character-stats pa-0">
                <v-list-item class="mb-4">
                  <template v-slot:prepend>
                    <v-avatar color="warning" size="48" class="mr-3">
                      <v-icon icon="mdi-star" size="24" color="white"></v-icon>
                    </v-avatar>
                  </template>
                  <v-list-item-title class="text-h6 mb-1">Level {{ characterLevel }}</v-list-item-title>
                  <v-list-item-subtitle class="text-subtitle-1">
                    XP: {{ characterXP }}/{{ nextLevelXP }}
                  </v-list-item-subtitle>
                </v-list-item>
                
                <v-list-item class="mb-4">
                  <template v-slot:prepend>
                    <v-avatar :color="characterHP > 50 ? 'success' : 'error'" size="48" class="mr-3">
                      <v-icon icon="mdi-heart" size="24" color="white"></v-icon>
                    </v-avatar>
                  </template>
                  <v-list-item-title class="text-h6 mb-1">HP: {{ characterHP }}/100</v-list-item-title>
                  <v-list-item-subtitle class="text-subtitle-1">
                    {{ getHPStatus }}
                  </v-list-item-subtitle>
                </v-list-item>
                
                <v-list-item class="mb-6">
                  <template v-slot:prepend>
                    <v-avatar color="error" size="48" class="mr-3">
                      <v-icon icon="mdi-fire" size="24" color="white"></v-icon>
                    </v-avatar>
                  </template>
                  <v-list-item-title class="text-h5 mb-1">{{ currentStreak }}/5</v-list-item-title>
                  <v-list-item-subtitle class="text-subtitle-1">
                    Current Streak (Total: {{ totalStreaks }})
                  </v-list-item-subtitle>
                </v-list-item>

                <div class="text-h6 mb-2">Progress to Next Level</div>
                <v-progress-linear
                  :model-value="(characterXP / nextLevelXP) * 100"
                  color="primary"
                  height="32"
                  rounded
                  striped
                  class="mb-4"
                >
                  <template v-slot:default="{ value }">
                    <strong class="text-subtitle-1">{{ Math.ceil(value) }}%</strong>
                  </template>
                </v-progress-linear>
                
                <div class="text-subtitle-1 text-medium-emphasis text-center">
                  {{ nextLevelXP - characterXP }} XP needed for next level
                </div>
              </v-list>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>
    </div>
  </v-container>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useStore } from 'vuex'
import roomImage from '../assets/room.png'

const store = useStore()
const characterLevel = ref(1)
const characterHP = ref(100)
const characterXP = ref(0)
const currentStreak = computed(() => store.state.currentStreak)
const totalStreaks = computed(() => store.state.totalStreaks)

const nextLevelXP = computed(() => characterLevel.value * 100)

const getHPStatus = computed(() => {
  if (characterHP.value > 75) return 'Energized and Ready!'
  if (characterHP.value > 50) return 'Doing Good'
  if (characterHP.value > 25) return 'Getting Tired...'
  return 'Critical! Apply to jobs soon!'
})

watch(() => store.state.currentStreak, async () => {
  await updateCharacterInfo()
})

const updateCharacterInfo = async () => {
  const character = await window.electronAPI.getCharacter()
  if (character) {
    characterLevel.value = character.level
    characterHP.value = character.hp
    characterXP.value = character.xp
  }
}

onMounted(async () => {
  await updateCharacterInfo()
  
  const unsubscribeXP = window.electronAPI.onXPGained((event, result) => {
    characterLevel.value = result.currentLevel
    characterXP.value = result.currentXP
    updateCharacterInfo() 
  })

  const unsubscribeCharacterDied = window.electronAPI.onCharacterDied(() => {
    updateCharacterInfo()
  })

  onUnmounted(() => {
    unsubscribeXP()
    unsubscribeCharacterDied()
  })
})
</script>

<style scoped>
.v-progress-linear {
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.overflow-y-auto {
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
}

.character-stats :deep(.v-list-item) {
  padding: 16px;
  border-radius: 8px;
  background: rgba(var(--v-theme-surface-variant), 0.1);
}

.character-stats :deep(.v-list-item:hover) {
  background: rgba(var(--v-theme-surface-variant), 0.2);
}

.room-card :deep(.v-img) {
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
}

:deep(.v-card-title) {
  border-top-left-radius: inherit;
  border-top-right-radius: inherit;
}

.h-100 {
  height: 100%;
}
</style>
