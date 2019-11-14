<template>
  <div id="app">
    <div id="nav">Created by <b>Pranjalya Tiwari</b></div>
    <h1>Kaissa WebChat</h1>
    <video id="yourVideo" autoplay muted playsinline></video>
    <video id="friendsVideo" autoplay playsinline></video>
    <br />
    <button v-on:click="disconnectCall" v-if="callActive">Disconnect</button>
    <br />
    <br />
    <p style="color: rgb(89, 178, 17)"><b>Your ID : <span style="color: rgb(10,10,10)">{{ yourId }}</span></b></p>
    <p v-if="callActive"><b>You are connected to <span style="color: rgb(141, 16, 224)"><i>{{ returnReceiver }}</i></span></b></p>
    <div v-if="!callActive">
      <h2>Contact List</h2>
      <br />
      <div v-for="(user, index) in returnUsers" v-bind:key="index">
        <div v-if="user.doc._id != yourId && user.doc.status == 'online'">
          <span class="user" style>{{ user.doc._id }}</span>
          <button class="call" v-on:click="callUser(user.doc._id)">Call</button>
          <span v-if="user.doc.status == 'online'" class="dot"></span>
        </div>
        <br />
      </div>
      <div class="about">
        <h3>How to Use</h3>
        <p>Login with your unique ids that you enter at the time of loading, so oters can identify you.</p>
        <p>Due to unavailabilty of Sockets in this particular server, try to enter same name, so as to avoid confusion.</p>
        <p>Locate your friend's id, and place a call.</p>
      </div>
      <br />
      <div class="about">
        <h3>About</h3>
        <p>You like it? It's available here! <a href="https://www.github.com/Pranjalya/cordova-webrtc">Github</a></p>
        <p>It's unique because no relay mechanism has been used, as it is based on completely serverless architecture and caters a P2P connection.</p>
	      <p>Want to know something more awesome? You both are connected to each other, directly! As you should be <span id='smilee'><b>;P</b></span></p>
        <p>If it's laggy, it's better the second time around. Try reloading it.</p>
        <p>Viewing online candidates service can be run locally, but can't be run on net as of now, due to Socket hosting requirements.</p>
        <p>Hope you enjoy it!</p>
      </div>
    </div>
  </div>
</template>

<script>
import io from "socket.io-client";
var socket = io.connect("http://localhost:4592");
var PouchDB = require("pouchdb").default;

document.addEventListener("deviceready", function() {
  console.log("cordova.plugins.CordovaCall is now available");
  var cordovaCall = cordova.plugins.CordovaCall; //not necessary, but might be more convenient
});

export default {
  data() {
    return {
      localDB: {},
      remoteDB: {},
      contacts: {},
      pc: {},
      yourVideo: {},
      friendsVideo: {},
      yourId: "",
      servers: {},
      activeUsers: [],
      receiversId: "",
      callActive: false,
      displayCaller: false,
      calling: false
    };
  },

  mounted() {
    this.localDB = new PouchDB("localDB");
    this.remoteDB = new PouchDB(
      "https://4f241480-c3c9-41c6-bb2e-98fd4cfe269e-bluemix:2d0f75eae437887122aec87b1225ad19a294f459beeb0a20fd69fb333cee4d4a@4f241480-c3c9-41c6-bb2e-98fd4cfe269e-bluemix.cloudantnosqldb.appdomain.cloud/webrtc"
    );
    this.startRep();
    this.yourVideo = document.getElementById("yourVideo");
    this.friendsVideo = document.getElementById("friendsVideo");
    console.log("My ID : ", this.yourId);
    //Create an account on Viagenie (http://numb.viagenie.ca/), and replace {'urls': 'turn:numb.viagenie.ca','credential': 'websitebeaver','username': 'websitebeaver@email.com'} with the information from your account
    this.servers = {
      iceServers: [
        { urls: "stun:stun.services.mozilla.com" },
        { urls: "stun:stun.l.google.com:19302" },
        {
          urls: "turn:numb.viagenie.ca",
          credential: "kingkiller",
          username: "pranjalyawarrior@gmail.com"
        }
      ]
    };
    this.receiversId = this.returnReceiver;
    this.pc = new RTCPeerConnection(this.servers);
    this.pc.onicecandidate = event =>
      event.candidate
        ? this.sendMessage(
            this.yourId,
            this.returnReceiver,
            JSON.stringify({ ice: event.candidate })
          )
        : (this.callActive = true);
    this.pc.onaddstream = event => (friendsVideo.srcObject = event.stream);
    //  if (this.pc.connectionState == "disconnected") document.location.reload();
    this.changesMonitor();
    socket.emit("registerUser", this.yourId);
  },

  created() {
    while (this.yourId == '') {
      this.yourId = prompt("Please enter your ID");
    }
    // Database which stores all the global contacts and their activity status
    this.contacts = new PouchDB(
      "https://4f241480-c3c9-41c6-bb2e-98fd4cfe269e-bluemix:2d0f75eae437887122aec87b1225ad19a294f459beeb0a20fd69fb333cee4d4a@4f241480-c3c9-41c6-bb2e-98fd4cfe269e-bluemix.cloudantnosqldb.appdomain.cloud/rtcusers"
    );
    this.showMyFace();
    // Adding user to the contacts
    this.contacts
      .get(this.yourId)
      .then(doc => {
        this.conatcts.put({
          _id: this.yourId,
          status: "online",
          socketid: "",
          _rev: doc._rev
        });
      })
      .catch(err => {
        if (err.status == 404) {
          this.contacts
            .put({
              _id: this.yourId,
              status: "online",
              socketid: ""
            })
            .then(() => {
              console.log("User added.");
            })
            .catch(err => {
              console.log("User not added", err);
            });
        }
      });
    // Fetch all the users
    this.contacts
      .allDocs({
        include_docs: true,
        attachments: true
      })
      .then(result => {
        this.activeUsers = result.rows;
      })
      .catch(err => {
        console.log(err);
      });
  },

  computed: {
    returnUsers() {
      return this.activeUsers;
    },

    returnReceiver() {
      return this.$store.getters.receiver;
    }
  },

  methods: {
    showMyFace() {
      navigator.mediaDevices
        .getUserMedia({ audio: true, video: true })
        .then(stream => (this.yourVideo.srcObject = stream))
        .then(stream => this.pc.addStream(stream))
        .catch(console.log);
    },

    showFriendsFace() {
      this.pc
        .createOffer()
        .then(offer => this.pc.setLocalDescription(offer))
        .then(() =>
          this.sendMessage(
            this.yourId,
            this.returnReceiver,
            JSON.stringify({ sdp: this.pc.localDescription })
          )
        );
    },

    sendMessage(senderId, receiver, data) {
      console.log("Sending message", this.yourId);
      this.localDB
        .post({
          sender: senderId,
          receiver: receiver,
          message: data,
        })
        .then(response => {
          console.log(response);
        })
        .catch(err => console.log(err));
    },

    readMessage(data) {
      console.log("Reading message with data", data);
      var msg = JSON.parse(data.doc.message);
      var sender = data.doc.sender;
      var receiver = data.doc.receiver;
      console.log(
        "Sender: ",
        sender,
        "My ID: ",
        this.yourId,
        "Receiver = ",
        receiver
      );
      if (sender != this.yourId) {
        if (msg.closeConnection) {
          navigator.mediaDevices.getUserMedia(
            { audio: true, video: true },
            stream => {
              this.pc.removeStream(stream);
            }
          );
          this.friendsVideo.srcObject = null;
          this.callActive = false;
          if (!this.callActive) document.location.reload();
        } else if (msg.ice != undefined) {
          this.pc
            .addIceCandidate(new RTCIceCandidate(msg.ice))
            .catch(err => console.log(err));
          console.log("ICE candidate added");
        } else if (msg.sdp.type == "offer") {
          console.log("Offer recieved");
          this.pc
            .setRemoteDescription(new RTCSessionDescription(msg.sdp))
            .then(() => this.pc.createAnswer())
            .then(answer => this.pc.setLocalDescription(answer))
            .then(() =>
              this.sendMessage(
                this.yourId,
                this.returnReceiver,
                JSON.stringify({ sdp: this.pc.localDescription })
              )
            )
            .catch(err => {
              console.log(err);
            });
        } else if (msg.sdp.type == "answer") {
          this.pc.setRemoteDescription(new RTCSessionDescription(msg.sdp));
          console.log("Answer received");
          this.calling = true;
          this.callActive = true;
        }
        this.displayCaller = true;
      }
    },

    startRep() {
      console.log("Replication started");
      PouchDB.replicate("localDB", this.remoteDB, {
        live: true,
        retry: true
      })
        .on("change", function(info) {
          //  console.log("Changes: made", info);
        })
        .on("paused", function(err) {
          console.log("Replication: paused", err);
        })
        .on("active", function() {
          console.log("Replication: active");
        })
        .on("denied", function(err) {
          console.log("Replication: denied", err);
        })
        .on("complete", function(info) {
          console.log("Replication: complete", info);
        })
        .on("error", function(err) {
          console.log("Replication: change", err);
        });
    },

    callUser(callee) {
      console.log("Calling user with ", callee);
      this.$store.dispatch("updateReceiver", callee);
      console.log("R = ", this.returnReceiver);
      this.showFriendsFace();
    },

    disconnectCall() {
      this.sendMessage(
        this.yourId,
        this.returnReceiver,
        JSON.stringify({ closeConnection: true })
      );
      setTimeout(() => document.location.reload(), 1500);
      navigator.mediaDevices.getUserMedia(
        { audio: true, video: true },
        stream => {
          this.pc.removeStream(stream);
        }
      );
      this.friendsVideo.srcObject = null;
      this.callActive = false;
      this.$store.dispatch("updateReceiver", "");
    },

    changesMonitor() {
      console.log("Change Monitor started");
      this.remoteDB
        .changes({
          since: "now",
          live: true,
          include_docs: true
        })
        .on("change", change => {
          console.log(change.doc, this.returnReceiver);
          if (change.doc.sender == this.returnReceiver)
            this.readMessage(change);
          else if (change.doc.receiver == this.yourId) {
            if (change.doc.sender != this.yourId) this.readMessage(change);
          }
        })
        .on("error", error => {
          console.log("Change error", err);
        });

      var newUser = true;
      this.contacts
        .changes({
          since: "now",
          live: true,
          include_docs: true
        })
        .on("change", change => {
          this.contacts
            .allDocs({
              include_docs: true,
              attachments: true
            })
            .then(result => {
              this.activeUsers = result.rows;
            })
            .catch(err => {
              console.log(err);
            });
        });
    }
  }
};
</script>

<style lang="scss" scoped>
.displaycall {
  font-family: "Helvetica";
  text-align: center;
  height: 100%;
  color: blanchedalmond;
  width: 100%;
  margin: 10px auto;
  background-color: darkslategrey;
  z-index: 10;
}

#smilee {
  color: rgb(202, 81, 81);
  font: 12px;
}

h3 {
  color: rgb(33, 119, 93);
}

.notdisplaycall {
  z-index: 8;
}

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

.about {
  color: rgb(8, 84, 128);
  font-size: 17px;
}

video {
  background-color: #ddd;
  border-radius: 7px;
  margin: 10px 0px 0px 10px;
  width: 380px;
  height: 280px;
}

button {
  text-decoration: none;
  color: white;
  padding: 10px 30px;
  display: inline-block;
  position: relative;
  border: 1px solid rgba(0, 0, 0, 0.21);
  border-bottom: 4px solid rgba(0, 0, 0, 0.21);
  border-radius: 4px;
  margin-left: 10px;
  text-shadow: 0 1px 0 rgba(0, 0, 0, 0.15);
  background: rgba(27, 188, 194, 1);
  background: -webkit-gradient(
    linear,
    0 0,
    0 100%,
    from(rgba(27, 188, 194, 1)),
    to(rgba(24, 163, 168, 1))
  );
  background: -webkit-linear-gradient(
    rgba(27, 188, 194, 1) 0%,
    rgba(24, 163, 168, 1) 100%
  );
  background: -moz-linear-gradient(
    rgba(27, 188, 194, 1) 0%,
    rgba(24, 163, 168, 1) 100%
  );
  background: -o-linear-gradient(
    rgba(27, 188, 194, 1) 0%,
    rgba(24, 163, 168, 1) 100%
  );
  background: linear-gradient(
    rgba(27, 188, 194, 1) 0%,
    rgba(24, 163, 168, 1) 100%
  );
  filter: progid:DXImageTransform.Microsoft.gradient(startColorstr='#1bbcc2', endColorstr='#18a3a8', GradientType=0);
}

.button span {
  cursor: pointer;
  display: inline-block;
  position: relative;
  transition: 0.5s;
}

.button span:after {
  content: "\00bb";
  position: absolute;
  opacity: 0;
  top: 0;
  right: -20px;
  transition: 0.5s;
}

.button:hover span {
  padding-right: 25px;
}

.button:hover span:after {
  opacity: 1;
  right: 0;
}

.dot {
  height: 10px;
  width: 10px;
  background-color: rgb(17, 209, 17);
  border-radius: 50%;
  margin: 5px;
  display: inline-block;
}
</style>
