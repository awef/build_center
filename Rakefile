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

task :default => [
  "bin",
  "bin/server.js",
  "bin/client.html",
  "bin/client.css",
  "bin/client.js"
]

directory "bin"
