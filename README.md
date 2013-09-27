# Welcome to 4Dmon!

"4Dmon, I choose you!!!!!!!"

## About

4Dmon is a Node.js server that will help to monitor and perform tasks against a
4D Server or 4D Client instance.

## Getting Started
Unleash 4Dmon by running cloning this repo and running:

```
npm install
grunt config
node app.js
```

Note: You'll need to have Node.js installed as well as the grunt command line
utility (`npm install -g grunt-cli`).

By default 4Dmon will run on port 4077 (that's **4D** converted from hex to base
10... + 4000!).

Head to `localhost:4077/option`. To configure 4Dmon, it'll need to know how to
send emails and where various executables can be found (like the 4D
executables).

#### 4Dmon, use...
4Dmon's attacks:

* Start/stop 4D server (via http req over internal ip)
* Start/stop 4D client (via http req over internal ip)
* Help build 4D server (via http req over internal ip)
* Log various stats pertaining to 4D server and client
 * Memory usage
 * Crash statistics
 * Web logs (logweb and webstats)
 * Screenshots (e.g. post crash)
 * Windows system logs
* Web interface to browse those stats
 * Real time info (uptime, # processes, mem usage)
 * Trending

## Stat Trackers
Loaded with [valise](https://github.com/jtrussell/node-valise) from
`./trackers`. For more information on trackers visit our [docs](/doc) page.

### Registering New Trackers
Register a tracker with our monitor process. We have a standard set of method
signitures that a strat tracker must export to be registered with our stat
tracking harness. For more information on trackers visit our [docs](/doc) page.

### Configs
Configuration files should be placed under `./conf` and be loaded with
[valise](https://github.com/jtrussell/node-valise).

### Logs
All logging should use [winston](https://github.com/flatiron/winston), checkout
`./init/winston.js` to see what we have setup for transports... or to add new
ones. It's yet to be determined whether we'll be storing info in a db,
flatfiles, ... or all of the above.

### Learning New Attacks
As we add more trackers, utility libs, web routes, etc. Take care to stay
consistent with the libraries and conventions we're already using.

* `valise` for config/lib/route referencing - [link](https://github.com/jtrussell/node-valise)
* `winston` for logging - [link](https://github.com/flatiron/winston)
* `async` for asynchronous flow control - [link](https://github.com/caolan/async)

## Configs
Loaded with [valise](https://github.com/jtrussell/node-valise) from
`./conf`

## License
MIT
