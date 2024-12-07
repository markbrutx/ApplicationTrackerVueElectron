import { createRouter, createWebHashHistory } from 'vue-router'
import RecentResponses from '../views/RecentResponses.vue'
import Summary from '../views/Summary.vue'
import DataManagement from '../views/DataManagement.vue'
import JobBoardsStats from '../views/JobBoardsStats.vue'

const routes = [
  {
    path: '/',
    redirect: '/recent'
  },
  {
    path: '/recent',
    name: 'Recent Responses',
    component: RecentResponses
  },
  {
    path: '/summary',
    name: 'Summary',
    component: Summary
  },
  {
    path: '/data-management',
    name: 'Data Management',
    component: DataManagement
  },
  {
    path: '/job-boards',
    name: 'Job Boards Stats',
    component: JobBoardsStats
  }
]

const router = createRouter({
  history: createWebHashHistory(),
  routes
})

export default router
