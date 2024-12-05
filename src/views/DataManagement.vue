<template>
  <div class="data-management">
    <div class="data-management-content">
      <div class="header d-flex align-center pa-4">
        <v-icon icon="mdi-database-cog" class="mr-2" color="primary"></v-icon>
        <span class="text-h5 font-weight-bold">Data Management</span>
        <v-spacer></v-spacer>
        <v-chip
          color="primary"
          variant="elevated"
          size="small"
        >
          {{ responses.length }} entries
        </v-chip>
      </div>
      <v-divider></v-divider>
      <div class="content-area pa-6">
        <div class="actions">
          <v-switch
            v-model="notificationsEnabled"
            color="primary"
            label="Notifications"
            class="mb-4"
            @change="toggleNotifications"
          ></v-switch>
          <v-btn
            color="warning"
            @click="clearTodayData"
            prepend-icon="mdi-delete-sweep"
            min-width="200"
            class="action-btn mb-8"
            variant="elevated"
            block
          >
            Clear Today's Data
          </v-btn>
          <v-btn
            color="error"
            @click="deleteAllData"
            prepend-icon="mdi-delete"
            min-width="200"
            class="action-btn mb-8"
            variant="elevated"
            block
          >
            Delete All Data
          </v-btn>
          <v-btn
            color="primary"
            @click="downloadJson"
            prepend-icon="mdi-download"
            min-width="200"
            class="action-btn"
            variant="elevated"
            block
          >
            Download JSON
          </v-btn>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'

const responses = ref([])
const notificationsEnabled = ref(localStorage.getItem('notificationsEnabled') === 'true')

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

const showConfirmDialog = (message, title) => {
  return new Promise((resolve) => {
    if (confirm(`${title}\n\n${message}`)) {
      resolve(true)
    } else {
      resolve(false)
    }
  })
}

const clearTodayData = async () => {
  const confirmed = await showConfirmDialog(
    'Are you sure you want to clear today\'s data?',
    'Warning'
  )
  if (confirmed) {
    try {
      await window.electronAPI.clearTodayData()
    } catch (error) {
      console.error('Error clearing today\'s data:', error)
    }
  }
}

const deleteAllData = async () => {
  const confirmed = await showConfirmDialog(
    'Are you sure you want to delete all data? This action cannot be undone.',
    'Warning'
  )
  if (confirmed) {
    try {
      await window.electronAPI.deleteAllData()
    } catch (error) {
      console.error('Error deleting all data:', error)
    }
  }
}

const downloadJson = () => {
  const data = responses.value
  const jsonString = JSON.stringify(data, null, 2)
  const blob = new Blob([jsonString], { type: 'application/json' })
  const url = window.URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'responses.json'
  a.click()
  window.URL.revokeObjectURL(url)
}

const toggleNotifications = () => {
  localStorage.setItem('notificationsEnabled', notificationsEnabled.value)
  window.electron.send('toggle-notifications', notificationsEnabled.value)
}
</script>

<style scoped>
.data-management {
  padding: 20px;
  min-height: calc(100vh - 300px);
}

.data-management-content {
  border-radius: 8px;
  overflow: hidden;
}

.actions {
  max-width: 400px;
  margin: 0 auto;
  padding: 32px;
}

.action-btn {
  transition: transform 0.2s;
  height: 48px !important;
}

.action-btn:hover {
  transform: translateY(-2px);
}

:deep(.v-btn) {
  text-transform: none;
  letter-spacing: 0.5px;
}
</style>
