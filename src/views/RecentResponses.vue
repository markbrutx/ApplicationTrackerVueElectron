<template>
  <v-card class="mt-4 mx-auto" max-width="1200" elevation="3">
    <v-card-title class="text-h5 font-weight-bold pa-4 bg-primary text-white d-flex align-center">
      Recent Responses
      <v-spacer></v-spacer>
      <v-chip
        class="ml-2"
        color="white"
        text-color="primary"
        size="small"
      >
        {{ responses.length }} entries
      </v-chip>
    </v-card-title>
    <v-data-table
      :headers="headers"
      :items="responses"
      :loading="loading"
      class="elevation-0"
      hover
    >
      <template v-slot:item.timestamp="{ item }">
        <span class="text-grey-darken-2">{{ formatDate(item.timestamp) }}</span>
      </template>
      <template v-slot:loader>
        <v-progress-linear indeterminate color="primary"></v-progress-linear>
      </template>
      <template v-slot:no-data>
        <div class="pa-4 text-center text-grey-darken-1">
          No responses available
        </div>
      </template>
    </v-data-table>
  </v-card>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch } from 'vue'
import store from '../store'

const headers = [
  { title: 'Job Board', key: 'jobBoard' },
  { title: 'Timestamp', key: 'timestamp' },
]

const responses = ref([])
const loading = ref(false)

const formatDate = (timestamp) => {
  return new Date(timestamp).toLocaleString()
}

const loadData = async () => {
  loading.value = true
  try {
    const data = await window.electronAPI.loadData()
    responses.value = data.responses || []
  } catch (error) {
    console.error('Error loading data:', error)
  } finally {
    loading.value = false
  }
}

// Handle both IPC and direct store updates
const handleUpdate = async () => {
  await loadData()
}

// Listen for IPC updates
const setupIpcListener = () => {
  window.electronAPI.onUpdateCounter(handleUpdate)
}

// Remove IPC listener
const cleanupIpcListener = () => {
  // Cleanup is handled by Electron
}

// Watch for store changes
watch(() => store.state.responses, async (newResponses) => {
  if (newResponses) {
    responses.value = newResponses
  }
}, { deep: true })

onMounted(async () => {
  await loadData()
  setupIpcListener()
  // Initial sync with store
  if (store.state.responses.length > 0) {
    responses.value = store.state.responses
  }
})

onUnmounted(() => {
  cleanupIpcListener()
})
</script>

<style scoped>
.v-data-table {
  background: transparent;
}

:deep(.v-data-table-header) {
  background-color: #f5f5f5;
}

:deep(.v-data-table-header th) {
  font-weight: bold !important;
  color: rgba(0, 0, 0, 0.87) !important;
}
</style>
