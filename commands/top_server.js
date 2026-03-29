import { EmbedBuilder, MessageFlags, AttachmentBuilder } from 'discord.js';
import { generateBarChart } from '../utils/chart.js';

export default {
    name: 'top_server',
    description: 'Voir les meilleurs serveurs bumpés.',
    setDMPermission: false,
    async execute(interaction, { client, data }) {
        if (!data || !data.servers) {
            return interaction.reply({
                content: '<:Erreur:1343303750336385185> Les données ne sont pas disponibles pour le moment.',
                flags: [MessageFlags.Ephemeral]
            });
        }

        const totalAdViews = Object.values(data.servers).reduce((acc, serverConfig) => acc + (serverConfig.adViews || 0), 0);
        const topServers = Object.entries(data.servers)
            .filter(([serverId, serverConfig]) => !isNaN(serverConfig.bumpCount) && !isNaN(serverConfig.voteCount))
            .sort((a, b) => ((b[1].bumpCount || 0) + (b[1].voteCount || 0)) - ((a[1].bumpCount || 0) + (a[1].voteCount || 0)))
            .slice(0, 10);

        const labels = topServers.map(([serverId], index) => `#${index + 1} ${client.guilds.cache.get(serverId)?.name || 'Serveur inconnu'}`);
        const dataPoints = topServers.map(([, serverConfig]) => serverConfig.bumpCount || 0);

        const chartBuffer = await generateBarChart(labels, dataPoints, 'Top Serveurs par Bumps');
        const attachment = new AttachmentBuilder(chartBuffer, { name: 'chart.png' });

        const embed = new EmbedBuilder()
            .setTitle('🏆 Top 10 Meilleurs Serveurs')
            .setDescription(topServers.map(([serverId, serverConfig], index) => {
                const guild = client.guilds.cache.get(serverId);
                const memberCount = guild ? guild.memberCount : 'N/A';
                const inviteLink = serverConfig.inviteLink || '#';
                const reputation = totalAdViews > 0 ? ((serverConfig.adViews / totalAdViews) * 100).toFixed(2) : 0;
                return `${index + 1}. **${guild?.name || 'Serveur inconnu'}**\nID du serveur: ${serverId}\nUtilisateurs: **${memberCount}**\nBump(s): **${serverConfig.bumpCount || 0}**\nVote(s): **${serverConfig.voteCount || 0}**\nRéputation: **${reputation}%**\n[Rejoindre le serveur](${inviteLink})`;
            }).join('\n\n'))
            .setTimestamp()
            .setColor('#FFD700')
            .setImage('attachment://chart.png');

        await interaction.reply({ embeds: [embed], files: [attachment], flags: [MessageFlags.Ephemeral] });
    }
};
