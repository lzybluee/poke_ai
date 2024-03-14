/**
 * Battle Stream Example
 * Pokemon Showdown - http://pokemonshowdown.com/
 *
 * Example of how to create AIs battling against each other.
 * Run this using `node build && node .sim-dist/examples/battle-stream-example`.
 *
 * @license MIT
 * @author Guangcong Luo <guangcongluo@gmail.com>
 */

import {BattleStream, getPlayerStreams, Teams} from '..';
import {RandomPlayerAI} from '../tools/random-player-ai';

/*********************************************************************
 * Run AI
 *********************************************************************/

const streams = getPlayerStreams(new BattleStream());

const spec = {
	formatid: process.argv.length > 2 ? "gen7doublescustomgame" : "gen7customgame",
};

let team = Teams.generate(process.argv.length > 2 ? 'gen7randomdoublesbattle' : 'gen7randombattle');
let ai_team = Teams.generate(process.argv.length > 2 ? 'gen7randomdoublesbattle' : 'gen7randombattle');

console.log(Teams.export(team));

const fs = require('fs');
fs.writeFileSync('Team_Player.txt', Teams.pack(team));
fs.writeFileSync('Team_AI.txt', Teams.pack(ai_team));
fs.writeFileSync('Team_Player_Export.txt', Teams.export(team));
fs.writeFileSync('Team_AI_Export.txt', Teams.export(ai_team));

fs.writeFileSync('Battle_Log.txt', '');

const p1spec = {
	name: "Player",
	team: Teams.pack(team),
};
const p2spec = {
	name: "AI",
	team: Teams.pack(ai_team),
};

const ai = new RandomPlayerAI(streams.p2);
void ai.start();

void (async () => {
	for await (const chunk of streams.omniscient) {
		fs.appendFileSync('Battle_Log.txt', chunk);
	}
})();

void (async () => {
	for await (const chunk of streams.p1) {
		if (!chunk.startsWith('|request|'))
			console.log(chunk);
	}
})();

void streams.omniscient.write(`>start ${JSON.stringify(spec)}
>player p1 ${JSON.stringify(p1spec)}
>player p2 ${JSON.stringify(p2spec)}`);

const readline = require('readline');

const rl = readline.createInterface({
	input: process.stdin,
	output: process.stdout,
	terminal: false
});

rl.on('line', (line) => {
	if (line == 'q')
		process.exit();
	void streams.omniscient.write('>p1 ' + line);
});