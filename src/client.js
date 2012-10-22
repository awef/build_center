addEventListener("load", function () {
  "use strict";

  var audio, favicon, socket, updateProject

  audio = {
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

  favicon = {
    _store: {
      progress: "data:image/gif;base64,R0lGODlhEAAQAPAAAICAgAAAACH5BAAAAAAALAAAAAAQABAAAAIOhI+py+0Po5y02ouzPgUAOw==",
      error: "data:image/gif;base64,R0lGODlhEAAQAPAAAP8AAAAAACH5BAAAAAAALAAAAAAQABAAAAIOhI+py+0Po5y02ouzPgUAOw==",
      normal: "data:image/gif;base64,R0lGODlhEAAQAPAAAACAAAAAACH5BAAAAAAALAAAAAAQABAAAAIOhI+py+0Po5y02ouzPgUAOw=="
    },

    init: function () {
      this.link = document.createElement("link");
      this.link.rel = "icon";
      this.link.type = "image/gif";
      document.head.appendChild(this.link);
    },

    change: function (iconId) {
      this.link.href = this._store[iconId];
    },

    update: function () {
      if (document.querySelector(".project.in_progress")) {
        this.change("progress");
      }
      else if (document.querySelector(".project.error")) {
        this.change("error");
      }
      else {
        this.change("normal");
      }
    }
  };

  audio.load("voice_complete.ogg");
  audio.load("voice_error.ogg");

  favicon.init();
  favicon.update();

  socket = io.connect("http://localhost");

  updateProject = function (message, mute) {
    var project;

    project = document.querySelector(".project[data-project_id=\"" + message.id + "\"]");

    if (!project) {
      project = document.querySelector("#template > .project").cloneNode(true);
      project.setAttribute("data-project_id", message.id);
      project.querySelector(".name").textContent = message.name;
      document.querySelector("#projects").appendChild(project);
    }

    project.className = "project " + message.status;
    project.querySelector(".log").textContent = message.log || "";
    project.parentNode.insertBefore(project, project.parentNode.firstChild);

    favicon.update();

    if (mute !== true) {
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
      updateProject(project, true);
    });
  });

  socket.on("project_updated", updateProject);
});
