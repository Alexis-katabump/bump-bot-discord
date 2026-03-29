import { EmbedBuilder, MessageFlags, AttachmentBuilder } from 'discord.js';
import { generateBarChart } from '../utils/chart.js';

export default {
    name: 'top_user',
    description: 'Voir les meilleurs utilisateurs bumpers.',
    setDMPermission: false,
    async execute(interaction, { client, data }) {
        const guildId = interaction.guildId;
        if (!data || !data.servers || !data.servers[guildId] || !data.servers[guildId].userData) {
            return interaction.reply({
                content: '<:Erreur:1343303750336385185> Les données ne sont pas disponibles pour le moment.',
                flags: [MessageFlags.Ephemeral]
            });
        }

        const serverData = data.servers[guildId];
        const topUsers = Object.entries(serverData.userData)
            .map(([userId, userData]) => {
                const totalBumps = userData.bumpCount || 0;
                const xp = userData.xp || 0;
                const totalVotes = userData.voteCount || 0;
                return [userId, totalBumps, xp, totalVotes];
            })
            .filter(([userId, totalBumps]) => !isNaN(totalBumps))
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10);

        const labels = topUsers.map(([userId], index) => `#${index + 1} ${client.users.cache.get(userId)?.username || 'Inconnu'}`);
        const dataPoints = topUsers.map(([, totalBumps]) => totalBumps);

        const chartBuffer = await generateBarChart(labels, dataPoints, 'Top Utilisateurs par Bumps');
        const attachment = new AttachmentBuilder(chartBuffer, { name: 'chart.png' });

        const embed = new EmbedBuilder()
            .setTitle('🏆 Top 10 Meilleurs Utilisateurs')
            .setDescription(topUsers.map(([userId, totalBumps, xp, totalVotes], index) => {
                const user = client.users.cache.get(userId);
                return `${index + 1}. **${user?.tag || 'Utilisateur inconnu'}**\nID de l'utilisateur: ${userId}\nBump(s): **${totalBumps}**\nVote(s): **${totalVotes}**\nXP: **${xp}**\n[Voir le profil](discord://-/users/${userId})`;
            }).join('\n\n'))
            .setTimestamp()
            .setColor('#FFD700')
            .setImage('attachment://chart.png');

        await interaction.reply({ embeds: [embed], files: [attachment], flags: [MessageFlags.Ephemeral] });
    }
};
