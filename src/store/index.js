import Vue from 'vue'
import Vuex from 'vuex'

Vue.use(Vuex)

export default new Vuex.Store({
  getters: {
    receiver(state) {
      return state.receiver;
    }
  },
  
  state: {
    receiver: ''
  },
  
  mutations: {
    updateReceiver(state, name) {
      console.log("committing mutation on name = ", name);
      state.receiver = name;
      return state.receiver;
    }
  },
  
  actions: {
    updateReceiver(context, name) {
      console.log("Commiting updateReceiver with name = ", name);
      context.commit('updateReceiver', name);
    }
  },
  
  modules: {

  }
})
