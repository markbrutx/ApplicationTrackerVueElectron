<template>
  <div class="summary-container">
    <!-- Statistics Cards -->
    <v-row class="mt-4">
      <v-col cols="12" sm="4">
        <v-card class="stat-card primary-gradient">
          <v-card-text class="text-center">
            <div class="text-h4 font-weight-bold white--text">{{ todayCount }}</div>
            <div class="text-subtitle-1 white--text">Applications Today</div>
          </v-card-text>
        </v-card>
      </v-col>
      <v-col cols="12" sm="4">
        <v-card class="stat-card success-gradient">
          <v-card-text class="text-center">
            <div class="text-h4 font-weight-bold white--text">{{ currentStreak }}</div>
            <div class="text-subtitle-1 white--text">Day Streak</div>
          </v-card-text>
        </v-card>
      </v-col>
      <v-col cols="12" sm="4">
        <v-card class="stat-card info-gradient">
          <v-card-text class="text-center">
            <div class="text-h4 font-weight-bold white--text">{{ totalApplications }}</div>
            <div class="text-subtitle-1 white--text">Total Applications</div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Charts Row -->
    <v-row class="mt-4">
      <v-col cols="12" md="6">
        <v-card class="chart-card">
          <v-card-title class="d-flex align-center">
            <v-icon color="primary" class="mr-2">mdi-chart-pie</v-icon>
            Job Board Distribution
          </v-card-title>
          <v-card-text>
            <Pie
              v-if="chartData.labels.length > 0"
              :data="chartData"
              :options="chartOptions"
            />
            <div v-else class="text-center pa-4">
              No data available
            </div>
          </v-card-text>
        </v-card>
      </v-col>
      
      <v-col cols="12" md="6">
        <v-card class="chart-card">
          <v-card-title class="d-flex align-center">
            <v-icon color="primary" class="mr-2">mdi-chart-line</v-icon>
            Daily Activity
          </v-card-title>
          <v-card-text>
            <Line
              v-if="lineChartData.labels.length > 0"
              :data="lineChartData"
              :options="lineChartOptions"
            />
            <div v-else class="text-center pa-4">
              No data available
            </div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Data Table -->
    <v-card class="mt-4">
      <v-data-table
        :headers="headers"
        :items="summaryData"
        :loading="loading"
        class="elevation-1"
      >
        <template v-slot:top>
          <v-card-title class="d-flex align-center">
            <v-icon color="primary" class="mr-2">mdi-table</v-icon>
            Detailed Summary
          </v-card-title>
        </template>
      </v-data-table>
    </v-card>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { Pie, Line } from 'vue-chartjs'
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement
} from 'chart.js'

ChartJS.register(
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement
)

const responses = ref([])
const loading = ref(true)
const todayCount = ref(0)
const currentStreak = ref(0)
const totalApplications = computed(() => responses.value.length)

const updateTodayCount = () => {
  const today = new Date()
  const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate())
  const todayEnd = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59, 999)
  
  todayCount.value = responses.value.filter(r => {
    const responseDate = new Date(r.timestamp)
    return responseDate >= todayStart && responseDate <= todayEnd
  }).length
}

const calculateStreak = () => {
  let streak = 0
  let currentDate = new Date()
  currentDate.setHours(0, 0, 0, 0)

  // Проверяем каждый день, начиная с сегодняшнего
  while (true) {
    const dayStart = new Date(currentDate)
    const dayEnd = new Date(currentDate)
    dayEnd.setHours(23, 59, 59, 999)

    // Проверяем есть ли отклики за этот день
    const hasResponses = responses.value.some(r => {
      const responseDate = new Date(r.timestamp)
      return responseDate >= dayStart && responseDate <= dayEnd
    })

    if (!hasResponses) break
    streak++
    currentDate.setDate(currentDate.getDate() - 1)
  }

  currentStreak.value = streak
}

const chartColors = [
  'rgb(54, 162, 235)',
  'rgb(255, 99, 132)',
  'rgb(75, 192, 192)',
  'rgb(255, 206, 86)',
  'rgb(153, 102, 255)',
  'rgb(255, 159, 64)',
]

// Pie Chart Data
const chartData = computed(() => {
  const data = {}
  responses.value.forEach(response => {
    data[response.jobBoard] = (data[response.jobBoard] || 0) + 1
  })

  return {
    labels: Object.keys(data),
    datasets: [{
      data: Object.values(data),
      backgroundColor: chartColors,
      borderWidth: 1
    }]
  }
})

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'right',
    }
  }
}

// Line Chart Data
const lineChartData = computed(() => {
  const dates = {}
  const today = new Date()
  const lastWeek = new Date(today)
  lastWeek.setDate(lastWeek.getDate() - 6)

  // Initialize last 7 days
  for (let d = new Date(lastWeek); d <= today; d.setDate(d.getDate() + 1)) {
    dates[d.toDateString()] = 0
  }

  // Count applications per day
  responses.value.forEach(response => {
    const date = new Date(response.timestamp)
    if (date >= lastWeek && date <= today) {
      dates[date.toDateString()] = (dates[date.toDateString()] || 0) + 1
    }
  })

  return {
    labels: Object.keys(dates).map(date => new Date(date).toLocaleDateString('en-US', { weekday: 'short' })),
    datasets: [{
      label: 'Applications',
      data: Object.values(dates),
      borderColor: 'rgb(75, 192, 192)',
      tension: 0.3,
      fill: true,
      backgroundColor: 'rgba(75, 192, 192, 0.2)'
    }]
  }
})

const lineChartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      display: false
    }
  },
  scales: {
    y: {
      beginAtZero: true,
      ticks: {
        stepSize: 1
      }
    }
  }
}

const summaryData = computed(() => {
  const summary = {}
  const today = new Date().toDateString()

  responses.value.forEach(response => {
    if (!summary[response.jobBoard]) {
      summary[response.jobBoard] = {
        jobBoard: response.jobBoard,
        todayCount: 0,
        totalCount: 0
      }
    }
    
    const entry = summary[response.jobBoard]
    entry.totalCount++
    
    if (new Date(response.timestamp).toDateString() === today) {
      entry.todayCount++
    }
  })

  return Object.values(summary)
})

const headers = [
  { title: 'Job Board', key: 'jobBoard' },
  { title: 'Today', key: 'todayCount' },
  { title: 'Total', key: 'totalCount' },
]

const loadData = async () => {
  loading.value = true
  try {
    const data = await window.electronAPI.loadData()
    if (data && data.responses) {
      responses.value = data.responses
      updateTodayCount()
      calculateStreak()
    }
  } catch (error) {
    console.error('Error loading data:', error)
  } finally {
    loading.value = false
  }
}

onMounted(async () => {
  await loadData()
  
  // Подписываемся на обновления
  window.electronAPI.onUpdateCounter(async () => {
    await loadData()
  })
})
</script>

<style scoped>
.summary-container {
  padding: 16px;
  height: 100vh;
  overflow-y: auto;
}

.stat-card {
  height: 120px;
  transition: transform 0.2s;
}

.stat-card:hover {
  transform: translateY(-5px);
}

.chart-card {
  height: 400px;
}

.chart-card .v-card-text {
  height: calc(100% - 64px);
}

.primary-gradient {
  background: linear-gradient(45deg, #1976d2, #64b5f6);
}

.success-gradient {
  background: linear-gradient(45deg, #2e7d32, #81c784);
}

.info-gradient {
  background: linear-gradient(45deg, #0097a7, #4dd0e1);
}

/* Dark theme optimizations */
:deep(.v-card) {
  background-color: rgba(30, 30, 30, 0.95);
}

:deep(.v-data-table) {
  background-color: transparent !important;
}

:deep(.v-data-table-header) {
  background-color: rgba(40, 40, 40, 0.95);
}

:deep(.v-data-table-row) {
  transition: background-color 0.2s;
}

:deep(.v-data-table-row:hover) {
  background-color: rgba(50, 50, 50, 0.95) !important;
}
</style>
