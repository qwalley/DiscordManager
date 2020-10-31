const Discord = require('discord.js');
// const bot = new Discord.Client({ ws: { intents: ['GUILD_PRESENCES', 'GUILD_MEMBERS'] } });
const bot = new Discord.Client();
const config = require('./config.json');
bot.commands = new Discord.Collection();
const botCommands = require('./commands');

// save mapping of command name to command execute function in bot object
Object.keys(botCommands).map(key => {
  bot.commands.set(botCommands[key].name, botCommands[key]);
});

const TOKEN = config.token;
bot.login(TOKEN);

const sendToDebug = async (content) => {
	let channel = null;
	try {
		channel = await bot.channels.fetch(config.debug_channel);
	} catch (error) {
		throw "Error: Could not fetch debug_channel: " + ('\n' + error).replace(/\n/g, '\n\t');
	}
	try {
		return await channel.send(content);
	} catch (error) {
		throw "Error: Could not send welcome message to debug channel: " + ('\n' + error).replace(/\n/g, '\n\t');
	}
}

bot.on('ready', async () => {
  console.info(`Logged in as ${bot.user.tag}!`);
  if (!config.debug_channel) {
  	return;
  }
  sendToDebug(`Hello, my name is ${config.name}!`).catch(error => console.error(error));
});


bot.on('message', async msg => {
  // if master channel is configured
  if (config.debug_channel) {
    // check that message is on the correct channel 
    if (config.debug_channel !== msg.channel.id) return;
  }
  // assume first word is intended as a command
  const args = msg.content.split(/ +/);
  command = args.shift().toLowerCase();
  // check that command has correct prefix
  regex = new RegExp('^' + config.prefix);
  if (!regex.test(command)) return;
  // check that bot has command
  command = command.replace(regex, '');
  if (!bot.commands.has(command)) return;

  console.info(`Called command: ${command}`);
  // execute the command, all commands should return promises
  try {
    await bot.commands.get(command).execute(msg, args);
  } catch (error) {
    console.error(error);
    msg.reply('there was an error trying to execute that command!');
  }
});

bot.on('guildMemberUpdate', async (oldMember, newMember) => {
	
	// only look at role changes
	if (oldMember._roles.length >= newMember._roles.length) return;
	
	// check if each important role has been added
	for (const role of config.on_role_change) {
		
		if (!oldMember._roles.includes(role.id)) {
			
			if (newMember._roles.includes(role.id)) {
				try {
					return await newMember.send(role.message);
				} catch (error) {
  					console.error(error);
  					return sendToDebug(`Unable to DM ${newMember.user.username}!`).catch(error => console.error(error));
				}
			}
		}
	}
});
