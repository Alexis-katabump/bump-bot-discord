import { EmbedBuilder, MessageFlags } from 'discord.js';

export default {
    name: 'help',
    description: 'Affiche la liste des commandes disponibles.',
    setDMPermission: false,
    async execute(interaction, { commandsArray }) {
        const embed = new EmbedBuilder()
            .setTitle('📜 Liste des commandes disponibles')
            .setDescription('Voici la liste des commandes que vous pouvez utiliser avec ce bot :')
            .setColor('#00AAFF')
            .setTimestamp();

        commandsArray.forEach(command => {
            let permissions = '👤 Utilisateur';
            if (command.name === 'bump_toggle' || command.name === 'bump_config' || command.name === 'bump_set_channel' || command.name === 'bump_preview') {
                permissions = '🛡️ Admin';
            }
            embed.addFields({ name: `🔹 /${command.name}`, value: `📝 **Description:** ${command.description}\n🔑 **Permissions:** ${permissions}` });
        });

        interaction.reply({ embeds: [embed], flags: [MessageFlags.Ephemeral] });
    }
};
