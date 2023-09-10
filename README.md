# nim-playground

Interactive server/website that gives you an editor allowing you to easily play with the [Nim language](http://nim-lang.org).

You can execute Nim code right in your browser, and see the output, or compiler errors.
The history of your executed code is saved in browser localStorage.

You should run the playground yourself on your local computer.
It only takes two commands to install and launch it.

## Get started

* Install the playground with [**nimble**](https://github.com/nim-lang/nimble):

```bash
nimble install playground
```

* Run the playground:

```bash
playground
```

* Open your browser at [http://localhost:5000](http://localhost:5000).

* Enjoy.

## Bug Notice

As of September 2023, you may encounter the following error when launching the playground:

```
SIGSEGV: Illegal storage access. (Attempt to read from nil?)
Segmentation fault
```

This issue originates from the [httpbeast](https://github.com/dom96/httpbeast) library, which is a dependency of  [jester](https://github.com/dom96/jester). For further information, refer to this [GitHub issue](https://github.com/dom96/jester/issues/321).



### Quick Fix

* Run the playground:

```bash
nimble run -d:useStdLib
```

* Compile the playground:

```bash
nimble build -d:useStdLib
```

The flag `-d:useStdLib` directs jester to use [std/asynchttpserver](https://nim-lang.org/docs/asynchttpserver.html) instead of [httpbeast](https://github.com/dom96/httpbeast).


## Security notice

The playground **is NOT** intended for public hosting / being available publicly, since any user could 
wreak havoc on the running machine (delete files, etc).

Only use it locally, behind a firewall.

## Additional information

### Versioning

This project follows [SemVer](semver.org).

### License.

This project is under the [MIT license](https://opensource.org/licenses/MIT).

