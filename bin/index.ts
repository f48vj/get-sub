#!/usr/bin/env node

import * as program from "commander";
import { searchAndGetSubtitles } from "../";
const { version } = require("../package.json");
let dir = process.cwd();

interface InterfaceCLI extends program.ICommand {
  ext?: string[];
  lang?: string;
}

const cli: InterfaceCLI = program
    .version(version)
    .arguments("[dir]")
    .action(d => dir = d)
    .option("-e, --ext <exts>", "exts of video files    example: mkv,mp4   default: mkv", (val) => val.split(","), ["mkv"])
    .option("-l, --lang <lang>", "language of subtitle(chn or eng)   default: chn", (val) => val.toLowerCase() === "eng" ? "eng" : "chn", "chn")
    .parse(process.argv);

const { lang, ext } = cli;
searchAndGetSubtitles(dir, lang, ext);

