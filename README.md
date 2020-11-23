# Discord Private Voice Channel System

## What is it?
It is a free-to-use and modifiable open-source bot that acts as a Private Voice Channel system, for Discord Servers. 

<br>

## Installation/Dependencies

### Dependencies:

* A MySQL Server
* A Discord Server
* NodeJS v12+

### Installation:

#### Discord:

1. [Create a Discord Bot and Invite it to your Server](https://discordpy.readthedocs.io/en/latest/discord.html).
2. Give `Administrator` permissions to your bot.
3. Create a `Lobby Voice Channel` and (separately) a category to create private channels under.


#### Source Code:

1. You need to firstly download the source code and put it somewhere on your PC/VPS/DS.
2. Go to the `config.json` and edit each option respectively. Everything needs to be configured for the bot to work. 
3. Continue reading to assist with the configuration of your `config.json`.

#### MySQL:

1. Install a [MySQL Server](https://dev.mysql.com/doc/mysql-installation-excerpt/5.7/en/).
2. Create a MySQL Table using this command: ```CREATE TABLE private (roomcode TEXT(20) NOT NULL, channelid VARCHAR(18) DEFAULT '' NOT NULL, userid VARCHAR(18) DEFAULT '' NOT NULL);```.
3. This server needs to be running at all time, or at least only when the bot is online.

#### NodeJS:

1. Install [NodeJS](https://nodejs.org/en/download/) onto your system
2. Navigate to the directory with your code using either a Command Prompt (Windows) or Terminal (Linux).
3. Send the command: ```npm install``` to install all required NPM Packages/Dependencies.

To run your bot, run the command `node index.js` when you've navigated to your bot files via Command Prompt (Windows) or Terminal (Linux).
