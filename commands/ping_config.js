import { MessageFlags } from 'discord.js';

export default {
    name: 'ping_config',
    description: 'Activer ou désactiver le rappel pour bump.',
    setDMPermission: false,
    async execute(interaction, { data, markDataChanged }) {
        const guildId = interaction.guildId;
        const serverData = data.servers[guildId];

        serverData.reminders = !serverData.reminders;
        markDataChanged();
        
        interaction.reply({
            content: `🕒 Les rappels sont maintenant ${serverData.reminders ? '<:Valider:1343303723853676606> activés' : '<:Erreur:1343303750336385185> désactivés'}.`,
            flags: [MessageFlags.Ephemeral]
        });
    }
};
