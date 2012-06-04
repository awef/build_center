"use strict";

var Project = function (name, basePath, watchPath, buildCommand) {
  this.name = name;
  this.basePath = basePath;
  this.watchPath = watchPath;
  this.buildCommand = buildCommand;

  var crypto = require("crypto");
  var hash = crypto.createHash("md5");
  hash.update(this.name);

  this.id = hash.digest("hex");
  this.status = "normal";
  this.log = "";
};

Project.prototype = {
  watch: function (callback) {
    var project = this;

    var child_process = require("child_process");
    var command = [
      "cd " + project.basePath,
      "inotifywait -q -r -e create,delete,move,close_write " + project.watchPath
    ].join(";");

    child_process.exec(command, function (error, stdout, stderr) {
      if (error) {
        project.status = "error"
      }
      project.log = stderr + (stderr && stdout ? "\n" : "") + stdout;
      callback.call(project);
    });
  },
  build: function (callback) {
    var project = this;

    var child_process = require("child_process");
    var command = "cd #{@base_path}; #{@build_command}";
    var command = "cd " + this.basePath + "; " + this.buildCommand;
    this.status = "in_progress";

    child_process.exec(command, function (error, stdout, stderr) {
      project.status = error ? "error" : "normal";
      project.log = stderr + (stderr && stdout ? "\n" : "") + stdout;
      callback.call(project);
    });
  }
};

var fs = require("fs");

var app = require("http").createServer(function (req, res) {
  var files = [
    "/",
    "/client.css",
    "/client.js",
    "/voice_complete.ogg",
    "/voice_error.ogg"
  ]

  if (files.indexOf(req.url) !== -1) {
    var local_path = req.url === "/" ? "/client.html" : req.url;

    fs.readFile(__dirname + local_path, function (err, data) {
      if (/\.html?$/.test(local_path)) {
        res.setHeader("X-Frame-Options", "Deny");
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

app.listen(8000);

var io = require("socket.io").listen(app);

io.set("log level", 1);

var config = JSON.parse(fs.readFileSync(process.env.HOME + "/.build_center"));

var projects = [];

var watchLoop = function () {
  this.build(function () {
    io.sockets.emit("project_updated", this);
    this.watch(watchLoop);
  });
  io.sockets.emit("project_updated", this);
};

config.projects.forEach(function (p) {
  var project = new Project(p.name, p.base_path, p.watch_path, p.build_command);
  projects.push(project);
  watchLoop.bind(project)();
});

io.sockets.on("connection", function (socket) {
  socket.emit("all_projects", projects);
});
