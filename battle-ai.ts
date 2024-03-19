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
const fs = require('fs');

const spec = {
	formatid: process.argv[2],
	seed: [19, 86, 10, 25],
};

let team = '';
let ai_team = '';

let get_team = (input) => {
	if (input.includes('|'))
		return input;
	else if (input.endsWith('.txt'))
		return fs.readFileSync(input, {encoding: 'utf8'});
	else
		return Teams.pack(Teams.generate(input));
};

if (process.argv.length == 4) {
	team = get_team(process.argv[3]);
	ai_team = get_team(process.argv[3]);
} else if (process.argv.length == 5) {
	team = get_team(process.argv[3]);
	ai_team = get_team(process.argv[4]);
}

fs.writeFileSync('Team_Player.txt', team);
fs.writeFileSync('Team_AI.txt', ai_team);
fs.writeFileSync('Team_Player_Export.txt', Teams.export(Teams.unpack(team)).replaceAll('  \n', '\n'));
fs.writeFileSync('Team_AI_Export.txt', Teams.export(Teams.unpack(ai_team)).replaceAll('  \n', '\n'));

fs.writeFileSync('Battle_Log.txt', '');

const p1spec = {
	name: "Player",
	team: team,
};
const p2spec = {
	name: "AI",
	team: ai_team,
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
		if (chunk.startsWith('||>>> let ')) {
			console.log(chunk.split('\n').slice(2, -1).join('\n'));
		} else if (!chunk.startsWith('|request|')) {
			console.log(chunk);
		}

		if (chunk.includes('\n|win|'))
			process.exit();
	}
})();

streams.omniscient.write(`>start ${JSON.stringify(spec)}
>player p1 ${JSON.stringify(p1spec)}
>player p2 ${JSON.stringify(p2spec)}`);

const readline = require('readline');

const rl = readline.createInterface({
	input: process.stdin,
	output: process.stdout,
	terminal: false
});

rl.on('line', (line) => {
	fs.appendFileSync('Battle_Log.txt', '\n>' + line + '\n');

	if (line == 'q') {
		process.exit();
	} else if (line.startsWith('team ') || line.startsWith('move ') || line.startsWith('switch ') || line == 'auto') {
		void streams.omniscient.write('>p1 ' + line);
	} else if (line.startsWith('p1 ') || line.startsWith('p2 ')) {
		let p1 = line.startsWith('p1 ');
		let command = 'let p = pokemon("' + line.slice(0, 2) + '", "' + line.slice(3) + '");' +
			'let ret = "\\n" + p.getDetails().shared.split("|")[0] + "\\n";' +
			(p1 ? 'ret += "Type: " + p.getTypes().join(", ") + "\\n";' : '') +
			(p1 ? 'ret += "Ability: " + p.getAbility().name + "\\n";' : '') +
			(p1 ? 'ret += "Item: " + p.getItem().name + "\\n";' : '') +
			(p1 ? 'for (let i in p.getMoves()) ret += "Move " + (Number(i) + 1) + ": " + p.getMoves()[i].move + ", " + p.getMoves()[i].pp + "/" + p.getMoves()[i].maxpp + "\\n";' : '') +
			'if (p.status) ret += "Status: " + p.getStatus().name + "\\n";' +
			'if (p.isActive) ret += "Stages: " + Object.keys(p.boosts).map(k => k + " " + p.boosts[k]).join(", ") + "\\n";' +
			'ret;'
		streams.omniscient.write('>eval ' + command);
	} else if (line == 'field') {
		let command = 'let ret = "\\n";' +
			'if (battle.field.weather) ret += "Weather: " + battle.field.getWeather().name + "\\n";' +
			'if (battle.field.terrain) ret += "Terrain: " + battle.field.getTerrain().name + "\\n";' +
			'if (Object.keys(battle.field.pseudoWeather).length > 0) ret += "Other: " + Object.keys(battle.field.pseudoWeather).map(k => battle.field.getPseudoWeather(k).name).join(", ") + "\\n";' +
			'if (Object.keys(p1.sideConditions).length > 0) ret += "P1: " + Object.keys(p1.sideConditions).map(k => p1.getSideCondition(k).name).join(", ") + "\\n";' +
			'if (Object.keys(p2.sideConditions).length > 0) ret += "P2: " + Object.keys(p2.sideConditions).map(k => p2.getSideCondition(k).name).join(", ") + "\\n";' +
			'ret;'
		streams.omniscient.write('>eval ' + command);
	} else if (line.startsWith('>')) {
		streams.omniscient.write('>eval ' + line.slice(1));
	}
});
