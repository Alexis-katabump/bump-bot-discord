import { MessageFlags, PermissionFlagsBits } from 'discord.js';

export default {
    name: 'bump_toggle',
    description: 'Activer ou désactiver le bot sur ce serveur (admin uniquement).',
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

        serverData.enabled = !serverData.enabled;
        markDataChanged();
        
        interaction.reply({
            content: `🤖 Le bot est maintenant ${serverData.enabled ? '<:Valider:1343303723853676606> activé' : '<:Erreur:1343303750336385185> désactivé'}.`,
            flags: [MessageFlags.Ephemeral]
        });
    }
};
