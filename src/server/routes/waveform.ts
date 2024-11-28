import fs from "fs";
import httpz from "@octanuary/httpz";
import path from "path";
import Settings from "../../shared/storage/settings";
import WfModel from "../models/waveform.js";

const group = new httpz.Group();

/*
load
*/
group.route("POST", "/goapi/getWaveform/", async (req, res) => {
	const SHOW_WAVEFORMS = Settings.showWaveforms;
	if (SHOW_WAVEFORMS) {
		const id = req.body.wfid;
		if (!id) {
			return res.status(500).end("Missing one or more fields.");
		}

		try {
			const waveform = WfModel.load(id);
			waveform ? (res.statusCode = 200, res.end(waveform)) :
				(res.statusCode = 404, res.end());
		} catch (err) {
			if (err == "404") {
				return res.status(404).end();
			}
			console.log(req.parsedUrl.pathname, "failed. Error:", err);
			res.status(500).end();
		}
	} else {
		const filepath = path.join(__dirname, "../data/waveform.txt");
		if (fs.existsSync(filepath)) {
			fs.createReadStream(filepath).pipe(res);
		} else {
			res.status(404).end("0");
		}
	}
});

/*
save
*/
group.route("POST", "/goapi/saveWaveform/", (req, res) => {
	const { waveform } = req.body;
	const id = req.body.wfid;
	if (!id) {
		return res.status(500).end("Missing one or more fields.");
	}

	try {
		WfModel.save(waveform, id);
		res.end("0");
	} catch (e) {
		if (e == "404") {
			return res.status(404).end("1");
		}
		console.error(req.parsedUrl.pathname, "failed. Error:", e);
	}
});

export default group;
