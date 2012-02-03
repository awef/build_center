def haml(src, output)
  sh "haml -q #{src} #{output}"
end

def scss(src, output)
  sh "scss --style compressed #{src} #{output}"
end

def coffee(src, output)
  sh "cat #{src} | coffee -cbsp > #{output}"
end

rule ".html" => "%{^bin/,src/}X.haml" do |t|
  haml(t.prerequisites[0], t.name)
end

rule ".css" => "%{^bin/,src/}X.scss" do |t|
  scss(t.prerequisites[0], t.name)
end

rule ".js" => "%{^bin/,src/}X.coffee" do |t|
  coffee(t.prerequisites[0], t.name)
end

p_cp = proc do |t|
  sh "cp #{t.prerequisites[0]} #{t.name}"
end

task :default => [
  "bin",
  "bin/server.js",
  "bin/client.html",
  "bin/client.css",
  "bin/client.js",
  "bin/voice_complete.ogg",
  "bin/voice_error.ogg"
]

directory "bin"
file "bin/voice_complete.ogg" => "src/voice_complete.ogg", &p_cp
file "bin/voice_error.ogg" => "src/voice_error.ogg", &p_cp
