<template>
  <div id="about" class="about-us">
    <v-container>
      <v-row>
        <v-col cols="12">
          <h3 class="text-h3">About Us</h3>
          <p class="text-body-1">PlotPath is a gamified reading platform that transforms your love of books into an engaging journey.<br> We believe that every story is a path — and every reader deserves their own adventure.<br>
            Here, you don’t just read — you explore personalized routes built around your favorite genres, themes, or authors. As you progress, you earn badges, track your achievements, and connect with others on similar reading quests.<br>
            Whether you're diving into dystopias, unraveling mysteries, or following poetic trails — PlotPath makes your reading experience structured, fun, and rewarding.<br>
            Our mission is simple:<br> To reignite the joy of reading and turn it into a shared, meaningful journey.
          </p>
          <span>Your reading journey starts here</span>
        </v-col>
      </v-row>
    </v-container>

  </div>
</template>

<script setup lang="ts">

</script>

<style scoped>
.about-us {
  padding: 150px 0;
  text-align: center;

  h3 {
    margin-bottom: 50px;
  }

  p {
    max-width: 890px;
    margin: 0 auto;
    font-family: 'Azeret Mono', sans-serif;
  }

  span {
    margin-top: 50px;
    display: inline-block;
    color: rgb(var(--v-theme-primary));
  }
}
</style>
