import { EmbedBuilder, MessageFlags, PermissionFlagsBits } from 'discord.js';

export default {
    name: 'bump_preview',
    description: 'Voir un aperçu du bump (admin uniquement).',
    setDMPermission: false,
    async execute(interaction, { client, data }) {
        if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
            return interaction.reply({
                content: '<:Erreur:1343303750336385185> Vous devez être administrateur pour utiliser cette commande.',
                flags: [MessageFlags.Ephemeral]
            });
        }
        
        const guildId = interaction.guildId;
        const serverData = data.servers[guildId];
        const guild = client.guilds.cache.get(guildId);
        
        const embed = new EmbedBuilder()
            .setTitle(`Prévisualisation du bump pour ${guild.name}`)
            .setDescription(serverData.description || 'Aucune description fournie.')
            .setImage(serverData.bannerLink || null)
            .setFooter({ text: `Prévisualisation du bump`, iconURL: guild.iconURL({ dynamic: true }) })
            .setTimestamp()
            .setColor('#7289DA');
            
        const serverIconURL = guild.iconURL({ dynamic: true });
        embed.setThumbnail(serverIconURL || null);
        
        interaction.reply({ content: '✨ Découvrez un aperçu du bump :', embeds: [embed], flags: [MessageFlags.Ephemeral] });
    }
};
