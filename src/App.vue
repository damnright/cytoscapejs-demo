<template>
<!--  <graph msg="Welcome to Your Vue.js App"/>-->
  <x6graph></x6graph>
</template>

<script>
import graph from './components/graph.vue'
import x6graph from './components/x6.vue'

export default {
  name: 'App',
  components: {
    x6graph
  }
}
</script>

<style>
html, body {
  width: 100%;
  height: 100%;
  margin: 0;
  padding: 0;
  display: block;
}
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  position: relative;
  height: 100%;
}
</style>
