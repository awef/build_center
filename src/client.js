addEventListener("load", function () {
  "use strict";

  var Sound, favicon, updateCommand, socket, voice;

  HTMLElement.prototype._is = function (selector) {
    if (this.webkitMatchesSelector) {
      return this.webkitMatchesSelector(selector);
    }
    else if (this.mozMatchesSelector) {
      return this.mozMatchesSelector(selector);
    }
  };

  HTMLElement.prototype._closest = function (selector) {
    var tmp;

    tmp = this;
    while (tmp && !tmp._is(selector)) {
      tmp = tmp.parentElement;
    }

    return tmp || null;
  };

  Sound = function (path) {
    var xhr;

    this.audio = null;

    xhr = new XMLHttpRequest();
    xhr.open("GET", path);
    xhr.responseType = "blob";
    xhr.onload = function () {
      // TODO URL.revokeObjectURL
      this.audio = new Audio(URL.createObjectURL(xhr.response));
    }.bind(this);
    xhr.send();
  };
  Sound.prototype.play = function () {
    if (this.audio) {
      this.audio.currentTime = 0;
      if (this.audio.paused) {
        this.audio.play();
      }
    }
  };

  voice = {};
  voice.complete = new Sound("voice_complete.ogg");
  voice.error = new Sound("voice_error.ogg");

  favicon = {
    _store: {
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
      if (document.querySelector(".command.error")) {
        this.change("error");
      }
      else {
        this.change("normal");
      }
    }
  };

  favicon.init();
  favicon.update();

  updateCommand = function (command, mute) {
    var dom;

    dom = document.querySelector(".command[data-commandid=\"" + command.id + "\"]");
    dom.querySelector(".log").textContent = command.log;

    dom.classList.remove("normal");
    dom.classList.remove("running");
    dom.classList.remove("error");
    dom.classList.add(command.status);

    favicon.update();

    if (mute !== true) {
      if (command.status === "normal") {
        voice.complete.play();
      }
      else if (command.status === "error") {
        voice.error.play();
      }
    }
  };

  socket = io.connect("http://localhost");

  socket.on("all_commands", function (commands) {
    var category, categoryName, commandId, command;

    category = {};

    for (commandId in commands) {
      command = commands[commandId];
      if (!category[command.category]) {
        category[command.category] = [];
      }
      category[command.category].push(command);
    }

    var tmp;
    for (categoryName in category) {
      tmp = document.querySelector("#template > .category").cloneNode(true);
      tmp.querySelector(".name").textContent = categoryName;
      document.body.appendChild(tmp);

      category[categoryName].forEach(function (command) {
        var dom;

        dom = document.querySelector("#template > .command").cloneNode(true);
        dom.setAttribute("data-commandid", command.id);
        dom.querySelector(".name").textContent = command.command;
        tmp.appendChild(dom);
        updateCommand(command, true);
      });
    }
  });

  socket.on("update", function (command) {
    updateCommand(command);
  });

  document.documentElement.addEventListener("click", function (e) {
    var command, tmp;

    if (command = e.target._closest(".command:not(.active)")) {
      tmp = document.querySelector(".active");
      tmp && tmp.classList.remove("active");
      command.classList.add("active");
    }
  });

  document.documentElement.addEventListener("dblclick", function (e) {
    var command, projectId;

    if (command = e.target._closest(".command:not(.running)")) {
      projectId = command.getAttribute("data-commandid");
      socket.emit("request_run", {id: projectId});
    }
  });
});
