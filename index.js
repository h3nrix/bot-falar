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

// ===== COMANDO SIMPLES /falar =====
const commands = [
  new SlashCommandBuilder()
    .setName("falar")
    .setDescription("Faz o bot falar")
    .addStringOption(option =>
      option
        .setName("mensagem")
        .setDescription("Mensagem do bot")
        .setRequired(true)
    )
    .toJSON()
];

const rest = new REST({ version: "10" }).setToken(process.env.TOKEN);

client.once("ready", async () => {
  console.log(`✅ Logado como ${client.user.tag}`);

  try {
    // REGISTRA OS COMANDOS GLOBALMENTE
    await rest.put(
      Routes.applicationGuildCommands(1498051855543173322)
      { body: commands }
    );

    console.log("✅ Slash command registrado!");
  } catch (err) {
    console.error("Erro ao registrar comando:", err);
  }
});

client.on("interactionCreate", async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  if (interaction.commandName === "falar") {
    const msg = interaction.options.getString("mensagem");

    // envia direto no canal
    await interaction.reply({ content: "✅ Mensagem enviada!", ephemeral: true });
    await interaction.channel.send(msg);
  }
});

client.login(process.env.TOKEN);
