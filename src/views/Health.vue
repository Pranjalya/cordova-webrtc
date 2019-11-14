<template>
  <div id="app">
    <div id="nav">
      <router-link to="/">Home</router-link>Hello, I am your health checker.
    </div>
    <button v-on:click="disconnectHealth">Disconnect</button>
    <br />
    <br />
    <button v-on:click="connectHealth">Connect</button>
    <br />
    <br />
    <button v-on:click="getData">Get Data</button>
    <p>Your height is : {{ height }}</p>
    <p>You took {{ getSteps }} steps in last 3 days.</p>
    <p>Claries consumed today : {{ getCalories }}</p>
    <p>
      <button v-on:click="storeDatapoint">Store Data Point</button>
    </p>
    <button v-on:click="setNotification">Set Notification</button>
    <br />
    <br />
    <br />
    <!--  <router-link to="/chat">Chat</router-link>  -->
  </div>
</template>

<script>

document.addEventListener("deviceready", function() {
  console.log("Local notification active? ",cordova.plugins.notification.local);
  console.log(cordova.plugins.notification.local.getDefaults());
});

export default {
  data() {
    return {
      height: "",
      steps: 0,
      calories: ""
    };
  },

  methods: {
    disconnectHealth() {
      navigator.health.disconnect(
        disconnected => {
          alert("GoogleFit disconnected from app");
        },
        err => {
          console.log(err);
        }
      );
    },

    connectHealth() {
      this.initializeHealth();
    },

    initializeHealth() {
      navigator.health.isAvailable(
        available => {
          console.log("Google Health Kit available - ", available);
          if (!available) {
            navigator.health.promptInstallFit(
              () => {},
              err => {
                console.log(err);
              }
            );
          }
        },
        err => {
          console.log(err);
        }
      );

      var reqs = [
        "calories",
        "distance",
        {
          read: ["steps"],
          write: ["height", "weight"]
        }
      ];

      navigator.health.isAuthorized(
        reqs,
        authorized => {
          console.log("Permissions already granted", authorized);
          if (!authorized) {
            navigator.health.requestAuthorization(
              reqs,
              () => {
                console.log("Permissions acquired");
              },
              err => {
                console.log(err);
              }
            );
          }
        },
        err => {
          console.log(err);
        }
      );
    },

    getData() {
      navigator.health.query(
        {
          startDate: new Date(new Date().getTime() - 30 * 24 * 60 * 60 * 1000), // 30 minutes earlier
          endDate: new Date(), // now
          dataType: "height",
          limit: 1000
        },
        data => {
          console.log("User data : ", data);
          this.height =
            data[0].value.toFixed(2).toString() + " " + data[0].unit;
        },
        err => {
          console.log(err);
        }
      );

      navigator.health.queryAggregated(
        {
          startDate: new Date(new Date().getTime() - 3 * 24 * 60 * 60 * 1000), // 3 days earlier
          endDate: new Date(), // now
          dataType: "steps",
          bucket: "day"
        },
        data => {
          console.log("Aggregated data", data);
          this.steps = 0;
          for (var i = 0; i < data.length; ++i) {
            this.steps += data[i].value;
          }
        },
        err => {
          console.log(err);
        }
      );

      navigator.health.queryAggregated(
        {
          startDate: new Date(new Date().getTime() - 24 * 60 * 60 * 1000), // 1 day earlier
          endDate: new Date(), // now
          dataType: "calories",
          bucket: "day"
        },
        data => {
          console.log("Aggregated calories data", data);
          this.calories =
            data[data.length - 1].value.toFixed(2).toString() +
            " " +
            data[data.length - 1].unit;
        },
        err => {
          console.log(err);
        }
      );

      navigator.health.queryAggregated(
        {
          startDate: new Date(new Date().getTime() - 24 * 60 * 60 * 1000), // 1 day earlier
          endDate: new Date(), // now
          dataType: "activity",
          bucket: "hour"
        },
        data => {
          console.log("Aggregated activity", data);
        },
        err => {
          console.log(err);
        }
      );
    },

    storeDatapoint() {
      navigator.health.store(
        {
          startDate: new Date(new Date() - 3 * 60 * 1000),
          endDate: new Date(),
          dataType: "steps",
          value: 180,
          sourceName: "MillenialsHealth", // Not available in iOS; Not required
          sourceBundleId: "com.vue.health.MillenialsHealth" // Same
        },
        () => {
          console.log("Data point succesfully stored.");
        },
        err => {
          console.log(err);
        }
      );
    },

    setNotification() {
      var sound = device.platform == 'Android' ? 'file://sounds/bell-ringing.mp3' : 'file://sounds/bell-ringing.mp3';
      console.log(sound);
      cordova.plugins.notification.local.schedule([
        {
          id: 0,
          title: "Work notification",
          text: "You have a new work notification",
          foreground: true,
          led: { color: '#FF00FF', on: 500, off: 500 },
          group: 'notifications',
          trigger: { at: new Date(new Date().getTime() + 10*1000 ) },
        },
        {
          id: 1,
          title: "Social notification",
          text: "You have a new social notification",
          foreground: true,
          led: { color: '#0000FF', on: 500, off: 500 },
          group: 'notifications',
          trigger: { at: new Date(new Date().getTime() + 5*1000 ) },
          sound: sound
        },
        {
          id: 2,
          title: "Family notification",
          text: "You have a new family notification",
          foreground: true,
          group: 'notifications',
          led: { color: '#FF3FFF', on: 500, off: 500 },
          trigger: { at: new Date(new Date().getTime() + 15*1000 ) }
        }
      ]);
    }
  },

  computed: {
    getSteps() {
      return this.steps;
    },
    getCalories() {
      return this.calories;
    }
  },

  mounted() {}
};
</script>

<style lang="scss">
#app {
  font-family: "Avenir", Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
}

#nav {
  padding: 30px;

  a {
    font-weight: bold;
    color: #2c3e50;

    &.router-link-exact-active {
      color: #42b983;
    }
  }
}
</style>
