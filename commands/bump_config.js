import { ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder, MessageFlags, PermissionFlagsBits } from 'discord.js';

export default {
    name: 'bump_config',
    description: 'Configurer la description et le lien bannière (admin uniquement).',
    setDMPermission: false,
    async execute(interaction) {
        if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
            return interaction.reply({
                content: '<:Erreur:1343303750336385185> Vous devez être administrateur pour utiliser cette commande.',
                flags: [MessageFlags.Ephemeral]
            });
        }
        const modal = new ModalBuilder()
            .setCustomId('bumpConfigModal')
            .setTitle('Configurer le Bump');
            
        const descriptionInput = new TextInputBuilder()
            .setCustomId('description')
            .setLabel("Description du bump")
            .setPlaceholder("Insérez la description du bump")
            .setStyle(TextInputStyle.Paragraph)
            .setMaxLength(2000)
            .setRequired(true);
            
        const bannerInput = new TextInputBuilder()
            .setCustomId('banner')
            .setLabel('Lien de la bannière (optionnel)')
            .setPlaceholder("Insérez le lien de l'image de bannière (optionnel)")
            .setStyle(TextInputStyle.Short)
            .setRequired(false);
            
        const row1 = new ActionRowBuilder().addComponents(descriptionInput);
        const row2 = new ActionRowBuilder().addComponents(bannerInput);
        modal.addComponents(row1, row2);
        
        await interaction.showModal(modal);
    },
    
    async executeModal(interaction, { data, markDataChanged }) {
        const guildId = interaction.guildId;
        const serverData = data.servers[guildId];
        const description = interaction.fields.getTextInputValue('description').trim();
        const bannerLink = interaction.fields.getTextInputValue('banner').trim();

        if (description.length < 400) {
            return interaction.reply({ content: '<:Erreur:1343303750336385185> La description doit contenir au moins 400 caractères.', flags: [MessageFlags.Ephemeral] });
        }

        const forbiddenDomainsRegex = /\bhttps?:\/\/(?:[^\s/$.?#]+\.)?(iplogger?|bitly|tinyurl|goo\.gl|ow\.ly|t\.co|is\.gd|buff\.ly|adf\.ly|tiny\.cc|lnkd\.in|db\.tt|qr\.ae|adfoc\.us|bit\.do|tiny\.pl|cur\.lv|ity\.im|q\.gs|po\.st|bc\.vc|twitthis\.com|u\.to|j\.mp|buzurl\.com|cutt\.us|u\.bb|yourls\.org|x\.co|prettylinkpro\.com|scrnch\.me|filoops\.info|vzturl\.com|qr\.net|1url\.com|tweez\.me|v\.gd|tr\.im|link\.zip\.net|pornhub\.com|xvideos\.com|redtube\.com|youporn\.com|xnxx\.com|porn\.com|xhamster\.com|tube8\.com|beeg\.com|spankbang\.com)\b[^\s]*/;

        function extractLinks(text) {
            const urlRegex = /https?:\/\/[^\s]+/g;
            return text.match(urlRegex) || [];
        }

        const descriptionLinks = extractLinks(description);
        const allLinks = [...descriptionLinks, bannerLink].filter(Boolean);

        for (const link of allLinks) {
            if (forbiddenDomainsRegex.test(link)) {
                return interaction.reply({ content: '<:Erreur:1343303750336385185> Le lien fourni est interdit.', flags: [MessageFlags.Ephemeral] });
            }
        }

        if (bannerLink && !/^https?:\/\/.+/.test(bannerLink)) {
            return interaction.reply({ content: '<:Erreur:1343303750336385185> Le lien de la bannière n\'est pas valide.', flags: [MessageFlags.Ephemeral] });
        }

        serverData.description = description;
        serverData.bannerLink = bannerLink;
        markDataChanged();
        
        interaction.reply({ content: '<:Valider:1343303723853676606> Configuration mise à jour avec succès.', flags: [MessageFlags.Ephemeral] });
    }
};
