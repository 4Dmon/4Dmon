# Picmon

Takes a screenshot of the desktop and saves it for viewing.

Picmon is activated when:

* Bad stuff happens
* You click the button on the snapshot page

By default, Picmon will just take a screenshot of the desktop in its current state. It also has
the ability to capture pictures of 4D Client and 4D Server. To activate this feature, Picmon needs
to know what processes the machine **should** be running. In `./conf/machines.json` there are two arrays: "clients"
and "servers". For example, if the machine you wish to take screenshots of will normally be running 4D
client, just add your machine's name to the "client" array.

If you are unsure of the machine's name as node sees it, enter node in the command prompt and type the
following:

* os = require("os")
* os.hostname()

To get pictures of 4D Client or Server, Picmon will need to maximize those windows, so don't be alarmed
if you see them maximizing when it starts up! However, Picmon does NOT check whether or not these windows exist.
If it tries to take a screenshot of Server, for example, and server is not there it will just take a
regular desktop screenshot rather than return an error. This is so that we can still get a screenshot in
the event of a complete 4D crash.