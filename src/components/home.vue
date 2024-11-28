<template>
  <div>
    <!-- <div style="margin-bottom: 4rem;">
      <nav class="navbar navbar-expand-md navbar-dark fixed-top bg-dark border-bottom">
        <div class="container-fluid">
          <a class="navbar-brand" href="#">Adventures in DevOps Podcast</a>
          <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarCollapse" aria-controls="navbarCollapse" aria-expanded="false" aria-label="Toggle navigation">
            <span class="navbar-toggler-icon" />
          </button>
          <div class="collapse navbar-collapse" id="navbarCollapse">
            <ul class="navbar-nav ms-auto me-4 mb-2 mb-md-0">
              <li class="nav-item">
                <a class="nav-link" href="#speaker">Speaking</a>
              </li>
              <li class="nav-item">
                <a class="nav-link" href="?fractional">Fractional</a>
              </li>

              <li class="nav-item">
                <a class="nav-link" href="?resume">Resume</a>
              </li>
            </ul>
          </div>
        </div>
      </nav>
    </div> -->

    <div class="d-flex flex-column justify-content-center align-items-center">
      <div class="container my-4">
        <div class="text-light">
          <div class="container-fluid d-flex justify-content-center">
            <div class="d-flex flex-wrap flex-md-nowrap align-items-center p-5" style="border-radius: 0.5rem">
              <div class="me-md-5">
                <img :src="adventuresInDevopsPicture" height="250" style="border-radius: 1rem">
              </div>
              <div class="mt-4">
                <h1 class="display-5 fw-bold">Adventures in DevOps</h1>
                <h4>
                  <div>Come listen as we join our experts review innovations in the world of DevOps.</div>
                </h4>

                <div class="mt-4">
                  <h2>Hosts:</h2>
                  <div class="mt-3">
                    <div class="d-flex my-4">
                      <img loading="lazy" class="avatar" src="./will.jpg" alt="Will Button">
                      <div>
                        <a href="https://www.linkedin.com/in/willbutton/"><h3>Will Button</h3></a>
                        <div>Head of Infrastructure Technology, Polygon Labs</div>
                      </div>
                    </div>

                    
                    <div class="d-flex my-4">
                      <img loading="lazy" class="avatar" src="./jillian.jpg" alt="Jillian Rowe">
                      <div>
                        <a href="https://www.linkedin.com/in/jillian-rowe-9410437a/"><h3>Jillian Rowe</h3></a>
                        <div>Principal Bioinformatics Infrastructure and AI Consultant</div>
                      </div>
                    </div>

                    <div class="d-flex my-4">
                      <img loading="lazy" class="avatar" src="./warren.jpg" alt="Warren Parad">
                      <div>
                        <a href="https://warrenparad.net/links/linkedin"><h3>Warren Parad</h3></a>
                        <div>CTO, Authress</div>
                      </div>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          </div>
        </div>
      </div>

      <div id="speaker" class="p-4 bg-dark">
        <div class="container px-0 align-items-lg-stretch mw-100 bg-secondary" style="border-radius: 10px">
          <div class="m-0 text-dark">
            <div class="">
              <div class="h-100 p-4 p-md-5 text-white bg-primary mw-100" style="border-radius: 0.5rem;">

                <videos />

                <div class="mt-4">
                  <div class="d-flex flex-wrap justify-content-center">
                    <button class="btn btn-dark flex-shrink-0 me-2 mt-2" type="submit" @click="() => goToPreviousEpisodes()">Previous episodes</button>
                  </div>
                </div>

                <div class="mt-4">
                  <div class="d-flex flex-wrap justify-content-center">
                    <button class="btn btn-dark flex-shrink-0 me-2 mt-2" type="submit" @click="() => openEmail('appearance')">Schedule an appearance</button>
                    <button class="btn btn-dark flex-shrink-0 me-2 mt-2" type="submit" @click="() => openEmail('sponsorship')">Sponsor an episode</button>
                  </div>
                </div>

                <br>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import shortUUID from 'short-uuid';

import adventuresInDevopsPicture from './logo.jpg';

import Videos from './videos.vue';

const key = shortUUID.generate().slice(0, 7);
const openEmail = type => {
  const props = {
    appearance: {
      email: `${encodeURIComponent(`Warren Parad<podcast+${key}@rhosys.ch>`)},${encodeURIComponent(`Will Button<will@willbutton.co>`)}`,
      subject: 'Adventures in DevOps Podcast invite request'
    },
    sponsorship: {
      email: `${encodeURIComponent(`Warren Parad<podcast+${key}@rhosys.ch>`)},${encodeURIComponent(`Will Button<will@willbutton.co>`)}`,
      subject: 'Adventures in DevOps Podcast sponsor request'
    }
  }[type];
  window.open(`mailto:${props.email}?subject=${encodeURIComponent(props.subject)}`);
};

const goToPreviousEpisodes = () => {
  window.open('https://www.youtube.com/playlist?list=PLJesql-aSfX4-ySQL2GKoG585gkp7HuCf');
}

</script>

<style lang="scss" scoped>
@import "bootstrap/scss/mixins";

.authressCallout:not(:hover) {
  text-decoration: none;
  color: white
}

.networking-link {
  text-decoration: none;
  color: #0077B5 !important;
  &:hover, &:hover * {
    color: white !important;
  }
}
.d-flex .fa-brands + div {
  flex-shrink: 0;
}

.avatar {
  height: 70px;
  border-radius: 100px;
  margin-right: 1.5em;
}
</style>
