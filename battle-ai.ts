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
import {Formats} from '../../config/formats';
import {RandomPlayerAI} from '../tools/random-player-ai';

/*********************************************************************
 * Run AI
 *********************************************************************/

const streams = getPlayerStreams(new BattleStream());
const fs = require('fs');
const readline = require('readline');
const { exec } = require('child_process');

if (process.env.PLAYER_CONTROL_AI)
	console.log('PLAYER_CONTROL_AI');

if (process.env.EXACT_HP)
	console.log('EXACT_HP');

let player_control_ai = (process.env.PLAYER_CONTROL_AI !== undefined);
let exact_hp = (process.env.EXACT_HP !== undefined) || player_control_ai;

if (!exact_hp) {
	for (const format of Formats) {
		if (format.name && format.name.startsWith('[Gen ') && format.name.endsWith(' Custom Game')) {
			format.debug = false;
			format.ruleset.push('HP Percentage Mod', 'Illusion Level Mod');
		}
	}
}

const spec = {
	formatid: process.argv[2],
	seed: [19, 86, 10, 25]
};

let generator = null;

let team = '';
let ai_team = '';

let get_team = (input) => {
	if (input.includes('|')) {
		return input;
	} else if (input.endsWith('.txt')) {
		return fs.readFileSync(input, {encoding: 'utf8'});
	} else {
		generator ??= Teams.getGenerator(input);
		if (generator.factoryTier)
			console.log('Tier: ' + generator.factoryTier);
		return Teams.pack(generator.getTeam());
	}
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
	team: team
};
const p2spec = {
	name: "AI",
	team: ai_team
};

if (!player_control_ai) {
	const ai = new RandomPlayerAI(streams.p2, {move: 0.9, mega: 0.9, seed: [19, 86, 10, 25]});
	ai.start();
}

void (async () => {
	for await (const chunk of streams.omniscient)
			fs.appendFileSync('Battle_Log.txt', chunk);
})();

void (async () => {
	for await (const chunk of streams.p1) {
		if (chunk.startsWith('||>>> /*') && !chunk.includes('<<< error:')) {
			let lines = chunk.split('\n');
			if (lines.length == 2) {
				console.log(lines[1].replace('<<< "', '').slice(0, -1));
			} else {
				for (let i = 0; i < lines.length; i++) {
					if (i == 1) {
						console.log(lines[i].replace('<<< "', ''));
					} else if (i == lines.length - 1) {
						if (lines[i] != '||"')
							console.log(lines[i].slice(0, -1));
					} else if (i != 0) {
						console.log(lines[i]);
					}
				}
			}
		} else if (chunk.endsWith('|teampreview')) {
			let lines = chunk.split('\n');
			let gen = '';
			let p1_pokes : string[] = [];
			let p2_pokes : string[] = [];
			for (const line of lines.slice(0, -1)) {
				if (line.startsWith('|gen|'))
					gen = line;
				else if (line.startsWith('|poke|p1|'))
					p1_pokes.push(line);

				if (line.startsWith('|poke|p2|'))
					p2_pokes.push(line);
				else
					console.log(line);
			}
			if (!player_control_ai) {
				for (let i = p2_pokes.length - 1; i > 0; i--) {
					let j = Math.floor(Math.random() * (i + 1));
					[p2_pokes[i], p2_pokes[j]] = [p2_pokes[j], p2_pokes[i]];
				}
			}
			console.log(p2_pokes.join('\n') + '\n' + lines.slice(-1)[0]);
			exec('python preview.py "' + gen + '#' + (generator ? generator.factoryTier : '') + '#' + p1_pokes.join(';') + '#' + p2_pokes.join(';') + '"');
		} else if (!chunk.startsWith('|request|')) {
			console.log(chunk);
		}

		if (chunk.includes('\n|win|'))
			process.exit();
	}
})();

if (player_control_ai) {
	void (async () => {
		for await (const chunk of streams.p2) {
			if (chunk.startsWith('|error|'))
				console.log(chunk);
		}
	})();
}

streams.omniscient.write(`>start ${JSON.stringify(spec)}
>player p1 ${JSON.stringify(p1spec)}
>player p2 ${JSON.stringify(p2spec)}`);

const rl = readline.createInterface({
	input: process.stdin,
	output: process.stdout,
	terminal: false
});

rl.on('line', (line) => {
	fs.appendFileSync('Battle_Log.txt', '\n>' + line + '\n');

	let words = line.split(' ');

	if (line == 'q') {
		process.exit();
	} else if (player_control_ai && ['p1', 'p2'].includes(words[0]) && ['team', 'move', 'switch', 'auto'].includes(words[1])) {
		streams.omniscient.write('>' + line);
	} else if (!player_control_ai && ['team', 'move', 'switch', 'auto'].includes(words[0])) {
		streams.omniscient.write('>p1 ' + line);
	} else if (['p1', 'p2'].includes(words[0])) {
		let show_all = player_control_ai || words[0] == 'p1';
		let command = '/*' + line + '*/ let p = pokemon("' + line.slice(0, 2) + '", "' + line.slice(3) + '");' +
			'let ret = "";' +
			(show_all ? 'ret += p.getDetails().secret.replace("|", " (") + ")\\n";' :
				'ret += (!p.isActive && !p.fainted ? "???" : p.getDetails().shared.replace("|", " (") + ")") + "\\n";') +
			'if (p.isActive && p.baseSpecies.baseSpecies != p.species.baseSpecies) ret += "Species: " + p.species.name + "\\n";' +
			(show_all ? 'ret += "Type: " + p.getTypes().join(", ") + "\\n";' : '') +
			(show_all ? 'ret += "Ability: " + p.getAbility().name + "\\n";' : '') +
			(show_all ? 'ret += "Item: " + (p.item ? p.getItem().name : "-") + "\\n";' : '') +
			(show_all ? 'for (let i = 0; i < p.getMoves().length; i++) ret += "Move " + (i + 1) + ": " + p.getMoves()[i].move + ", " + p.getMoves()[i].pp + "/" + p.getMoves()[i].maxpp + "\\n";' : '') +
			'let stages = Object.keys(p.boosts).filter(k => p.boosts[k] != 0);' +
			'if (stages.length > 0) ret += "Stages: " + stages.map(k => k + " " + (p.boosts[k] > 0 ? "+" : "") + p.boosts[k]).join(", ") + "\\n";' +
			'ret;';
		streams.omniscient.write('>eval ' + command);
	} else if (line == 'field') {
		let command = '/*' + line + '*/ let ret = "";' +
			'if (battle.field.weather) ret += "Weather: " + battle.field.getWeather().name + "\\n";' +
			'if (battle.field.terrain) ret += "Terrain: " + battle.field.getTerrain().name + "\\n";' +
			'if (Object.keys(battle.field.pseudoWeather).length > 0) ret += "Other: " + Object.keys(battle.field.pseudoWeather).map(k => battle.field.getPseudoWeather(k).name).join(", ") + "\\n";' +
			'if (Object.keys(p1.sideConditions).length > 0) ret += "P1: " + Object.keys(p1.sideConditions).map(k => p1.getSideCondition(k).name).join(", ") + "\\n";' +
			'if (Object.keys(p2.sideConditions).length > 0) ret += "P2: " + Object.keys(p2.sideConditions).map(k => p2.getSideCondition(k).name).join(", ") + "\\n";' +
			'ret;';
		streams.omniscient.write('>eval ' + command);
	} else if (line == 'teams') {
		let command = '/*' + line + '*/ let ret = "P1:\\n";';
		command += 'for (let i = 0; i < p1.pokemon.length; i++) ret += (i + 1) + ". " + ' +
			'(p1.pokemon[i].isActive ? "* " : "") + ' +
			'p1.pokemon[i].getDetails().secret.replace("|", " (") + ")" + "\\n";' +
			'ret += "\\nP2:\\n";';
		if (player_control_ai)
			command += 'for (let i = 0; i < p2.pokemon.length; i++) ret += (i + 1) + ". " + ' +
				'(p2.pokemon[i].isActive ? "* " : "") + ' +
				'p2.pokemon[i].getDetails().secret.replace("|", " (") + ")" + "\\n";';
		else
			command += 'for (let i = 0; i < p2.pokemon.length; i++) ret += (i + 1) + ". " + ' +
				'(p2.pokemon[i].isActive ? "* " : "") + ' +
				'(!p2.pokemon[i].isActive && !p2.pokemon[i].fainted ? "???" : p2.pokemon[i].getDetails().shared.replace("|", " (") + ")") + "\\n";';
		command += 'ret;';
		streams.omniscient.write('>eval ' + command);
	} else if (line.startsWith('>')) {
		streams.omniscient.write('>eval ' + line.slice(1));
	} else {
		console.log('Wrong command!');
	}
});
