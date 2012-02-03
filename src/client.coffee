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
    if document.querySelector ".item.in_progress"
      icon = "data:image/gif;base64,R0lGODlhEAAQAPAAAICAgAAAACH5BAAAAAAALAAAAAAQABAAAAIOhI+py+0Po5y02ouzPgUAOw=="
    else if document.querySelector ".item.error"
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

  update_item = (message, mute = false) ->
    item = document.querySelector ".item[data-item_id=\"#{message.id}\"]"
    unless item?
      item = document.querySelector("#template > .item").cloneNode true
      item.setAttribute "data-item_id", message.id
      item.querySelector(".name").textContent = message.name
      document.querySelector("#item_container").appendChild item
    item.className = "item #{message.status}"
    item.querySelector(".log").textContent = message.log or ""
    item.parentNode.insertBefore item, item.parentNode.firstChild
    update_favicon()
    if not mute
      switch message.status
        when "normal"
          voice_play voice_complete
        when "error"
          voice_play voice_error
    return

  socket.on "item_list", (item_list) ->
    for item in item_list
      update_item item, true
    return

  socket.on "item_updated", update_item

  return
