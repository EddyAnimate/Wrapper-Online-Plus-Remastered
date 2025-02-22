import type { Asset } from "../../main/server/models/asset";
import crypto from "crypto";
import Directories from "./directories";
import fs from "fs";
import { join } from "path";
import type { Movie } from "../../main/server/models/movie";

type DatabaseJson = {
	version: string,
	assets: Asset[],
	movies: Movie[],
};

export class Database {
	private path = join(Directories.saved, "database.json");
	private json:DatabaseJson = {
		version: process.env.WRAPPER_VER,
		assets: [],
		movies: []
	};
	private static _instance:Database;

	constructor() {
		// create the file if it doesn't exist
		if (!fs.existsSync(this.path)) {
			console.error("Database doesn't exist! Creating...");
			this.save(this.json);

			try {
				this.refresh();
			} catch (e) {
				throw new Error("Something is extremely awfully horribly terribly preposterously crazily insanely madly wrong. You may be in a read-only system/admin folder.");
			}
		}
		this.refresh();
		if (!this.json.version) {
			// wrapper versions prior to 2.1.0 don't store the database
			// version so we're going to be adding it and modifying things
			// as the database structure changes
			this.json.version = "2.0.0";
		}
		if (this.json.version == "2.0.0") {
			this.json.version = "2.1.0";
			this.save(this.json);
		}
		// just keep adding onto this as you change stuff
	}

	static get instance() {
		if (!Database._instance) {
			Database._instance = new Database();
		}
		return Database._instance;
	}

	/**
	 * refreshes this.json using the this.json in its current state
	 */
	private refresh() { // refresh the database vars
		const data = fs.readFileSync(this.path);
		this.json = JSON.parse(data.toString());
	}

	/**
	 * saves this.json into the database.json file
	 * @param {DatabaseJson} newData
	 */
	private save(newData) {
		try {
			fs.writeFileSync(this.path, JSON.stringify(newData, null, "\t"));
		} catch (err) {
			console.error("Error saving DB:", err);
		}
	}

	/**
	 * deletes a field from the database
	 * @param {"assets" | "movies"} from category to select from
	 * @param {string} id id to look for
	 * @returns did it work or not
	 */
	delete(from, id) {
		const object = this.get(from, id);
		if (object == false) {
			return false;
		}
		const index = object.index;

		this.json[from].splice(index, 1);
		this.save(this.json);
		return true;
	}

	/**
	 * returns an object from the database
	 * @param from category to select from
	 * @param id id to look for
	 * @returns returns object if it worked, false if it didn't
	 */
	get(from:"assets", id:string): {
		data: Asset,
		index: number
	} | false;
	get(from:"movies", id:string): {
		data: Movie,
		index: number
	} | false;
	get(from:"assets"|"movies", id:string): {
		data: Movie | Asset,
		index: number
	} | false
	get(from:"assets"|"movies", id:string): {
		data: Movie | Asset,
		index: number
	} | false {
		this.refresh();

		const category = this.json[from];
		let index:number;
		const object = category.find((i, ind) => {
			if (i.id == id) {
				index = ind;
				return true;
			}
		});
		if (!object) {
			return false;
		}

		return {
			data: object,
			index: index
		}
	}

	/**
	 * @overload
	 * @param {"assets"} into
	 * @param {Asset} data
	 */
	/**
	 * @overload
	 * @param {"movies"} into
	 * @param {Movie} data
	 */
	/**
	 * Adds another field to the database.
	 * @param {"assets" | "movies"} into Category to insert into.
	 * @param {Asset | Movie} data Data to insert.
	 */
	insert(into, data) {
		this.refresh();
		this.json[into].unshift(data);
		this.save(this.json);
	}

	/**
	 * Returns the database.
	 * @param from Category to select from.
	 * @param where Parameters for each key.
	 */
	select(from:"assets", where?:Record<string, string>):Asset[]
	select(from:"movies", where?:Record<string, string>):Movie[]
	select(
		from:"assets"|"movies",
		where?:Record<string, string>
	):(Asset|Movie)[] {
		this.refresh();

		const category = this.json[from];
		const filtered = category.filter((/** @type {Record<String, unknown>} */ val) => {
			for (const [key, value] of Object.entries(where || {})) {
				if (val[key] && val[key] != value) {
					return false;
				}
			}
			return true;
		});
		return filtered;
	}

	/**
	 * Updates a field from the database.
	 * @param from Category to select from.
	 * @param id Id to look for.
	 * @param data New data to save.
	 * @returns did it work or not
	 */
	update(from:"assets"|"movies", id:string, data:Partial<Asset>|Partial<Movie>): boolean {
		const object = this.get(from, id);
		if (object == false) {
			return false;
		}
		const index = object.index;

		Object.assign(this.json[from][index], data);
		this.save(this.json);
		return true;
	}
};

/**
 * @summary generates a random id
 */
export function generateId() {
	return crypto.randomBytes(4).toString("hex");
}

export default Database.instance;
