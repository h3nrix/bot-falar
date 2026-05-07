require('dotenv').config();

const {
  Client,
  GatewayIntentBits,
  REST,
  Routes,
  SlashCommandBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  MessageFlags
} = require('discord.js');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildVoiceStates
  ]
});

// ===== CONFIG =====

const CARGO_PERMITIDO = '1498092130424328304';

const ESPERA_ID = '1499854696826015762';
const TEAM_1_ID = '1498265579759337532';
const TEAM_2_ID = '1498265612298883142';

const mapas = ['Mirage', 'Inferno', 'Dust2', 'Anubis', 'Vertigo'];

// ===== REGISTRAR COMANDO (INSTANTÂNEO NO SERVIDOR) =====

const commands = [
  new SlashCommandBuilder()
    .setName('lan')
    .setDescription('Divide times e inicia votação')
].map(cmd => cmd.toJSON());

const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);

(async () => {
  try {
    console.log('Registrando comando...');
    await rest.put(
      Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID),
      { body: commands }
    );
    console.log('Comando registrado!');
  } catch (err) {
    console.error(err);
  }
})();

// ===== BOT ONLINE =====

client.once('ready', () => {
  console.log(`Logado como ${client.user.tag}`);
});

// ===== SISTEMA =====

client.on('interactionCreate', async (interaction) => {

  // ===== COMANDO =====
  if (interaction.isChatInputCommand()) {
    if (interaction.commandName === 'lan') {

      await interaction.deferReply();

      const member = interaction.member;

      if (!member.roles.cache.has(CARGO_PERMITIDO)) {
        return interaction.editReply('Você não tem permissão!');
      }

      const canal = member.voice.channel;

      if (!canal || canal.id !== ESPERA_ID) {
        return interaction.editReply('Entre na call de ESPERA!');
      }

      const team1 = interaction.guild.channels.cache.get(TEAM_1_ID);
      const team2 = interaction.guild.channels.cache.get(TEAM_2_ID);

      let membros = Array.from(canal.members.values());
      membros = membros.filter(m => !m.user.bot);

      if (membros.length < 2) {
        return interaction.editReply('Precisa de pelo menos 2 pessoas.');
      }

      // embaralhar
      membros.sort(() => Math.random() - 0.5);

      const metade = Math.ceil(membros.length / 2);

      const t1 = membros.slice(0, metade);
      const t2 = membros.slice(metade);

      console.log('Divisão:', t1.length, t2.length);

      // mover membros (seguro)
      await Promise.all(t1.map(m =>
        m.voice.setChannel(team1).catch(() => {
          console.log('Erro ao mover T1:', m.user.username);
        })
      ));

      await Promise.all(t2.map(m =>
        m.voice.setChannel(team2).catch(() => {
          console.log('Erro ao mover T2:', m.user.username);
        })
      ));

      await interaction.editReply({
        content:
          `?? **Times sorteados!**\n\n` +
          `?? Team 1:\n${t1.map(m => m.user.username).join('\n')}\n\n` +
          `?? Team 2:\n${t2.map(m => m.user.username).join('\n')}`
      });

      // ===== VOTAÇÃO =====

      const votos = new Map(); // ?? 1 voto por pessoa

      const row = new ActionRowBuilder().addComponents(
        mapas.map(mapa =>
          new ButtonBuilder()
            .setCustomId(`voto_${mapa}`)
            .setLabel(mapa)
            .setStyle(ButtonStyle.Primary)
        )
      );

      const msg = await interaction.followUp({
        content: '??? Vote no mapa (30s):',
        components: [row]
      });

      const collector = msg.createMessageComponentCollector({
        time: 30000
      });

      collector.on('collect', async (i) => {
        if (!i.customId.startsWith('voto_')) return;

        const mapa = i.customId.replace('voto_', '');

        // ?? bloqueia voto duplicado
        if (votos.has(i.user.id)) {
          return i.reply({
            content: '? Você já votou!',
            flags: MessageFlags.Ephemeral
          });
        }

        votos.set(i.user.id, mapa);

        await i.reply({
          content: `? Você votou em **${mapa}**`,
          flags: MessageFlags.Ephemeral
        });
      });

      collector.on('end', async () => {
        const contagem = {};

        for (const voto of votos.values()) {
          contagem[voto] = (contagem[voto] || 0) + 1;
        }

        const vencedor = Object.entries(contagem)
          .sort((a, b) => b[1] - a[1])[0];

        if (!vencedor) {
          return msg.edit({
            content: 'Ninguém votou ??',
            components: []
          });
        }

        msg.edit({
          content: `?? **Mapa escolhido: ${vencedor[0]}** (${vencedor[1]} votos)`,
          components: []
        });

        console.log('Votação finalizada:', contagem);
      });
    }
  }
});

client.login(process.env.TOKEN);