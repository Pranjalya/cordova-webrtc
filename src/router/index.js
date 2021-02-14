import Vue from 'vue'
import VueRouter from 'vue-router'
/*import Home from '../views/Home.vue'
import Chat from '../views/Chat.vue'
*/
Vue.use(VueRouter)

const routes = [ 
  /*
  {
    path: '/',
    name: 'home',
    component: Home
  },
  {
    path: '/chat',
    name: 'chat',
    component: Chat
  },
  */
]

const router = new VueRouter({
  mode: 'history',
  base: process.env.BASE_URL,
  routes
})

export default router
