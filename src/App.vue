<template>
  <div id="app">
    <video id="yourVideo" autoplay muted playsinline></video>
    <video id="friendsVideo" autoplay playsinline></video>
    <br />
    <button v-on:click="showFriendsFace" type="button" class="btn btn-primary btn-lg">
      <span class="glyphicon glyphicon-facetime-video" aria-hidden="true"></span>Call
    </button>
    <button v-on:click="showMyFace">Display</button>
  </div>
</template>

<script>
var PouchDB = require("pouchdb").default;

document.addEventListener('deviceready', function() {
  console.log('cordova.plugins.CordovaCall is now available');
  var cordovaCall = cordova.plugins.CordovaCall; //not necessary, but might be more convenient
});

export default {
  data() {
    return {
    localDB: {},
    remoteDB: {},
    pc: {},
    database: {},
    yourVideo: {},
    friendsVideo: {},
    yourId: 0,
    servers: {}
    };
  },

  mounted() {
    this.localDB = new PouchDB("localDB");
    this.remoteDB = new PouchDB(
      "https://4f241480-c3c9-41c6-bb2e-98fd4cfe269e-bluemix:2d0f75eae437887122aec87b1225ad19a294f459beeb0a20fd69fb333cee4d4a@4f241480-c3c9-41c6-bb2e-98fd4cfe269e-bluemix.cloudantnosqldb.appdomain.cloud/webrtc"
    );
    // this.database = firebase.database().ref()
    this.startRep();
    this.yourVideo = document.getElementById("yourVideo");
    this.friendsVideo = document.getElementById("friendsVideo");
    this.yourId = Math.floor(Math.random() * 1000000000);
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
        },
      ]
    };

    this.pc = new RTCPeerConnection(this.servers);
    this.pc.onicecandidate = event =>
      event.candidate
        ? this.sendMessage(this.yourId, JSON.stringify({ ice: event.candidate }))
        : console.log("Sent All Ice");
    this.pc.onaddstream = event => (friendsVideo.srcObject = event.stream);
    //  this.database.on('child_added', this.readMessage);
    this.changesMonitor();
  },

  methods: {
    showMyFace() {
      navigator.mediaDevices
        .getUserMedia({ audio: true, video: true })
        .then(stream => (this.yourVideo.srcObject = stream))
        .then(stream => this.pc.addStream(stream)).catch(console.log);
    },

    showFriendsFace() {
      this.pc.createOffer()
        .then(offer => this.pc.setLocalDescription(offer))
        .then(() =>
          this.sendMessage(this.yourId, JSON.stringify({ sdp: this.pc.localDescription }))
        );
    },

    sendMessage(senderId, data) {
      console.log("Sending message", this.yourId.toString());
      this.localDB.get(this.yourId.toString())
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
                _id: this.yourId.toString(),
                sender: senderId,
                message: data
              }).then(()=>{ console.log("inserted")}).catch(err => {});
          }
        });
      //  var msg = this.database.push({ sender: senderId, message: data });
      //  msg.remove();
    },

    readMessage(data) {
      console.log("Reading message with data", data);
      var msg = JSON.parse(data.doc.message);
      var sender = data.doc.sender;
      console.log("Sender: ", sender, "My ID: ", this.yourId);
      if (sender != this.yourId) {
        if (msg.ice != undefined) {
          this.pc.addIceCandidate(new RTCIceCandidate(msg.ice));
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
            }); }
        else if (msg.sdp.type == "answer"){
          this.pc.setRemoteDescription(new RTCSessionDescription(msg.sdp));
          console.log("Answer received");
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

    changesMonitor() {
      console.log("Change Monitor started");
      this.remoteDB
        .changes({
          since: "now",
          live: true,
          include_docs: true
        })
        .on("change", change => {
        //  console.log("Change - ", change);
        if(change.id != this.yourId)
          this.readMessage(change);
        });
    }
  }
};
</script>

<style lang="scss" scoped>
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
  margin: 5px 0px 0px 10px !important;
  width: 654px;
}
</style>
