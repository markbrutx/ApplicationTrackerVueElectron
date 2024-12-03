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
    <div style="max-height: 600px; overflow-y: auto;">
      <v-data-table
        :headers="headers"
        :items="responses"
        :loading="loading"
        class="elevation-0"
        hover
      >
        <template v-slot:item.jobBoard="{ item }">
          <div class="d-flex align-center">
            <v-icon icon="mdi-check-circle" color="success" class="mr-2"></v-icon>
            {{ item.jobBoard }}
            <v-btn
              icon="mdi-delete"
              variant="text"
              size="small"
              color="error"
              class="ml-auto"
              @click="deleteResponse(item.id)"
            ></v-btn>
          </div>
        </template>
        <template v-slot:item.timestamp="{ item }">
          {{ new Date(item.timestamp).toLocaleString('en-US', {
            timeZone: 'Asia/Yekaterinburg',
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
          }) }}
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
    </div>
  </v-card>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import store from '../store'

const headers = [
  { 
    title: 'Job Board',
    key: 'jobBoard',
    align: 'start',
    sortable: true
  },
  { 
    title: 'Time',
    key: 'timestamp',
    align: 'start',
    sortable: true
  }
]

const responses = ref([])
const loading = ref(false)

const loadData = async () => {
  loading.value = true
  try {
    const data = await window.electronAPI.loadData()
    if (data && data.responses) {
      responses.value = data.responses
    }
  } catch (error) {
    console.error('Error loading data:', error)
  } finally {
    loading.value = false
  }
}

const deleteResponse = async (id) => {
  try {
    loading.value = true
    await window.electronAPI.deleteResponse(id)
    await loadData()
  } catch (error) {
    console.error('Error deleting response:', error)
  } finally {
    loading.value = false
  }
}

// Единственный обработчик обновлений
window.electronAPI.onUpdateCounter(() => {
  loadData()
})

onMounted(() => {
  loadData()
})
</script>

<style scoped>
.v-data-table {
  background: transparent !important;
}
</style>
