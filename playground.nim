import jester, asyncdispatch, htmlgen, strutils, strtabs, osproc, os, oids, times, marshal, json

type Result = object of RootObj
  status: string
  result: string
  compileTime: float
  executionTime: float

proc execute(body: string, appendCompilerOutput = true): string =
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
  var (rawOutput, errCode) = osproc.execCmdEx("nim c --threads:on --opt:none " & filePath & ".nim")
  compileTime = times.epochTime() - start
  output = $rawOutput
  if errCode > 0:
    status = "compileError"
    echo("Compilation error for $1: $2" % [filePath, output])
  else:
    (rawOutput, errCode) = osproc.execCmdEx(filePath)
    if appendCompilerOutput:
      output = $rawOutput & "\n\n" & "#".repeat(60) & "\n###" & " Compiler output " & "#".repeat(40) & "\n" & "#".repeat(60) & "\n\n" & output
    else:
      output = $rawOutput
    executionTime = times.epochTime() - start - compileTime
    if errCode > 0:
      status = "executionError"
      echo("Execution error for $1: $2" % [filePath, output])
    else:
      echo("Execution of $1 succeded." % [filePath])

  var response = Result(status: status, result: output, compileTime: compileTime, executionTime: executionTime)

  return $$response

settings:
  staticDir = joinPath(getAppDir(), "public")
  port = 5000.Port
  bindAddr = "127.0.0.1"

routes:
  post "/api/execute":
    let headers = newStringTable(modeCaseSensitive)
    headers["Content-Type"] = "application/json"
    let body = try: request.body.parseJson
               except: newJNull()
    let code = body["code"].getStr()
    let compilerOutput = body["compilerOutput"].getBool()
    resp(execute(code, appendCompilerOutput = compilerOutput))


runForever()
