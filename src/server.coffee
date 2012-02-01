fs = require "fs"
child_process = require "child_process"
crypto = require "crypto"

app = require("http").createServer (req, res) ->
  if req.url in ["/", "/client.css", "/client.js"]
    local_path = if req.url is "/" then "/client.html" else req.url
    fs.readFile __dirname + local_path, (err, data) ->
      if /\.html?$/.test local_path
        res.setHeader "X-Frame-Options", "Deny"
      res.writeHead 200
      res.end data
      return
  else
    res.writeHead 403
    res.end()
  return

app.listen 8000

io = require("socket.io").listen app

config = JSON.parse fs.readFileSync process.env.HOME + "/.build_center"

item_list = []

watch_loop = (item) ->
  command = [
    "cd #{item.base_path}"
    item.build_command
  ].join ";"

  child_process.exec command, (error, stdout, stderr) ->
    item.status = if error then "error" else "normal"
    item.log = stderr + (if stderr and stdout then "\n" else "") + stdout
    io.sockets.emit "item_updated", item

    command = [
      "cd #{item.base_path}"
      "inotifywait -q -r -e create,delete,move,close_write #{item.watch_path}"
    ].join ";"
    child_process.exec command, (error, stdout, stderr) ->
      item.status = if error then "error" else "in_progress"
      item.log = stderr + (if stderr and stdout then "\n" else "") + stdout
      io.sockets.emit "item_updated", item
      watch_loop item
      return
    return
  return

config.items.forEach (item) ->
  hash = crypto.createHash "md5"
  hash.update item.name
  item.id = hash.digest "hex"

  item.log = null
  item.status = "in_progress"

  item_list.push item
  watch_loop item
  return

io.sockets.on "connection", (socket) ->
  socket.emit "item_list", item_list
  return
