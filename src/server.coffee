class Project
  constructor: (@name, @base_path, @watch_path, @build_command) ->
    crypto = require "crypto"
    hash = crypto.createHash "md5"
    hash.update @name
    @id = hash.digest "hex"
    @status = "normal"
    @log = ""
    return

  watch: (callback) ->
    child_process = require "child_process"
    command = [
      "cd #{@base_path}"
      "inotifywait -q -r -e create,delete,move,close_write #{@watch_path}"
    ].join ";"

    child_process.exec command, (error, stdout, stderr) =>
      if error
        @status = "error"
      @log = stderr + (if stderr and stdout then "\n" else "") + stdout
      callback.call @
      return
    return

  build: (callback) ->
    child_process = require "child_process"
    command = "cd #{@base_path}; #{@build_command}"
    @status = "in_progress"

    child_process.exec command, (error, stdout, stderr) =>
      @status = if error then "error" else "normal"
      @log = stderr + (if stderr and stdout then "\n" else "") + stdout
      callback.call @
      return
    return

fs = require "fs"

app = require("http").createServer (req, res) ->
  if req.url in [
    "/"
    "/client.css"
    "/client.js"
    "/voice_complete.ogg"
    "/voice_error.ogg"
  ]
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

projects = []

watch_loop = ->
  @build ->
    io.sockets.emit "project_updated", @
    @watch watch_loop
    return
  io.sockets.emit "project_updated", @
  return

config.projects.forEach (p) ->
  project = new Project p.name, p.base_path, p.watch_path, p.build_command
  projects.push project
  watch_loop.bind(project)()
  return

io.sockets.on "connection", (socket) ->
  socket.emit "all_projects", projects
  return
