"use strict";

addEventListener("load", function () {
  var audio = {
    _store: {},

    load: function (path) {
      var audio, xhr;

      audio = this;
      xhr = new XMLHttpRequest();
      xhr.open("GET", path);
      xhr.responseType = "arraybuffer";
      xhr.onload = function () {
        var str, tmp, c, l;

        str = "";
        tmp = new Uint8Array(this.response);
        for (c = 0, l = tmp.length; c < l; c++) {
          str += String.fromCharCode(tmp[c]);
        }
        audio._store[path] = new Audio("data:audio/ogg;base64," + btoa(str));
      };
      xhr.send();
    },

    play: function (path) {
      if (path in this._store) {
        this._store[path].load();
        this._store[path].play();
      }
    }
  };

  audio.load("voice_complete.ogg");
  audio.load("voice_error.ogg");

  var socket = io.connect("http://localhost");

  var update_favicon = function () {
    var icon, link;

    if (document.querySelector(".project.in_progress")) {
      icon = "data:image/gif;base64,R0lGODlhEAAQAPAAAICAgAAAACH5BAAAAAAALAAAAAAQABAAAAIOhI+py+0Po5y02ouzPgUAOw==";
    }
    else if (document.querySelector(".project.error")) {
      icon = "data:image/gif;base64,R0lGODlhEAAQAPAAAP8AAAAAACH5BAAAAAAALAAAAAAQABAAAAIOhI+py+0Po5y02ouzPgUAOw==";
    }
    else {
      icon = "data:image/gif;base64,R0lGODlhEAAQAPAAAACAAAAAACH5BAAAAAAALAAAAAAQABAAAAIOhI+py+0Po5y02ouzPgUAOw==";
    }

    if (link = document.querySelector("#favicon")) {
      link.parentNode.removeChild(link);
    }

    link = document.createElement("link");
    link.id = "favicon";
    link.rel = "icon";
    link.type = "image/gif";
    link.href = icon;
    document.head.appendChild(link);
  };

  var update_project = function (message, mute) {
    if (typeof mute === "undefined") {
      mute = false;
    }

    var project = document.querySelector(".project[data-project_id=\"" + message.id + "\"]");
    if (!project) {
      project = document.querySelector("#template > .project").cloneNode(true);
      project.setAttribute("data-project_id", message.id);
      project.querySelector(".name").textContent = message.name;
      document.querySelector("#projects").appendChild(project);
    }
    project.className = "project " + message.status;
    project.querySelector(".log").textContent = message.log || "";
    project.parentNode.insertBefore(project, project.parentNode.firstChild);
    update_favicon();
    if (!mute) {
      if (message.status === "normal") {
        audio.play("voice_complete.ogg");
      }
      else if (message.status === "error") {
        audio.play("voice_error.ogg");
      }
    }
  };

  socket.on("all_projects", function (message) {
    message.forEach(function (project) {
      update_project(project, true);
    });
  });

  socket.on("project_updated", update_project);
});
