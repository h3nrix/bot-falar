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

// 🔥 COLOQUE AQUI O ID DO SEU SERVIDOR
const GUILD_ID = "1498051855543173322";

// ===== COMANDO /falar =====
const commands = [
  new SlashCommandBuilder()
    .setName("falar")
    .setDescription("Faz o bot enviar uma mensagem no chat")
    .addStringOption(option =>
      option
        .setName("mensagem")
        .setDescription("Mensagem que o bot vai enviar")
        .setRequired(true)
    )
    .toJSON()
];

const rest = new REST({ version: "10" }).setToken(process.env.TOKEN);

// ===== READY =====
client.once("ready", async () => {
  console.log(`✅ Logado como ${client.user.tag}`);

  try {
    await rest.put(
      Routes.applicationGuildCommands(client.user.id, GUILD_ID),
      { body: commands }
    );

    console.log("✅ Slash command /falar registrado!");
  } catch (err) {
    console.error("❌ Erro ao registrar comandos:", err);
  }
});

// ===== INTERAÇÃO =====
client.on("interactionCreate", async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  if (interaction.commandName === "falar") {
    const msg = interaction.options.getString("mensagem");

    if (!msg) {
      return interaction.reply({
        content: "❌ Você precisa escrever uma mensagem.",
        ephemeral: true
      });
    }

    await interaction.reply({
      content: "✅ Mensagem enviada!",
      ephemeral: true
    });

    await interaction.channel.send(msg);
  }
});

client.login(process.env.TOKEN);
