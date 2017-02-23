import axios from "axios";
import { openSync, statSync, readSync, closeSync, writeFileSync } from "fs";
import { createHash } from "crypto";
import { stringify } from "querystring";
import * as glob from "glob";

const BLOCK_SIZE = 4096;
const API_ENDPOINT = "https://www.shooter.cn/api/subapi.php";
axios.defaults.timeout = 10 * 1000;

export function getHash(path: string) {
    const fd = openSync(path, "r");
    const { size } = statSync(path);
    const hash = [BLOCK_SIZE, Math.floor(size / 3) * 2, Math.floor(size / 3), size - 2 * BLOCK_SIZE]
        .map(position => {
            const buffer = new Buffer(BLOCK_SIZE);
            readSync(fd, buffer, 0, BLOCK_SIZE, position);
            return createHash("md5").update(buffer).digest("hex");
        })
        .join(";");
    closeSync(fd);
    return hash;
}

export type Fileinfo = {
    Ext: string,
    Link: string,
};

export type Subinfo = {
    Desc: string,
    Delay: number,
    Files: Fileinfo[]
};

export async function getSubtitles(path: string, hash: string, lang: string = "chn"): Promise<Subinfo[]> {
    try {
        const { data } = await axios.post(API_ENDPOINT, stringify({
            filehash: hash,
            pathinfo: path,
            format: "json",
            lang: lang
        }));
        if (typeof data === "object") {
            return data;
        } else {
            return [];
        }
    } catch (err) {
        console.error(err);
        return [];
    }
}

export function saveSubtitles(path: string, subs: Subinfo[], lang: string = "chn") {
    subs.map(async ({ Delay, Files }, index) => {
        try {
            if (Delay) {
                writeFileSync(`${path}.${lang}${index || ""}.delay`, Delay);
            }
            if (Files.length) {
                const { data } = await axios.get(Files[0].Link);
                writeFileSync(`${path}.${lang}${index || ""}.${Files[0].Ext}`, data);
            }
        } catch (err) {
            console.error(err);
        }
    });
}

export function searchAndGetSubtitles(dir: string, lang: string = "chn", ext: string[] = ["mkv"]) {
    glob(`**/*.+(${ext.join("|")})`, { cwd: dir }, (err, matches) => {
        if (err) {
            console.error(err);
        }
        if (matches.length) {
            matches
                .map(match => `${dir}/${match}`)
                .map(async path => saveSubtitles(path, await getSubtitles(path, getHash(path), lang)), lang);
        } else {
            console.warn("Not Found matching files");
        }
    });
}

