const { Client, MessageEmbed } = require("discord.js");
const client = new Client();
const config = require("./config.json");
const mysql = require("mysql");
const util = require("util");
const con = mysql.createConnection({
  host: `${mysql_host}`,
  user: `${mysql_user}`,
  password: `${mysql_pass}`,
  database: `${mysql_database}`
})
const conMul = mysql.createConnection({
  multipleStatements: true,
  host: `${mysql_host}`,
  user: `${mysql_user}`,
  password: `${mysql_pass}`,
  database: `${mysql_database}`
})

client.on("ready", () => {
  console.log("=====================\nThe Bot Is Now Online\n=====================");
  setInterval(function () {
    con.query(`SELECT * FROM private`, (err, rows) => {
      if (err) throw err;
    })
  }, 30000)
});

client.on("message", message => {

  if (message.content.indexOf(config.prefix) !== 0) return;
  const args = message.content.slice(config.prefix.length).trim().split(/ +/g);
  const command = args.shift().toLowerCase();

  switch(command) {
    case 'join':
      const Guild = client.guilds.cache.get(config.guildid);
      const Member = Guild.members.cache.get(message.author.id);
      if (message.guild === null) {
        if (!Member.voice.channel) return message.reply("You need to be in the Private Lobby Voice Channel to be able to queue or rejoin a game.")
        if (Member.voice.channel.id === config.lobby_VC_ID) {
          let embed = new MessageEmbed()
            .setTitle("Code Confirmation")
            .setDescription(`Are you sure you want to join the room with room code: \`${args[0]}\`?`)
          Member.send(embed).then((msg) => {
            Promise.all([
              msg.react('✅'),
              msg.react('❌')
            ])
            const filter = (reaction, user) => {
              return ['✅', '❌'].includes(reaction.emoji.name) && user.id === Member.id;
            };
            const collector = msg.createReactionCollector(filter, { time: 180000 });
            collector.on('collect', reaction => {
              if (reaction.emoji.name === '✅') {
                conMul.query(`SELECT * FROM private WHERE roomcode = '${args[0]}'; SET @count = found_rows(); SELECT @count AS 'count';`, [1, 2, 3], function (err, results, count) {
                  if (util.inspect(results[0].length) === "0") {
                    Member.send("Error! That is not a valid roomcode. Cancelling..");
                    return;
                  } else {
                    con.query(`SELECT * FROM private WHERE roomcode = '${args[0]}'`, (err, rows) => {
                      Member.voice.setChannel(rows[0].channelid);
                      Member.send("I have moved you into the Voice Channel!")
                    });
                  }
                });
              }
              if (reaction.emoji.name === '❌') {
                msg.edit("Code Confirmation Cancelled");
                return;
              }
            })
            collector.on('end', collected => {
            });
          })
            .catch(() => {
              Member.send('You took too long to respond, cancelled.\nYou need to use the \`!host\` command to bring up the host options again.');
            });
        } else {
          Member.send("You need to be in the Lobby VC to be able to create Private Voice Channels.")
        }
      }
      break;
    case 'host':
      const Guild = client.guilds.cache.get(config.guildid);
      const Member = Guild.members.cache.get(message.author.id);
      conMul.query(`SELECT * FROM private WHERE channelid = '${Member.voice.channelID}'; SET @count = found_rows(); SELECT @count AS 'count';`, [1, 2, 3], function (err, results, count) {
        if (util.inspect(results[0].length) === "0") {
          Member.send("You are not in a Private Voice Channel! You need to be in the Lobby VC to be able to create Private Voice Channels.");
        } else {
          conMul.query(`SELECT * FROM private WHERE channelid = '${Member.voice.channelID}' AND userid = '${message.author.id}'; SET @count = found_rows(); SELECT @count AS 'count';`, [1, 2, 3], function (err, results, count) {
            if (util.inspect(results[0].length) === "0") {
              Member.send("You are not the host of a Private Voice Channel! You need to be in the Lobby VC to be able to create Private Voice Channels.");
              return;
            } else {
              const embed1 = new MessageEmbed()
                .setTitle(`Room Options`)
                .setDescription(`🔄 : Change Room Code\n⛔ : Kick a User\n\n*To close the room, leave the Voice Channel.*\n\nIf the reactions stop working, you can use \`!host\` to open the options menu again.`)
              Member.send(embed1).then((msg) => {
                Promise.all([
                  msg.react('🔄'),
                  msg.react('⛔')
                ])
                const filter = (reaction, user) => {
                  return ['🔄', '⛔'].includes(reaction.emoji.name) && user.id === Member.id;
                };
                const collector = msg.createReactionCollector(filter, { time: 180000 });
                collector.on('collect', reaction => {
                  if (reaction.emoji.name === '🔄') {
                    con.query(`SELECT * FROM private WHERE userid = '${message.author.id}'`, (err, rows) => {
                      let channelset = Guild.channels.cache.find(c => c.id === rows[0].channelid);
                      channelset.setName(Math.random().toString(16).substring(2, 6) + Math.random().toString(16).substring(2, 6)).then((newchan) => {
                        con.query(`UPDATE private SET roomcode = '${newchan.name}'`);
                        Member.send(`Your new room code is now \`${newchan.name}\`\nYou need to use the \`!host\` command to bring up the host options again.`)
                      })
                    })
                  }
                  if (reaction.emoji.name === '⛔') {
                    Member.send("Which User did you want to kick from the Voice Channel (Send their Discord User ID)?").then(() => {
                      const filter = m => Member.id === m.author.id;
  
                      message.channel.awaitMessages(filter, { time: 60000, max: 1, errors: ['time'] })
                        .then(messages => {
                          let selectedUser = Guild.members.cache.find(u => u.id === `${messages.first().content}`);
                          if (!selectedUser) return message.reply("That user could not be found on the Discord Server. Please try again.\nYou need to use the \`!host\` command to bring up the host options again.")
                          Member.send(`Are you sure you want to kick <@${selectedUser.id}>?`).then((msg1) => {
                            Promise.all([
                              msg1.react('✅'),
                              msg1.react('❌')
                            ])
                            const filter = (reaction, user) => {
                              return ['✅', '❌'].includes(reaction.emoji.name) && user.id === Member.id;
                            };
                            const collector = msg1.createReactionCollector(filter, { time: 180000 });
                            collector.on('collect', reaction => {
                              if (reaction.emoji.name === '✅') {
                                if (selectedUser.voice.channelID === Member.voice.channelID) {
                                  selectedUser.voice.setChannel(config.lobby_VC_ID);
                                } else {
                                  Member.send("You cannot kick a user that is not in your Voice Channel.\nYou need to use the \`!host\` command to bring up the host options again.")
                                }
                              }
                              if (reaction.emoji.name === '❌') {
                                msg1.edit("Cancelled User Kicking");
                                Member.send(`Cancelled User Kicking\nYou need to use the \`!host\` command to bring up the host options again.`)
                                return;
                              }
                            })
                            collector.on('end', collected => {
                            });
                          })
                            .catch(() => {
                              Member.send('You took too long to respond, cancelled.\nYou need to use the \`!host\` command to bring up the host options again.');
                            });
                        })
                    })
                  }
                })
              })
            }
          })
        }
      })
      break;
    case 'create':
      const Guild = client.guilds.cache.get(config.guildid);
      const Member = Guild.members.cache.get(message.author.id);
        if (message.guild === null) {
          if (!Member.voice.channel) return message.reply("You need to be in the \"Lobby VC\" to be able to queue or rejoin a game.")
          if (Member.voice.channel.id === config.lobby_VC_ID) {
            Guild.channels.create(Math.random().toString(16).substring(2, 6) + Math.random().toString(16).substring(2, 6), {
              type: 'voice'
            }).then((chan) => {
              chan.setParent(config.private_VC_Category_ID).then((chan2) => {
                var rol = Guild.roles.cache.find(r => r.name === "@everyone");
                chan2.createOverwrite(rol, {
                  'CREATE_INSTANT_INVITE': false, 'VIEW_CHANNEL': false,
                  'CONNECT': false, 'SPEAK': true
                });
                Member.voice.setChannel(chan2.id);
                con.query(`INSERT INTO private (channelid, roomcode, userid) VALUES ('${chan2.id}', '${chan2.name}', '${message.author.id}')`);
                const embed = new MessageEmbed()
                  .setTitle("Private Voice Channel has been created")
                  .setDescription(`Your room code is \`${chan2.name}\`\nTo invite other users, you'll need to get them to join the Lobby VC, then to message __this__ bot with the command: \`!join [ROOMCODE]\`.`)
                Member.send(embed);
                const embed1 = new MessageEmbed()
                  .setTitle(`Room Options`)
                  .setDescription(`🔄 : Change Room Code\n⛔ : Kick a User\n\n*To close the room, leave the Voice Channel.*\n\nIf the reactions stop working, you can use \`!host\` to open the options menu again.`)
                Member.send(embed1).then((msg) => {
                  Promise.all([
                    msg.react('🔄'),
                    msg.react('⛔')
                  ])
                  const filter = (reaction, user) => {
                    return ['🔄', '⛔'].includes(reaction.emoji.name) && user.id === Member.id;
                  };
                  const collector = msg.createReactionCollector(filter, { time: 180000 });
                  collector.on('collect', reaction => {
                    if (reaction.emoji.name === '🔄') {
                      con.query(`SELECT * FROM private WHERE userid = '${message.author.id}'`, (err, rows) => {
                        let channelset = Guild.channels.cache.find(c => c.id === rows[0].channelid);
                        channelset.setName(Math.random().toString(16).substring(2, 6) + Math.random().toString(16).substring(2, 6)).then((newchan) => {
                          con.query(`UPDATE private SET roomcode = '${newchan.name}'`);
                          Member.send(`Your new room code is now \`${newchan.name}\`\nYou need to use the \`!host\` command to bring up the host options again.`)
                        })
                      })
                    }
                    if (reaction.emoji.name === '⛔') {
                      Member.send("Which User did you want to kick from the Voice Channel (Send their Discord User ID)?").then(() => {
                        const filter = m => Member.id === m.author.id;
  
                        message.channel.awaitMessages(filter, { time: 60000, max: 1, errors: ['time'] })
                          .then(messages => {
                            let selectedUser = Guild.members.cache.find(u => u.id === `${messages.first().content}`);
                            if (!selectedUser) return message.reply("That user could not be found on the Discord Server. Please try again.\nYou need to use the \`!host\` command to bring up the host options again.")
                            Member.send(`Are you sure you want to kick <@${selectedUser.id}>?`).then((msg1) => {
                              Promise.all([
                                msg1.react('✅'),
                                msg1.react('❌')
                              ])
                              const filter = (reaction, user) => {
                                return ['✅', '❌'].includes(reaction.emoji.name) && user.id === Member.id;
                              };
                              const collector = msg1.createReactionCollector(filter, { time: 180000 });
                              collector.on('collect', reaction => {
                                if (reaction.emoji.name === '✅') {
                                  if (selectedUser.voice.channelID === Member.voice.channelID) {
                                    selectedUser.voice.setChannel(config.lobby_VC_ID);
                                  } else {
                                    Member.send("You cannot kick a user that is not in your Voice Channel.\nYou need to use the \`!host\` command to bring up the host options again.")
                                  }
                                }
                                if (reaction.emoji.name === '❌') {
                                  msg1.edit("Cancelled User Kicking");
                                  Member.send(`Cancelled User Kicking\nYou need to use the \`!host\` command to bring up the host options again.`)
                                  return;
                                }
                              })
                              collector.on('end', collected => {
                              });
                            })
                              .catch(() => {
                                Member.send('You took too long to respond, cancelled.\nYou need to use the \`!host\` command to bring up the host options again.');
                              });
                          })
                      })
                    }
                  })
                })
              })
            })
          } else {
            Member.send("You need to be in the Lobby VC to be able to create Private Voice Channels.")
          }
        } else {
          message.channel.send("This bot only operates in Direct Messages");
        }
      break;
  }
});

client.on('voiceStateUpdate', (oldState, newState) => {
  conMul.query(`SELECT * FROM private WHERE channelid = '${oldState.channelID}'; SET @count = found_rows(); SELECT @count AS 'count';`, [1, 2, 3], function (err, results, count) {
    if (util.inspect(results[0].length) === "0") {
      return;
    } else {
      con.query(`SELECT * FROM private WHERE channelid = '${oldState.channelID}'`, (err, rows) => {
        if (err) throw err;
        if (oldState.id === rows[0].userid) {
          const Guild = client.guilds.cache.get(config.guildid);
          let channeldel = Guild.channels.cache.find(c => c.id === rows[0].channelid);
          con.query(`DELETE FROM private WHERE userid = '${oldState.id}'`)
          channeldel.delete();
        } else {
          return;
        }
      });
    }
  })
});

client.login(config.token);