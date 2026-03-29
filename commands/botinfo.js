import { EmbedBuilder, MessageFlags, version as discordJsVersion } from 'discord.js';

export default {
    name: 'botinfo',
    description: 'Affiche les informations du bot.',
    setDMPermission: false,
    async execute(interaction, { client }) {
        const uptime = process.uptime();
        const days = Math.floor(uptime / 86400);
        const hours = Math.floor((uptime % 86400) / 3600);
        const minutes = Math.floor((uptime % 3600) / 60);
        const seconds = Math.floor(uptime % 60);

        const botPing = Date.now() - interaction.createdTimestamp;
        const apiPing = client.ws.ping;

        const nodeVersion = process.version;

        const embed = new EmbedBuilder()
            .setTitle('📊 Statistiques et Performances du Serveur Exobump')
            .setColor('Blue')
            .addFields(
                { name: '🔧 Node.js Version', value: `\`\`\`${nodeVersion}\`\`\``, inline: true },
                { name: '🔧 Discord.js Version', value: `\`\`\`${discordJsVersion}\`\`\``, inline: true },
                { name: '⏳ Uptime', value: `\`\`\`${days}j ${hours}h ${minutes}m ${seconds}s\`\`\``, inline: false },
                { name: '📡 Connexion', value: `\`\`\`Shard 0/1 | Bot Ping: ${botPing}ms | API Ping: ${apiPing}ms\`\`\``, inline: false },
                { name: '💻 Développeur', value: `\`\`\`${process.env.DEVELOPER}\`\`\``, inline: true },
                { name: '⚙️ Bot Version', value: `\`\`\`${process.env.BOT_VERSION}\`\`\``, inline: true }
            );

        await interaction.reply({ embeds: [embed], flags: [MessageFlags.Ephemeral] });
    }
};
