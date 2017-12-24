import Vue from 'vue'

const state = {
  selected: null,
  inspectedInstance: {},
  instances: [],
  instancesMap: {},
  expansionMap: {},
  events: []
}

const mutations = {
  FLUSH (state, payload) {
    let start
    if (process.env.NODE_ENV !== 'production') {
      start = window.performance.now()
    }

    // Instance ID map
    // + add 'parent' properties
    const map = {}
    function walk (instance) {
      map[instance.id] = instance
      if (instance.children) {
        instance.children.forEach(child => {
          child.parent = instance
          walk(child)
        })
      }
    }
    payload.instances.forEach(walk)

    // Mutations
    state.instances = Object.freeze(payload.instances)
    state.inspectedInstance = Object.freeze(payload.inspectedInstance)
    state.instancesMap = Object.freeze(map)

    if (process.env.NODE_ENV !== 'production') {
      Vue.nextTick(() => {
        console.log(`devtools render took ${window.performance.now() - start}ms.`)
      })
    }
  },
  RECEIVE_INSTANCE_DETAILS (state, instance) {
    state.inspectedInstance = Object.freeze(instance)
  },
  TOGGLE_INSTANCE ({ expansionMap }, { id, expanded }) {
    Vue.set(expansionMap, id, expanded)
  }
}

const actions = {
  toggleInstance ({ commit, dispatch, state }, { instance, expanded, recursive, parent }) {
    commit('TOGGLE_INSTANCE', { id: instance.id, expanded })

    if (recursive) {
      instance.children.forEach((child) => {
        dispatch('toggleInstance', {
          instance: child,
          expanded,
          recursive
        })
      })
    }

    // Expand the parents
    if (parent) {
      let i = instance
      while (i.parent) {
        i = i.parent
        commit('TOGGLE_INSTANCE', {
          id: i.id,
          expanded: true
        })
      }
    }
  }
}

export default {
  namespaced: true,
  state,
  mutations,
  actions
}
