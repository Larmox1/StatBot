console.log("Запуск...");
const { Client, GatewayIntentBits, EmbedBuilde, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
const { GameDig } = require("gamedig");
const QuickChart = require("quickchart-js");
const cfg = require("./config.json");

const client = new Client({ "intents": [GatewayIntentBits.Guilds] });

var interval;
var online = [];
var time = [];
var link;

async function clearOldMessages(channel, nbr) {
  try {
    var msgs = await channel.messages.fetch({ limit: 99 });
    let i = 0;
    for (var msg of msgs.values()) {
      if (i >= nbr) await msg.delete().catch(() => { });
      i += 1;
    }
  } catch (error) {
    console.error("error while deleting old status messages:\n", error.message);
  }
}

async function genStatsImg() {
  var myChart = new QuickChart();
  myChart.setConfig({ type: "line", data: { labels: time, datasets: [{ label: "Онлайн", data: online }] } });
  myChart.setWidth(800);
  myChart.setHeight(400);
  myChart.setBackgroundColor("#ffffff");
  link = await myChart.getShortUrl();
}

async function createNewSendMessage(channelId) {
  try {
    var channel = client.channels.cache.get(channelId);
    var guild = client.guilds.cache.get(channel.guildId);
    var statusEmbed = new EmbedBuilder()
      .setAuthor({ "name": "Информация:" })
      .setThumbnail(guild.iconURL())
      .addFields([
        { "name": "**Айпи:**", "value": "**` lamashield.ru:10009 `**", "inline": true },
        { "name": "**Игра:**", "value": "**` Minecraft JAVA `**" }
      ])
      .setFooter({ "text": "[⚫]  Обновляется каждые 60 сек." })
      .setTimestamp();
      var button = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
        .setCustomId("reload")
        .setLabel("Обновить")
        .setStyle(ButtonStyle.Primary)
        .setEmoji("🔄"));
      await GameDig.query({
      "type": "minecraft",
      "host": cfg.host,
      "port": cfg.port,
      "maxAttempts": 5,
      "socketTimeout": 1000,
      "debug": false
    }).then(async (r) => {
      if (time.length >= 25 && online.length >= 25) { time = []; online = []; }
      time.push(`${new Date().toString().split(" ")[4].substring(":", 5)}`);
      online.push(r.numplayers);
      await genStatsImg();
      client.user.setActivity({ "name": `за онлайном. ${r.numplayers}/${r.maxplayers}`, "type": 3 });
      statusEmbed.setTitle(`**${cfg.name} - ${cfg.version}**`);
      statusEmbed.setColor(0x40eb34);
      statusEmbed.setImage(link);
      statusEmbed.addFields([
        { "name": "**Статус:**", "value": "**`[💚] Онлайн `**", "inline": true },
        { "name": "**Онлайн:**", "value": `**\` ${r.numplayers}/${r.maxplayers} \`**`, "inline": true }
      ]);
      await clearOldMessages(channel, 0);
      await channel.send({ "embeds": [statusEmbed], "components": [button] });
    }).catch(async (e) => {
      if (time.length >= 25 && online.length >= 25) { time = []; online = []; }
      time.push(`${new Date().toString().split(" ")[4].substring(":", 5)}`);
      online.push(0);
      await genStatsImg()
      client.user.setActivity({ "name": `за онлайном. 0/0`, "type": 3 });
      statusEmbed.setTitle(`**${cfg.name} - ${cfg.version}**`);
      statusEmbed.setColor(0xeb3434);
      statusEmbed.setImage(link);
      statusEmbed.addFields([
        { "name": "**Статус:**", "value": "**`[💔] Оффлайн `**", "inline": true },
        { "name": "**Онлайн:**", "value": `**\` 0/0 \`**`, "inline": true }
      ]);
      await clearOldMessages(channel, 0);
      await channel.send({ "embeds": [statusEmbed], "components": [button] });
    });
  } catch (e) {
    console.log(e);
  }
}

client.on("ready", () => {
  client.user.setActivity({ "name": "за онлайном. ?/?", "type": 3 });
  client.user.setStatus("idle");
  interval = setInterval(() => createNewSendMessage(cfg.channelId), 60000);
  createNewSendMessage(cfg.channelId);
  console.log(`Бот запущен на клиенте - "${client.user.username}".`);
});

client.on("interactionCreate", (i) => {
  try {
    if (!i.isButton()) return;
    if (i.customId === "reload") {
      clearInterval(interval);
      interval = setInterval(() => createNewSendMessage(cfg.channelId), 60000);
      createNewSendMessage(cfg.channelId);
    }
  } catch (e) {
    console.log(e);
  }
});

client.login(cfg.token).then(() => console.log(`Бот залогинен.`));