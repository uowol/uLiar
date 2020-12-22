'use strict';

const {Client, MessageEmbed } = require('discord.js');

const token = require('./token.json');
const bot = new Client();

bot.on('ready', () => {
    console.log(`Logged in as ${client.user.tag}!`);
});

bot.on('message', msg => {
    if (msg.content === '!도움') {
        
    }
});

const startGame = () => {

}

bot.login(token.token);