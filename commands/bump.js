import { EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder, MessageFlags, PermissionFlagsBits } from 'discord.js';
import schedule from 'node-schedule';
import { getCurrentTimestamp, isOnCooldown, getRemainingCooldownTime, formatRemainingTime } from '../utils/time.js';

const BUMP_COOLDOWN = 3600000; // 1 heure
const bumpQueue = [];
const MAX_CONCURRENT_BUMPS = 5;
let currentBumps = 0;
let queueEmbedMessage = null;

export default {
    name: 'bump',
    description: 'Envoyer un bump à tous les serveurs connectés.',
    setDMPermission: false,
    async execute(interaction, { client, data, markDataChanged }) {
        const guildId = interaction.guildId;
        const user = interaction.user;
        const serverData = data.servers[guildId];

        if (!serverData.bumpChannel) {
            return interaction.reply({ content: '<:Erreur:1343303750336385185> Le salon de bump n\'est pas configuré.', flags: [MessageFlags.Ephemeral] });
        }

        if (isOnCooldown(serverData.lastBump || 0, BUMP_COOLDOWN)) {
            const remainingTime = getRemainingCooldownTime(serverData.lastBump || 0, BUMP_COOLDOWN);
            const formattedTime = formatRemainingTime(remainingTime);
            return interaction.reply({
                content: `<:Erreur:1343303750336385185> Vous devez attendre encore ${formattedTime} avant de pouvoir bump à nouveau.`,
                flags: [MessageFlags.Ephemeral]
            });
        }

        bumpQueue.push({ interaction, serverData, user, guildId, cooldown: BUMP_COOLDOWN, client, data, markDataChanged });
        markDataChanged();
        processBumpQueue();
    }
};

async function processBumpQueue() {
    if (currentBumps >= MAX_CONCURRENT_BUMPS || bumpQueue.length === 0) return;
    const { interaction, serverData, user, guildId, cooldown, client, data, markDataChanged } = bumpQueue.shift();
    currentBumps++;
    try {
        await sendBump(interaction, serverData, user, guildId, cooldown, client, data, markDataChanged);
    } finally {
        currentBumps--;
        processBumpQueue();
    }
}

async function sendBump(interaction, serverData, user, guildId, cooldown, client, data, markDataChanged) {
    const now = getCurrentTimestamp();
    const guild = client.guilds.cache.get(guildId);
    let badge = 'Aucun';
    let badgeEmoji = '❌';
    let nextBadgeThreshold = 10;
    let currentBadgeThreshold = 0;

    if (serverData.bumpCount >= 10 && serverData.bumpCount < 100) {
        badge = 'Promoteur Junior';
        badgeEmoji = '🌱';
        nextBadgeThreshold = 100;
        currentBadgeThreshold = 10;
    } else if (serverData.bumpCount >= 100 && serverData.bumpCount < 1000) {
        badge = 'Promoteur Avancé';
        badgeEmoji = '📢';
        nextBadgeThreshold = 1000;
        currentBadgeThreshold = 100;
    } else if (serverData.bumpCount >= 1000 && serverData.bumpCount < 10000) {
        badge = 'Promoteur Élite';
        badgeEmoji = '🚀';
        nextBadgeThreshold = 10000;
        currentBadgeThreshold = 1000;
    } else if (serverData.bumpCount >= 10000 && serverData.bumpCount < 10010) {
        badge = 'Maître Promoteur';
        badgeEmoji = '👑';
        nextBadgeThreshold = 10010;
        currentBadgeThreshold = 10000;
    } else if (serverData.bumpCount >= 10100) {
        badge = 'Légende de la Promotion';
        badgeEmoji = '🔱';
        nextBadgeThreshold = Infinity;
        currentBadgeThreshold = 10100;
    }

    const bumpForNextBadge = ((serverData.bumpCount - currentBadgeThreshold) / (nextBadgeThreshold - currentBadgeThreshold)) * 100;

    const isPartnered = guild.features.includes('PARTNERED');
    const isVerified = guild.features.includes('VERIFIED');

    const embed = new EmbedBuilder()
        .setTitle(`${isPartnered ? '<:Partner:1349763541531361310>' : ''} ${isVerified ? '<:Verified:1349763531393994823>' : ''} ${guild.name} vient d'être bump !`)
        .setDescription(serverData.description || 'Aucune description fournie.')
        .setImage(serverData.bannerLink || null)
        .setFooter({ text: `Bump par ${user.tag}`, iconURL: user.displayAvatarURL({ dynamic: true }) })
        .setTimestamp()
        .setColor('#00AAFF');

    const serverIconURL = guild.iconURL({ dynamic: true });
    embed.setThumbnail(serverIconURL || null);

    if (badge) {
        embed.addFields({ name: '\u200B', value: '**----------**' });
        embed.addFields({ name: 'Badge du Serveur:', value: `${badgeEmoji} **${badge}**`, inline: true });
        embed.addFields({
            name: 'Évolution du Badge:',
            value: `🔄 **${bumpForNextBadge.toFixed(2)}%**\n${'▰'.repeat(Math.floor(bumpForNextBadge / 10))}${'▱'.repeat(10 - Math.floor(bumpForNextBadge / 10))}`,
            inline: false
        });
    }

    embed.addFields({ name: '🆔 ID du Serveur:', value: `\`\`\`\n${guildId}\n\`\`\``, inline: true });

    const joinButton = new ButtonBuilder()
        .setLabel('Rejoindre ce serveur')
        .setURL(serverData.inviteLink)
        .setStyle(ButtonStyle.Link);

    const addExobumpButton = new ButtonBuilder()
        .setLabel('Ajouter bump')
        .setURL('https://discord.com/discovery/applications/1316463410682007572')
        .setStyle(ButtonStyle.Link);

    const voteExobumpButton = new ButtonBuilder()
        .setLabel('Voter Exobump')
        .setURL('https://discord.ly/exobump')
        .setStyle(ButtonStyle.Link);

    const actionRow = new ActionRowBuilder().addComponents(joinButton, addExobumpButton, voteExobumpButton);

    const bumpChannels = [];
    Object.entries(data.servers).forEach(([server_id, serverConfig]) => {
        if (serverConfig.bumpChannel) {
            const bumpGuild = client.guilds.cache.get(server_id);
            const bumpChannel = bumpGuild?.channels.cache.get(serverConfig.bumpChannel);
            if (bumpChannel && bumpChannel.permissionsFor(client.user).has(PermissionFlagsBits.SendMessages)) {
                bumpChannels.push(bumpChannel);
                serverConfig.adViews = (serverConfig.adViews || 0) + 1;
            }
        }
    });

    for (const bumpChannel of bumpChannels) bumpChannel.send({ embeds: [embed], components: [actionRow] });

    serverData.bumpCount = (serverData.bumpCount || 0) + 1;
    serverData.bumpCountToday = (serverData.bumpCountToday || 0) + 1;
    serverData.bumpCountWeek = (serverData.bumpCountWeek || 0) + 1;
    serverData.bumpCountMonth = (serverData.bumpCountMonth || 0) + 1;
    serverData.lastBump = now;

    if (!serverData.userData[user.id]) serverData.userData[user.id] = { bumpCount: 0, xp: 0, voteCount: 0 };
    serverData.userData[user.id].bumpCount += 1;
    const randomXP = Math.floor(Math.random() * 10) + 1;
    serverData.userData[user.id].xp += randomXP;

    if (serverData.reminders) {
        data.reminders[guildId] = { userId: user.id, timestamp: now };
        schedule.scheduleJob(new Date(now + cooldown), async () => {
            const reminderEmbed = new EmbedBuilder()
                .setTitle('🎉 Hey toi ! c’est l’heure du bump ! 🎉')
                .setDescription("N’oublie pas de **bump ton serveur** pour rester au sommet du classement 🌟 !\n Plus tu bumps, plus ton serveur rayonne 🌍✨ ! \n\n**Tape vite </bump:1322269424832479283> et fais monter la hype ! 🚀🔥**")
                .setFooter({ text: `Notification rappel bump`, iconURL: guild.iconURL({ dynamic: true }) })
                .setTimestamp()
                .setColor('#FF6363');
            const bumpGuild = client.guilds.cache.get(guildId);
            const bumpChannel = bumpGuild?.channels.cache.get(serverData.bumpChannel);
            if (bumpChannel && bumpChannel.permissionsFor(client.user).has(PermissionFlagsBits.SendMessages)) {
                const serverIconURL = bumpGuild.iconURL({ dynamic: true });
                reminderEmbed.setThumbnail(serverIconURL || null);
                bumpChannel.send({ content: `<@${user.id}>`, embeds: [reminderEmbed] });
            }
        });
    }

    const responseEmbed = new EmbedBuilder()
        .setTitle('Bump réussi !')
        .setDescription(`<:Valider:1343303723853676606> Le bump vient d’être envoyé avec succès !\nLe serveur a actuellement un total de **${serverData.bumpCount}** bump(s).\nN’oubliez pas que vous pouvez désactiver les rappels de bump en utilisant la commande </ping_config:1322269424832479284>.\n\nVous avez gagné **${randomXP} XP** !`)
        .setImage('https://i.imgur.com/Qy5DRuq.jpeg')
        .setFooter({ text: `${guild.name}`, iconURL: guild.iconURL({ dynamic: true }) })
        .setTimestamp()
        .setColor('#00AAFF');
    interaction.reply({ embeds: [responseEmbed], flags: [MessageFlags.Ephemeral] });
    markDataChanged();
    updateQueueEmbed(serverData.bumpChannel, client, data);
}

async function updateQueueEmbed(channelId, client, data) {
    const channel = client.channels.cache.get(channelId);
    if (!channel) return;

    if (!data || !data.servers) {
        console.error('⚠️ Les données des serveurs sont manquantes.');
        return;
    }

    const servers = Object.values(data.servers);
    const totalBumps = servers.reduce((acc, server) => acc + (server.bumpCount || 0), 0);
    const totalFailedBumps = 0;
    const totalBumpsAndFailed = totalBumps + totalFailedBumps;
    const successPercentage = totalBumpsAndFailed > 0 ? ((totalBumps / totalBumpsAndFailed) * 100).toFixed(2) : 0;
    const failurePercentage = totalBumpsAndFailed > 0 ? ((totalFailedBumps / totalBumpsAndFailed) * 100).toFixed(2) : 0;

    let embed;
    if (bumpQueue.length > 0) {
        embed = new EmbedBuilder()
            .setDescription(`⏱️ Nombre dans la file d'attente: **${bumpQueue.length}**`)
            .setColor('#00AAFF');
    } else {
        embed = new EmbedBuilder()
            .setDescription(`
        <:Valider:1343303723853676606> Envois réussis: **${successPercentage}%** (${totalBumps} réussis)\t <:Erreur:1343303750336385185> Envois échoués: **${failurePercentage}%** (${totalFailedBumps} échoués)
        `)
            .setColor('#00AAFF');
    }

    try {
        if (queueEmbedMessage && queueEmbedMessage.channelId === channelId) {
            await queueEmbedMessage.edit({ embeds: [embed] });
        } else {
            queueEmbedMessage = await channel.send({ embeds: [embed] });
        }
    } catch (error) {
        console.error('⚠️ Erreur lors de la mise à jour de l\'embed de la file d\'attente:', error);
    }
}
