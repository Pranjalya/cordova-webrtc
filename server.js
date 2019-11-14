const express = require("express");
const path  = require("path");
const http = require('http');
const app = express();
const port = 4592;
const PouchDB = require("pouchdb");

const server = app.listen(`${port}`, function () {
    console.log(`Server started on port ${port}`);
});

const io = require("socket.io")(server);

//const server = http.createServer(app);

//const io = socketio(server);
/*
app.use(express.static(path.join(__dirname, 'www')));
server.listen(+port, '0.0.0.0', (err) => {
    if (err) {
      console.log(err.stack);
      return;
    }
  
    console.log(`Node listens on http://127.0.0.1:${port}.`);
  });
*/

var list = []

io.sockets.on('connection', socket => {
    var remoteDB = new PouchDB("https://4f241480-c3c9-41c6-bb2e-98fd4cfe269e-bluemix:2d0f75eae437887122aec87b1225ad19a294f459beeb0a20fd69fb333cee4d4a@4f241480-c3c9-41c6-bb2e-98fd4cfe269e-bluemix.cloudantnosqldb.appdomain.cloud/rtcusers");
    socket.on('registerUser', username => {
        if (username != '' && username != null) {
            console.log(username, socket.id);
            list.push({ username: username, id: socket.id });
            remoteDB.get(username).then(doc => {
                remoteDB.put({
                    _id: username,
                    status: "online",
                    socketid: socket.id,
                    _rev: doc._rev
                }).then(() => console.log("Succesfully inserted")).catch(err => console.log("Cannot update status", err));
            }).catch(err => console.log("cannot get", err))
        }
    });

    socket.on('disconnect', () => {
        console.log('Got disconnect!', socket.id);
        let d = list.find((s) => { return s.id == socket.id })
        if (d != undefined) {
            remoteDB.get(d.username).then((doc) => {
                doc.status = "offline"
                doc.socketid = ""
                remoteDB.put({
                    _id: d.username,
                    status: "offline",
                    socketid: "",
                    _rev: doc._rev
                }).then(() => {
                    list.splice(list.indexOf(d), 1);
                    console.log(list)
                }).catch(err => console.log("change status put err", err));
            }).catch(err => console.log(err));
        }
    });
});