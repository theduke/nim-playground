import jester, asyncdispatch, htmlgen, strutils, strtabs, osproc, os, oids, times


proc execute(body: string): string =
  var status = "success"
  var output = ""
  var compileTime, executionTime: float = 0
  let start = times.epochTime()

  let dir = os.joinPath(os.getTempDir(), "nim_playground")
  if not existsDir(dir):
    createDir(dir)

  let filePath = os.joinPath(dir, "nim_" & $genOid())
  echo("Writing file $1" % [filePath])
  system.writeFile(filePath & ".nim", body)
  
  echo("Compiling file $1" % [filePath])
  var (rawOutput, errCode) = osproc.execCmdEx("nim c " & filePath & ".nim")
  compileTime = times.epochTime() - start
  if errCode > 0:
    status = "compileError"
    output = $rawOutput
    echo("Compilation error for $1: $2" % [filePath, output])
  else:
    (rawOutput, errCode) = osproc.execCmdEx(filePath)
    output = $rawOutput
    executionTime = times.epochTime() - start - compileTime
    if errCode > 0:
      status = "executionError"
      echo("Execution error for $1: $2" % [filePath, output])
    else:
      echo("Execution of $1 succeded." % [filePath])

  output = output.replace("\n", "\\n")

  var json = """{
    "status": "$1", 
    "result": "$2",
    "compileTime": $3,
    "executionTime": $4
  }""" % [status, output, $compileTime, $executionTime]

  return json

routes:
  post "/api/execute":
    headers = newStringTable(modeCaseSensitive)
    headers["Content-Type"] = "application/json"
    resp(execute(request.body))

runForever()
