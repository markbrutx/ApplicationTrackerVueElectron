<template>
  <div class="job-boards-stats">
    <div class="job-boards-stats-content">
      <div class="header d-flex align-center pa-4">
        <v-icon icon="mdi-chart-box" class="mr-2" color="primary"></v-icon>
        <span class="text-h5 font-weight-bold">Job Boards Statistics</span>
        <v-spacer></v-spacer>
        <v-chip
          color="primary"
          variant="elevated"
          size="small"
          class="mr-2"
        >
          {{ totalApplications }} applications
        </v-chip>
        <v-chip
          color="success"
          variant="elevated"
          size="small"
        >
          {{ jobBoards.length }} boards
        </v-chip>
      </div>
      <v-divider></v-divider>
      
      <v-card flat class="pa-4">
        <v-row>
          <v-col cols="12" sm="6" md="3">
            <v-card class="stat-card" color="primary" variant="tonal">
              <v-card-text class="d-flex flex-column align-center">
                <div class="text-h4 mb-1">{{ todayTotal }}</div>
                <div class="text-caption">Today's Applications</div>
              </v-card-text>
            </v-card>
          </v-col>
          <v-col cols="12" sm="6" md="3">
            <v-card class="stat-card" color="success" variant="tonal">
              <v-card-text class="d-flex flex-column align-center">
                <div class="text-h4 mb-1">{{ mostActiveBoard.name || '-' }}</div>
                <div class="text-caption">Most Active Board</div>
              </v-card-text>
            </v-card>
          </v-col>
          <v-col cols="12" sm="6" md="3">
            <v-card class="stat-card" color="info" variant="tonal">
              <v-card-text class="d-flex flex-column align-center">
                <div class="text-h4 mb-1">{{ averagePerBoard.toFixed(1) }}</div>
                <div class="text-caption">Average per Board</div>
              </v-card-text>
            </v-card>
          </v-col>
          <v-col cols="12" sm="6" md="3">
            <v-card class="stat-card" color="warning" variant="tonal">
              <v-card-text class="d-flex flex-column align-center">
                <div class="text-h4 mb-1">{{ activeBoardsCount }}</div>
                <div class="text-caption">Active Boards</div>
              </v-card-text>
            </v-card>
          </v-col>
        </v-row>
      </v-card>

      <v-card flat class="mx-4">
        <v-card-text class="pa-0">
          <v-table hover>
            <thead>
              <tr>
                <th class="text-left">Job Board</th>
                <th class="text-center">Today</th>
                <th class="text-center">Total</th>
                <th class="text-center">% of Total</th>
                <th class="text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="board in jobBoardsStats" :key="board.name" :class="{'highlight-row': board.todayCount > 0}">
                <td class="text-left font-weight-medium">{{ board.name }}</td>
                <td class="text-center">
                  <v-chip
                    v-if="board.todayCount > 0"
                    color="primary"
                    size="small"
                    variant="elevated"
                  >
                    {{ board.todayCount }}
                  </v-chip>
                  <span v-else>-</span>
                </td>
                <td class="text-center">{{ board.totalCount }}</td>
                <td class="text-center">
                  <v-progress-linear
                    :model-value="(board.totalCount / totalApplications) * 100"
                    color="primary"
                    height="20"
                    rounded
                  >
                    <template v-slot:default="{ value }">
                      <span class="progress-text">{{ Math.round(value) }}%</span>
                    </template>
                  </v-progress-linear>
                </td>
                <td class="text-center">
                  <v-btn
                    color="primary"
                    size="small"
                    variant="text"
                    @click="openInBrowser(board.name)"
                    class="action-btn"
                    :ripple="false"
                  >
                    <v-icon icon="mdi-open-in-new" size="small" class="mr-1"></v-icon>
                    Go
                  </v-btn>
                </td>
              </tr>
            </tbody>
          </v-table>
        </v-card-text>
      </v-card>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useStore } from 'vuex'

const store = useStore()
const responses = ref([])
const jobBoards = computed(() => store.state.jobBoards)

const openInBrowser = async (boardName) => {
  const url = boardName.startsWith('http') ? boardName : `https://${boardName}`
  await window.electronAPI.openInBrowser(url)
}

// Calculate statistics for each job board
const jobBoardsStats = computed(() => {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  return jobBoards.value.map(boardName => {
    const boardResponses = responses.value.filter(r => r.jobBoard === boardName)
    const todayResponses = boardResponses.filter(r => {
      const responseDate = new Date(r.timestamp)
      responseDate.setHours(0, 0, 0, 0)
      return responseDate.getTime() === today.getTime()
    })

    return {
      name: boardName,
      todayCount: todayResponses.length,
      totalCount: boardResponses.length
    }
  }).sort((a, b) => b.totalCount - a.totalCount) // Sort by total count descending
})

// Additional statistics
const totalApplications = computed(() => {
  return jobBoardsStats.value.reduce((sum, board) => sum + board.totalCount, 0)
})

const todayTotal = computed(() => {
  return jobBoardsStats.value.reduce((sum, board) => sum + board.todayCount, 0)
})

const mostActiveBoard = computed(() => {
  return jobBoardsStats.value[0] || { name: '-', totalCount: 0 }
})

const averagePerBoard = computed(() => {
  return totalApplications.value / jobBoards.value.length || 0
})

const activeBoardsCount = computed(() => {
  return jobBoardsStats.value.filter(board => board.totalCount > 0).length
})

const loadData = async () => {
  try {
    const data = await window.electronAPI.loadData()
    responses.value = data.responses || []
  } catch (error) {
    console.error('Error loading data:', error)
  }
}

onMounted(async () => {
  await loadData()
  
  // Listen for updates
  window.electronAPI.onUpdateCounter(() => {
    loadData()
  })
})
</script>

<style scoped>
.job-boards-stats {
  padding: 20px;
  height: 100%;
  background-color: var(--v-background-base);
}

.job-boards-stats-content {
  background-color: var(--v-surface-base);
  border-radius: 8px;
  height: 100%;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.header {
  background-color: var(--v-surface-variant-base);
  border-top-left-radius: 8px;
  border-top-right-radius: 8px;
}

.stat-card {
  transition: transform 0.2s;
}

.stat-card:hover {
  transform: translateY(-2px);
}

.highlight-row {
  background-color: var(--v-primary-lighten5);
}

.progress-text {
  color: white;
  font-size: 0.75rem;
  font-weight: 500;
}

.action-btn {
  opacity: 0.8;
  transition: opacity 0.2s;
}

.action-btn:hover {
  opacity: 1;
}

:deep(.v-progress-linear__content) {
  align-items: center;
  display: flex;
  justify-content: center;
}
</style>
