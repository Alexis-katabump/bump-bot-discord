import { MessageFlags, PermissionFlagsBits } from 'discord.js';

export default {
    name: 'bump_set_channel',
    description: 'Définir le salon où les bumps doivent être envoyés (admin uniquement).',
    setDMPermission: false,
    async execute(interaction, { data, markDataChanged }) {
        if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
            return interaction.reply({
                content: '<:Erreur:1343303750336385185> Vous devez être administrateur pour utiliser cette commande.',
                flags: [MessageFlags.Ephemeral]
            });
        }

        const guildId = interaction.guildId;
        const serverData = data.servers[guildId];
        const channel = interaction.channel;

        serverData.bumpChannel = channel.id;
        markDataChanged();
        
        interaction.reply({ content: '<:Valider:1343303723853676606> Salon de bump configuré avec succès.', flags: [MessageFlags.Ephemeral] });
    }
};
