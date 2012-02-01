window.addEventListener "load", ->
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

  update_item = (message) ->
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
    return

  socket.on "item_list", (item_list) ->
    for item in item_list
      update_item item
    return

  socket.on "item_updated", update_item

  return
