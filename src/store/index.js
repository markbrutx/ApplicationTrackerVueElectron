import { createStore } from 'vuex'

const basicSound = '/sounds/success_sound.mp3'
const advancedSounds = [
  '/sounds/success1.MP3',
  '/sounds/success2.MP3',
  '/sounds/success3.MP3',
  '/sounds/success4.MP3',
  '/sounds/success5.MP3'
]

const state = {
  responses: [],
  jobBoards: [
    'hh.kz',
    'career.habr.com',
    'dou.ua',
    'getmatch.ru',
    'djinni.co',
    'indeed.com',
    'jobs.devby.io',
    'glassdoor.com',
    'wellfound.com',
    'linkedin.com',
    'weworkremotely.com',
    'remoteok.com',
    'justremote.co',
    'frontendremotejobs.com',
    'flexjobs.com',
    'remotive.com',
    'angel.co',
    'toptal.com',
    'dynamitejobs.com',
    'arc.dev'
  ],
  todayCount: 0,
  currentStreak: 0,
  totalStreaks: 0,
  isBasicStreak: true
}

const getStreakSound = (streak, isBasicStreak) => {
  if (isBasicStreak) {
    return basicSound
  }
  // В продвинутом стрике используем нумерованные звуки
  return advancedSounds[streak - 1]
}

export default createStore({
  state,
  actions: {
    async addResponse({ commit, state }, jobBoard) {
      const timestamp = new Date().toISOString()
      await window.electronAPI.saveData({ jobBoard, timestamp })
      await this.dispatch('loadData')
      
      // Calculate new streak
      const newStreak = (state.currentStreak % 5) + 1
      
      // If we completed previous streak (at 5)
      if (state.currentStreak === 5) {
        // Toggle between basic and advanced streaks
        commit('toggleStreakType')
        // Reset streak to 1 for new cycle
        commit('setStreak', 1)
      } else {
        commit('setStreak', newStreak)
      }
      
      // Play the appropriate sound
      await this.dispatch('playSound')
      await this.dispatch('updateCounts')
    },

    async deleteResponse({ commit }, id) {
      const responses = await window.electronAPI.deleteResponse(id)
      commit('setResponses', responses)
      await this.dispatch('updateCounts')
    },

    async clearTodayData({ commit }) {
      const data = await window.electronAPI.clearTodayData()
      commit('setResponses', data.responses)
      await this.dispatch('updateCounts')
    },

    async clearAllData({ commit }) {
      commit('clearResponses')
    },

    async deleteAllData({ commit }) {
      try {
        await window.electronAPI.clearStore()
        commit('clearResponses')
      } catch (error) {
        console.error('Error deleting all data:', error)
        throw error
      }
    },

    playSound({ state }) {
      const soundPath = getStreakSound(state.currentStreak, state.isBasicStreak)
      const audio = new Audio(soundPath)
      audio.play().catch(error => {
        console.error('Error playing sound:', error)
      })
    },

    updateCounts({ commit, state }) {
      const today = new Date()
      const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate())
      const todayEnd = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59, 999)
      
      const todayResponses = state.responses.filter(r => {
        const responseDate = new Date(r.timestamp)
        return responseDate >= todayStart && responseDate <= todayEnd
      })
      
      commit('setTodayCount', todayResponses.length)
    },

    async loadData({ commit }) {
      const data = await window.electronAPI.loadData()
      // Сначала сбрасываем все
      commit('resetStreak')
      commit('setResponses', data.responses)
      if (data.jobBoards && data.jobBoards.length > 0) {
        commit('setJobBoards', data.jobBoards)
      }
      // Обновляем только todayCount, без обновления стрика
      await this.dispatch('updateCounts')
    },

    addCustomJobBoard({ commit, state }, name) {
      if (!state.jobBoards.includes(name)) {
        commit('addJobBoard', name)
      }
    }
  },
  mutations: {
    setStreak(state, streak) {
      state.currentStreak = streak
    },
    incrementTodayCount(state) {
      state.todayCount++
    },
    updateCurrentStreak(state) {
      // Увеличиваем текущий стрик
      if (state.currentStreak === 0) {
        state.currentStreak = 1
      } else if (state.currentStreak === 5) {
        // Если достигли 5, начинаем новый цикл
        state.currentStreak = 1
        // Переключаем между базовым и продвинутым режимом
        state.isBasicStreak = !state.isBasicStreak
      } else {
        state.currentStreak++
      }
    },
    incrementTotalStreaks(state) {
      state.totalStreaks++
    },
    toggleStreakType(state) {
      state.isBasicStreak = !state.isBasicStreak
    },
    setResponses(state, responses) {
      state.responses = responses
    },
    setTodayCount(state, count) {
      state.todayCount = count
    },
    setJobBoards(state, jobBoards) {
      state.jobBoards = jobBoards
    },
    addJobBoard(state, name) {
      state.jobBoards.push(name)
    },
    clearResponses(state) {
      state.responses = []
      state.currentStreak = 0
      state.totalStreaks = 0
      state.isBasicStreak = true // Reset to basic streak
    },
    resetStreak(state) {
      state.currentStreak = 0
      state.isBasicStreak = true
    }
  }
})
