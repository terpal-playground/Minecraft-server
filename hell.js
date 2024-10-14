const express = require('express')();
express.get('/', (req, res) => res.send('<!-- auto-pinging 525316393768452098 -->'));
express.listen(3000);

const mineflayer = require('mineflayer');
const cmd = require('mineflayer-cmd').plugin; // Load the cmd plugin
const fs = require('fs');
const readline = require('readline');

// Load bot configuration from config.json
let rawdata = fs.readFileSync('config.json');
let data = JSON.parse(rawdata);

var host = data["ip"];
var username = data["name"];
var bot = mineflayer.createBot({
  host: host,
  username: username
});

// Load the cmd plugin and allow console input
cmd.allowConsoleInput = true; // Enable command input from console
bot.loadPlugin(cmd);

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Function to start/stop movement (from previous implementation)
function handleKeyPress(key, state) {
  const keyBindings = {
    'w': 'forward',
    's': 'back',
    'a': 'left',
    'd': 'right',
    'space': 'jump'
  };

  if (keyBindings[key]) {
    bot.setControlState(keyBindings[key], state);
    console.log(`${state ? 'Started' : 'Stopped'} moving ${keyBindings[key]}`);
  }
}

// Register the custom "say" command as shown in the documentation
function sayCommand(sender, flags, args) {
  return new Promise((resolve, reject) => {
    let message = '';

    if (flags.showsender) message += sender + ': ';
    if (flags.color) message += '&' + flags.color[0];

    message += args.join(' ');
    bot.chat(message);
    resolve();
  });
}

bot.once('cmd_ready', () => {
  // Register the "say" command
  bot.cmd.registerCommand(
    'say', 
    sayCommand, 
    'make me say something', // help text
    'say <message>' // usage text
  )
  .addFlag('color', 1, ['color code'], 'Changes the chat color') // Add "color" flag
  .addFlag('showsender', 0, [], 'If present, displays the sender who sent this message'); // Add "showsender" flag
});

// Listen for command inputs from chat (starting with "!")
bot.on('chat', (username, message) => {
  if (message.startsWith('!')) {
    const command = message.substring(1);
    bot.cmd.run(username, command); // Run the command with the sender and command input
  }
});

// Handle console input for commands or movement
bot.on('spawn', function () {
  console.log('Bot spawned. Use W, A, S, D to move, and SPACE to jump. Type "/<command>" to execute commands. Press "q" to quit.');

  rl.on('line', (input) => {
    const trimmedInput = input.trim().toLowerCase();

    if (trimmedInput === 'q') {
      console.log('Exiting...');
      process.exit(0); // Quit the program
    } else if (['w', 'a', 's', 'd', ' '].includes(trimmedInput)) {
      // Handle movement keys
      handleKeyPress(trimmedInput === ' ' ? 'space' : trimmedInput, true); // Start moving
    } else if (trimmedInput === 'stop') {
      // Stop all movement
      Object.keys(keyBindings).forEach(key => handleKeyPress(key, false));
    } else if (input.startsWith('/')) {
      // Handle commands from the console (same as in chat)
      const command = input.substring(1);
      bot.cmd.run('console', command); // Execute command as "console"
    } else {
      console.log(`Unknown input: ${input}`);
    }
  });
});

bot.on('end', function () {
  console.log('Bot disconnected');
});
