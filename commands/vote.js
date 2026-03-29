import { EmbedBuilder, MessageFlags } from 'discord.js';
import { getCurrentTimestamp, isOnCooldown, getRemainingCooldownTime, formatRemainingTime } from '../utils/time.js';

const VOTE_COOLDOWN = 86400000; // 24 heures

export default {
    name: 'vote',
    description: 'Voter pour le serveur.',
    async execute(interaction, { data, markDataChanged }) {
        const user = interaction.user;
        const guildId = interaction.guildId;
        const serverData = data.servers[guildId];
        const now = getCurrentTimestamp();

        if (isOnCooldown(serverData.lastVote || 0, VOTE_COOLDOWN)) {
            const remainingTime = getRemainingCooldownTime(serverData.lastVote || 0, VOTE_COOLDOWN);
            const formattedTime = formatRemainingTime(remainingTime);
            return interaction.reply({
                content: `<:Erreur:1343303750336385185> Vous devez attendre encore ${formattedTime} avant de pouvoir voter à nouveau.`,
                flags: [MessageFlags.Ephemeral]
            });
        }

        serverData.voteCount = (serverData.voteCount || 0) + 1;
        serverData.lastVote = now;
        if (!serverData.userData[user.id]) serverData.userData[user.id] = { bumpCount: 0, xp: 0, voteCount: 0 };
        serverData.userData[user.id].voteCount += 1;
        markDataChanged();

        const responseEmbed = new EmbedBuilder()
            .setTitle('Vote réussi !')
            .setDescription(`<:Valider:1343303723853676606> Le vote vient d’être enregistré avec succès !\nLe serveur a actuellement un total de **${serverData.voteCount}** vote(s).`)
            .setImage('https://i.imgur.com/8a9Mc6F.jpeg')
            .setFooter({ text: `${interaction.guild.name}`, iconURL: interaction.guild.iconURL({ dynamic: true }) })
            .setTimestamp()
            .setColor('#00AAFF');
            
        interaction.reply({ embeds: [responseEmbed], flags: [MessageFlags.Ephemeral] });
    }
};
