require("dotenv").config();
const {
  Client,
  GatewayIntentBits,
  REST,
  Routes,
  SlashCommandBuilder
} = require("discord.js");

const client = new Client({
  intents: [GatewayIntentBits.Guilds]
});

// ===== COMANDO /falar =====
const commands = [
  new SlashCommandBuilder()
    .setName("falar")
    .setDescription("Faz o bot falar uma mensagem")
    .addStringOption(option =>
      option
        .setName("mensagem")
        .setDescription("Mensagem para o bot enviar")
        .setRequired(true)
    )
    .toJSON()
];

// REGISTRAR COMANDO
const rest = new REST({ version: "10" }).setToken(process.env.TOKEN);

client.once("ready", async () => {
  console.log(`✅ Logado como ${client.user.tag}`);

  try {
    await rest.put(
      Routes.applicationCommands(client.user.id),
      { body: commands }
    );

    console.log("✅ Slash command registrado!");
  } catch (err) {
    console.error(err);
  }
});

// INTERAÇÃO DO COMANDO
client.on("interactionCreate", async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  if (interaction.commandName === "falar") {
    const msg = interaction.options.getString("mensagem");

    // deleta a interação (pra ficar "limpo")
    await interaction.deferReply({ ephemeral: true });
    await interaction.deleteReply().catch(() => {});

    // envia a mensagem no chat
    await interaction.channel.send(msg);
  }
});

client.login(process.env.TOKEN);
