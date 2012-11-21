"use strict";

var events, Command, BuildCommand;

events = require("events");

Command = function (config) {
  var hash;

  events.EventEmitter.call(this);

  this.category = config.category;
  this.workingDirectory = config.workingDirectory;
  this.command = config.command;
  this.status = "normal"; //normal / running / error
  this.log = "";

  hash = require("crypto").createHash("md5");
  hash.update(this.workingDirectory + ":" + this.command);
  this.id = hash.digest("hex");
};
Command.prototype = Object.create(events.EventEmitter.prototype);
Command.prototype.run = function (callback) {
  var command, cp, onData;

  command = this;

  command.status = "running";
  command.log = "";
  command.emit("update", command);

  cp = require("child_process").exec(
    this.command,
    {cwd: this.workingDirectory},
    function (error, stdout, stderr) {
      command.status = error ? "error" : "normal";
      command.emit("update", command);

      if (callback) {
        callback.call(command);
      }
    }
  );

  onData = function (data) {
    this.log += data.toString();
    this.emit("update", this);
  };
  cp.stdout.on("data", onData.bind(this));
  cp.stderr.on("data", onData.bind(this));
};

BuildCommand = function (config) {
  Command.call(this, config);

  this.watchPath = config.watchPath;
  this.watch();
};
BuildCommand.prototype = new Command({});
BuildCommand.prototype.watch = function () {
  var command;

  command = this;

  require("child_process").exec(
    "inotifywait -q -r -e create,delete,move,close_write " + command.watchPath,
    {cwd: this.workingDirectory},
    function (error, stdout, stderr) {
      if (error) {
        command.status = "error"
      }
      command.log = stderr + (stderr && stdout ? "\n" : "") + stdout;
      command.run(command.watch);
      command.emit("update", command);
    }
  );
};

(function () {
  var fs, config, commands, server, fileList, io;

  fs = require("fs");

  commands = {};

  config = JSON.parse(fs.readFileSync(process.env.HOME + "/.build_center"));

  config.commands.forEach(function (config) {
    var hash, command;

    config.workingDirectory = config.workingDirectory.replace(/^~/, process.env.HOME);

    hash = require("crypto").createHash("md5");
    hash.update(config.workingDirectory + ":" + config.command);
    config.id = hash.digest("hex");

    if (config.type === "normal") {
      command = new Command(config);
    }
    else if (config.type === "build") {
      command = new BuildCommand(config);
    }

    command.on("update", function () {
      io.sockets.emit("update", this);
    });

    commands[config.id] = command;
  });

  fileList = [
    "/client.html",
    "/client.css",
    "/client.js",
    "/voice_complete.ogg",
    "/voice_error.ogg"
  ];

  server = require("http").createServer(function (req, res) {
    var localPath;

    localPath = req.url === "/" ? "/client.html" : req.url;

    if (fileList.indexOf(localPath) !== -1) {
      fs.readFile(__dirname + localPath, function (err, data) {
        switch (/\.([a-z]*)$/.exec(localPath)[1]) {
          case "html":
            res.setHeader("X-Frame-Options", "Deny");
            res.setHeader("Content-Type", "text/html");
            break;
          case "js":
            res.setHeader("Content-Type", "application/javascript");
            break;
          case "css":
            res.setHeader("Content-Type", "text/css");
            break;
          case "ogg":
            res.setHeader("Content-Type", "audio/ogg");
            break;
        }

        res.writeHead(200);
        res.end(data);
      });
    }
    else {
      res.writeHead(403);
      res.end();
    }
  });

  server.listen(8000);

  io = require("socket.io").listen(server);
  io.set("log level", 1);

  io.sockets.on("connection", function (socket) {
    socket.emit("all_commands", commands);

    socket.on("request_run", function (req) {
      if (commands[req.id] && commands[req.id].status !== "running") {
        commands[req.id].run();
      }
    });
  });
})();
