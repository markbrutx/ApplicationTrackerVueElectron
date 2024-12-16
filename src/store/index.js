import { createStore } from 'vuex'
import path from 'path'

// В production используем путь относительно __dirname
const isDev = process.env.NODE_ENV === 'development'
const basicSound = isDev ? '/sounds/success_sound.mp3' : '../sounds/success_sound.mp3'
const advancedSounds = [
  isDev ? '/sounds/success1.MP3' : '../sounds/success1.MP3',
  isDev ? '/sounds/success2.MP3' : '../sounds/success2.MP3',
  isDev ? '/sounds/success3.MP3' : '../sounds/success3.MP3',
  isDev ? '/sounds/success4.MP3' : '../sounds/success4.MP3',
  isDev ? '/sounds/success5.MP3' : '../sounds/success5.MP3'
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
      try {
        commit('updateCurrentStreak')
        
        await this.dispatch('playSound')
        
        const timestamp = new Date().toISOString()
        await window.electronAPI.saveData({ jobBoard, timestamp })
        
        const data = await window.electronAPI.loadData()
        if (data && data.responses) {
          commit('setResponses', data.responses)
          commit('setTodayCount', data.responses.filter(r => {
            const responseDate = new Date(r.timestamp)
            const today = new Date()
            return responseDate.getDate() === today.getDate() &&
                   responseDate.getMonth() === today.getMonth() &&
                   responseDate.getFullYear() === today.getFullYear()
          }).length)
        }
      } catch (error) {
        console.error('Error in addResponse:', error)
      }
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
      const todayResponses = state.responses.filter(r => {
        const responseDate = new Date(r.timestamp)
        return responseDate.getDate() === today.getDate() &&
               responseDate.getMonth() === today.getMonth() &&
               responseDate.getFullYear() === today.getFullYear()
      })
      
      commit('setTodayCount', todayResponses.length)
      
      if (todayResponses.length > 0 && state.currentStreak === 0) {
        commit('updateCurrentStreak')
      }
    },

    async loadData({ commit }) {
      const data = await window.electronAPI.loadData()
      commit('setResponses', data.responses)
      if (data.jobBoards && data.jobBoards.length > 0) {
        commit('setJobBoards', data.jobBoards)
      }
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
      if (state.currentStreak === 5) {
        state.currentStreak = 1
        state.totalStreaks++
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
