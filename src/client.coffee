window.addEventListener "load", ->
  get_audio = (path, callback) ->
    xhr = new XMLHttpRequest()
    xhr.open "GET", path
    xhr.responseType = "arraybuffer"
    xhr.onload = ->
      str = ""
      for a in new Uint8Array @response
        str += String.fromCharCode a
      callback(new Audio("data:audio/ogg;base64,#{btoa str}"))
      return
    xhr.send()

  voice_complete = null
  voice_error = null
  get_audio "voice_complete.ogg", (audio) ->
    voice_complete = audio
    return
  get_audio "voice_error.ogg", (audio) ->
    voice_error = audio
    return

  voice_play = (audio) ->
    return unless audio?
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
