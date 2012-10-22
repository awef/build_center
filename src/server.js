"use strict";

var Project, fs, io, server, config, projects, watchLoop;

Project = function (name, basePath, watchPath, buildCommand) {
  var crypto, hash;

  this.name = name;
  this.basePath = basePath;
  this.watchPath = watchPath;
  this.buildCommand = buildCommand;

  crypto = require("crypto");
  hash = crypto.createHash("md5");
  hash.update(this.name);

  this.id = hash.digest("hex");
  this.status = "normal";
  this.log = "";
};

Project.prototype = {
  watch: function (callback) {
    var project, childProcess, command;

    project = this;

    childProcess = require("child_process");
    command = [
      "cd " + project.basePath,
      "inotifywait -q -r -e create,delete,move,close_write " + project.watchPath
    ].join(";");

    childProcess.exec(command, function (error, stdout, stderr) {
      if (error) {
        project.status = "error"
      }
      project.log = stderr + (stderr && stdout ? "\n" : "") + stdout;
      callback.call(project);
    });
  },
  build: function (callback) {
    var project, childProcess, command;

    project = this;

    console.log("\u001b[1;33mbuild start:\u001b[0m " + project.name);

    childProcess = require("child_process");
    command = "cd " + this.basePath + "; " + this.buildCommand;
    this.status = "in_progress";

    io.sockets.emit("project_updated", this);

    childProcess.exec(command, function (error, stdout, stderr) {
      project.status = error ? "error" : "normal";
      project.log = stderr + (stderr && stdout ? "\n" : "") + stdout;

      console.log(project.log.replace(/\n$/, ""));
      if (project.status === "normal") {
        console.log("\u001b[1;32mbuild completed:\u001b[0m " + project.name);
      }
      else {
        console.log("\u001b[1;31mbuild failed:\u001b[0m " + project.name);
      }

      io.sockets.emit("project_updated", project);

      if (callback) {
        callback.call(project);
      }
    });
  }
};

fs = require("fs");

server = require("http").createServer(function (req, res) {
  var files, localPath;

  files = [
    "/",
    "/client.css",
    "/client.js",
    "/voice_complete.ogg",
    "/voice_error.ogg"
  ]

  if (files.indexOf(req.url) !== -1) {
    localPath = req.url === "/" ? "/client.html" : req.url;

    fs.readFile(__dirname + localPath, function (err, data) {
      if (/\.html?$/.test(localPath)) {
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

server.listen(8000);

io = require("socket.io").listen(server);

io.set("log level", 1);

config = JSON.parse(fs.readFileSync(process.env.HOME + "/.build_center"));

projects = [];

watchLoop = function () {
  this.build(function () {
    this.watch(watchLoop);
  });
};

config.projects.forEach(function (p) {
  var project;

  project = new Project(p.name, p.base_path, p.watch_path, p.build_command);
  projects.push(project);
  watchLoop.bind(project)();
});

io.sockets.on("connection", function (socket) {
  socket.emit("all_projects", projects);

  socket.on("request_execute", function (detail) {
    projects.forEach(function (project) {
      if (project.id === detail.id && project.status !== "in_progress") {
        project.build();
      }
    });
  });
});
