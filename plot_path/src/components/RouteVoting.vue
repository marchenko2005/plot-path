<template>
  <section id="voting" class="route-voting">
    <v-container>
      <div class="title">Vote for next route of the month</div>
      <div class="vote-circle">
        <!-- Vote Options -->
        <v-btn
          v-for="option in options"
          :key="option.label"
          class="vote-btn"
          :class="option.position"
          color="secondary"
          :variant="selected === option.label ? 'elevated' : 'outlined'"
          @click="select(option.label)"
        >
          {{ option.label }}
        </v-btn>

        <!-- Center Vote Circle -->
        <div class="center-circle" @click="submitVote">
          Vote
        </div>
      </div>
    </v-container>
  </section>
</template>

<script lang="ts" setup>
  import { ref } from 'vue'

  const selected = ref('')

  const options = [
    { label: 'Enemies to lovers', position: 'top-left' },
    { label: 'Non-fiction', position: 'top-right' },
    { label: 'Thrillers', position: 'bottom-left' },
    { label: 'Poetry', position: 'bottom-right' },
  ]

  function select (option: string) {
    selected.value = option
  }

  function submitVote () {
    if (!selected.value) {
      alert('Please select an option first.')
    } else {
      alert(`Voted for: ${selected.value}`)
    }
  }
</script>

<style scoped lang="scss">
.route-voting {
  background-color: rgb(var(--v-theme-gray));
  padding: 100px 0;
  text-align: center;

  .title {
    color: rgb(var(--v-theme-secondary));
    font-weight: 600;
    font-size: 2rem;
    margin-bottom: 40px;
  }

  .vote-circle {
    position: relative;
    margin: auto;
    width: 600px;
    height: 600px;
    border-radius: 50%;
    background-color: rgb(var(--v-theme-gray));
    border: 3px solid #e3b6c0;
  }

  .vote-btn {
    position: absolute;
    width: 397px;
    height: 130px;
    border: 3px solid rgb(var(--v-theme-secondary));
    border-radius: 24px;
    font-size: 36px;
    font-weight: bold;
    text-transform: none;
    background-color: white;
    transition: all 0.3s ease;
  }

  .top-left {
    top: 10%;
    left: -50%;
  }

  .top-right {
    top: 10%;
    right: -50%;
  }

  .bottom-left {
    bottom: 10%;
    left: -50%;
  }

  .bottom-right {
    bottom: 10%;
    right: -50%;
  }

  .center-circle {
    position: absolute;
    top: 50%;
    left: 50%;
    width: 275px;
    height: 275px;
    background-color: white;
    color: rgb(var(--v-theme-primary));
    border: 4px solid rgb(var(--v-theme-secondary));
    border-radius: 50%;
    transform: translate(-50%, -50%);
    font-weight: bold;
    font-size: 48px;
    display: flex;
    justify-content: center;
    align-items: center;
    box-shadow: 0 0 0 6px #f1d5db;
    cursor: pointer;
    transition: 0.3s;

    &:hover {
      background-color: rgb(var(--v-theme-primary));
      color: white;
    }
  }
}
</style>
