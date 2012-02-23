window.addEventListener "load", ->
  get_audio = (path) ->
    xhr = new XMLHttpRequest()
    xhr.open "GET", path, false
    xhr.responseType = "arraybuffer"
    xhr.send()
    str = ""
    for a in new Uint8Array xhr.response
      str += String.fromCharCode a
    new Audio("data:audio/ogg;base64,#{btoa str}")

  voice_complete = get_audio "voice_complete.ogg"
  voice_error = get_audio "voice_error.ogg"

  voice_play = (audio) ->
    audio.load()
    audio.play()
    return

  socket = io.connect "http://localhost"

  update_favicon = ->
    if document.querySelector ".project.in_progress"
      icon = "data:image/gif;base64,R0lGODlhEAAQAPAAAICAgAAAACH5BAAAAAAALAAAAAAQABAAAAIOhI+py+0Po5y02ouzPgUAOw=="
    else if document.querySelector ".project.error"
      icon = "data:image/gif;base64,R0lGODlhEAAQAPAAAP8AAAAAACH5BAAAAAAALAAAAAAQABAAAAIOhI+py+0Po5y02ouzPgUAOw=="
    else
      icon = "data:image/gif;base64,R0lGODlhEAAQAPAAAACAAAAAACH5BAAAAAAALAAAAAAQABAAAAIOhI+py+0Po5y02ouzPgUAOw=="

    if link = document.querySelector "#favicon"
      link.parentNode.removeChild link

    link = document.createElement "link"
    link.id = "favicon"
    link.rel = "icon"
    link.type = "image/gif"
    link.href = icon
    document.head.appendChild link
    return

  update_project = (message, mute = false) ->
    project = document.querySelector ".project[data-project_id=\"#{message.id}\"]"
    unless project?
      project = document.querySelector("#template > .project").cloneNode true
      project.setAttribute "data-project_id", message.id
      project.querySelector(".name").textContent = message.name
      document.querySelector("#projects").appendChild project
    project.className = "project #{message.status}"
    project.querySelector(".log").textContent = message.log or ""
    project.parentNode.insertBefore project, project.parentNode.firstChild
    update_favicon()
    if not mute
      switch message.status
        when "normal"
          voice_play voice_complete
        when "error"
          voice_play voice_error
    return

  socket.on "all_projects", (message) ->
    for project in message
      update_project project, true
    return

  socket.on "project_updated", update_project

  return
