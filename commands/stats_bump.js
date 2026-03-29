import { EmbedBuilder, MessageFlags, AttachmentBuilder } from 'discord.js';
import { generateBarChart } from '../utils/chart.js';
import { getCurrentTimestamp } from '../utils/time.js';

export default {
    name: 'stats_bump',
    description: 'Afficher les statistiques détaillées des bumps.',
    setDMPermission: false,
    async execute(interaction, { data }) {
        if (!data || !data.servers) {
            return interaction.reply({
                content: '<:Erreur:1343303750336385185> Les données ne sont pas disponibles pour le moment.',
                flags: [MessageFlags.Ephemeral]
            });
        }

        const now = getCurrentTimestamp();
        const oneDay = 24 * 60 * 60 * 1000;
        const oneWeek = 7 * oneDay;
        const oneMonth = 30 * oneDay;
        const stats = {
            totalBumps: 0, totalBumpsToday: 0, totalBumpsWeek: 0, totalBumpsMonth: 0, totalAdViews: 0, totalVotes: 0, serverCount: 0
        };

        for (const server of Object.values(data.servers)) {
            if (server.bumpCount > 0) {
                stats.serverCount++;
                stats.totalBumps += server.bumpCount || 0;
                stats.totalAdViews += server.adViews || 0;
                stats.totalVotes += server.voteCount || 0;

                if (server.lastBump) {
                    const timeDiff = now - server.lastBump;
                    if (timeDiff <= oneDay) stats.totalBumpsToday += server.bumpCountToday || 0;
                    if (timeDiff <= oneWeek) stats.totalBumpsWeek += server.bumpCountWeek || 0;
                    if (timeDiff <= oneMonth) stats.totalBumpsMonth += server.bumpCountMonth || 0;
                }
            }
        }

        const averageBumps = stats.serverCount > 0 ? (stats.totalBumps / stats.serverCount).toFixed(2) : "0.00";

        const labels = ['Aujourd\'hui', 'Cette semaine', 'Ce mois-ci'];
        const dataPoints = [stats.totalBumpsToday, stats.totalBumpsWeek, stats.totalBumpsMonth];
        const chartBuffer = await generateBarChart(labels, dataPoints, 'Bumps par période');
        const attachment = new AttachmentBuilder(chartBuffer, { name: 'chart.png' });

        const embed = new EmbedBuilder()
            .setTitle('📈 Analyse Des Statistiques Détaillées')
            .setDescription(`
            **Statistiques Globales:**
            Serveurs actifs: **${stats.serverCount.toLocaleString()}**
            Total des bumps: **${stats.totalBumps.toLocaleString()}**
            Total des votes: **${stats.totalVotes.toLocaleString()}**
            Total des vues publicitaires: **${stats.totalAdViews.toLocaleString()}**

            **Activité Récente:**
            Bumps aujourd'hui: **${stats.totalBumpsToday.toLocaleString()}**
            Bumps cette semaine: **${stats.totalBumpsWeek.toLocaleString()}**
            Bumps ce mois-ci: **${stats.totalBumpsMonth.toLocaleString()}**

            **Moyenne:**
            Moyenne de bumps par serveur: **${averageBumps}**
            `)
            .setColor('#00AAFF')
            .setTimestamp()
            .setImage('attachment://chart.png');

        await interaction.reply({ embeds: [embed], files: [attachment], flags: [MessageFlags.Ephemeral] });
    }
};
