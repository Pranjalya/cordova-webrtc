<template>
  <div id="app">
    <div class="notdisplaycall">
      <video id="yourVideo" autoplay muted playsinline></video>
      <video id="friendsVideo" autoplay playsinline></video>
      <br />
      <button v-on:click="disconnectCall" v-if="callActive">Disconnect</button>
      <br />
      <br />
      <div v-if="!callActive">
        <h2>Contact List</h2>
        <br />
        <div v-for="user in returnUsers" v-bind:key="user.index">
          <div v-if="user.doc.status == 'online' && user.doc._id != yourId">
            <span class="user" style>{{ user.doc._id }}</span>
            <button class="call" v-on:click="callUser(user.doc._id)">Call</button>
          </div>
          <br />
        </div>
      </div>
      <!--
      <div class="displaycall" v-if="displayCaller && !callActive">
        <div class="callername">{{ receiversId }}</div>
        <div class="calling">Calling</div>
        <div class="receiving" v-if="!calling">
          <button v-on:click="callActive=true">Accept</button>
          <button v-on:click="disconnectCall">Reject</button>
        </div>
      </div>
      -->
    </div>
  </div>
</template>

<script>
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
    this.pc = new RTCPeerConnection(this.servers);
    this.pc.onicecandidate = event =>
      event.candidate
        ? this.sendMessage(
            this.yourId,
            JSON.stringify({ ice: event.candidate })
          )
        : console.log("Sent All Ice");
    this.pc.onaddstream = event => (friendsVideo.srcObject = event.stream);
    if (this.pc.connectionState == "disconnected") document.location.reload();
    this.changesMonitor();
    //  this.contactChangesMonitor();
  },

  created() {
    this.yourId = prompt("Enter your phone number.");
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
          _rev: doc._rev
        });
      })
      .catch(err => {
        if (err.status == 404) {
          this.contacts
            .put({
              _id: this.yourId,
              status: "online"
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
      return this.receiversId;
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
            JSON.stringify({ sdp: this.pc.localDescription })
          )
        );
    },

    /*  sendMessage(senderId, data) {
      console.log("Sending message", this.yourId);
      this.localDB.get(this.yourId)
        .then(doc => {
          delete doc._rev;
          doc.sender = senderId;
          doc.message = data;
          this.localDB.put(doc).then(()=>{ console.log("inserted after getting")}).catch(err => {});
        })
        .catch(err => {
          if (err.status == 404) {
            this.localDB
              .put({
                _id: this.yourId,
                sender: senderId,
                message: data
              }).then(()=>{ console.log("inserted")}).catch(err => {});
          }
        });
      //  var msg = this.database.push({ sender: senderId, message: data });
      //  msg.remove();
    },
  */

    sendMessage(senderId, data) {
      console.log("Sending message", this.yourId);
      this.localDB
        .post({
          sender: senderId,
          message: data
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
      console.log("Sender: ", sender, "My ID: ", this.yourId);
      if (sender != this.yourId) {
        if (msg.ice != undefined) {
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
        if (msg.closeConnection) {
          this.friendsVideo.srcObject = {};
          this.callActive = false;
          document.location.reload();
        }
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
      console.log("Calling user");
      this.receiversId = callee;
      console.log("R = ", this.receiversId);
      this.showFriendsFace();
    },

    disconnectCall() {
      this.sendMessage(this.yourId, JSON.stringify({ closeConnection: true }));
      navigator.mediaDevices.getUserMedia(
        { audio: true, video: true },
        stream => {
          this.pc.removeStream(stream);
          this.pc.close();
        }
      );
      this.friendsVideo.srcObject = {};
      this.callActive = false;
      document.location.reload();
    },

    readChangeMessage(change) {
      console.log(
        "R = ",
        this.receiversId,
        "sender = ",
        change.doc.sender,
        "Computed R = ",
        this.returnReceiver
      );
      if (change.doc.sender == this.receiversId) this.readMessage(change);
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
          console.log(
            "Change - ",
            change.doc.sender,
            "R = ",
            this.returnReceiver
          );
          this.readChangeMessage(change);
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
          for (var i = 0; i < this.activeUsers.length; ++i) {
            if (change.doc.sender == this.activeUsers[i].doc.sender) {
              if (this.activeUsers[i].doc.status == "online")
                this.activeUsers[i].doc.status = "offline";
              else this.activeUsers[i].doc.status = "online";
              newUser = false;
            }
          }
          if (newUser) this.activeUsers.push(change);
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

video {
  background-color: #ddd;
  border-radius: 7px;
  margin: 10px 0px 0px 10px;
  width: 320px;
  height: 240px;
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
</style>
