const httpz = require("@octanuary/httpz");
const asset = require("./asset.js");
const char = require("./char.js");
//// commented out because i'm waiting on the studio decomp
//// before doing any major things, like y'know, an exporter.
// const exporter = require("./exporter.js");
// const flash = require("./flash.js");
const handler = require("serve-handler");
const movie = require("./movie.js");
const settings = require("./settings.js");
const theme = require("./theme.js");
const tts = require("./tts.js");
const watermark = require("./watermark.js");
const waveform = require("./waveform.js");

const group = new httpz.Group();
group.add(asset);
group.add(char);
//group.add(exporter);
// group.add(flash);
group.add(movie);
group.add(theme);
group.add(settings);
group.add(tts);
group.add(watermark);
group.add(waveform);
group.route("*", "*", (req, res) => {
	if (res.writableEnded) {
		return;
	}
	handler(req, res, {
		public: "src/server/public", 
		headers: {
			"Cache-Control": "no-store"
		}
	});
});

module.exports = group;
