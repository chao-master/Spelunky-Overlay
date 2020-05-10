# Spelunky *Last-Run* Overlay

## About
It shows details on your last Spelunky run!

## Setup

### Required extras
To make this work fully you will need the `jornalbgs.png`, `journalmons.png`, and `levelsketch.png` textures from the game's files.
These are not include to help avoid copyright issues, however can be extracted using various fan made modding tools from the game's files.

`jornalbgs.png` also needs to be resized, first crop it to 1000x1000, then resize to 640x640.

You will also need "Tekton-Bold.otf", which is available from adobe (and other places) under their liscening terms.

Place all these assets into the `static` folder.
If you don't agree with the licencing terms of these assets, you can substitute your own.

### Adding to OBS
 1. Modify `server.js`, changing the file path near the end to point to your Spelunky save file location
 2. Run `node server.js` to start the web server.
 3. Visit [`http://127.0.0.1:8080/static/overlay.html`](http://127.0.0.1:8080/static/overlay.html) and verify you see the details from your last run correctlly
 4. Add `http://127.0.0.1:8080/static/overlay.html` as a browser source to OBS. Width should be `332`. Height at least `300`

### Running
 Just run `node server.js` any time you need it up.

