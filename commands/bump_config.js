import { 
    EmbedBuilder, 
    ButtonBuilder, 
    ButtonStyle, 
    ActionRowBuilder, 
    ChannelSelectMenuBuilder, 
    ChannelType, 
    MessageFlags, 
    PermissionFlagsBits,
    ModalBuilder,
    TextInputBuilder,
    TextInputStyle
} from 'discord.js';

export default {
    name: 'bump_config',
    description: 'Afficher le panneau de configuration interactif (admin uniquement).',
    setDMPermission: false,
    async execute(interaction, context) {
        if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
            return interaction.reply({
                content: '<:Erreur:1343303750336385185> Vous devez être administrateur pour utiliser cette commande.',
                flags: [MessageFlags.Ephemeral]
            });
        }
        await this.sendDashboard(interaction, context);
    },

    async sendDashboard(interaction, { data }) {
        const guildId = interaction.guildId;
        const serverData = data.servers[guildId];

        const embed = new EmbedBuilder()
            .setTitle('⚙️ Panneau de Configuration Exobump')
            .setColor('#2F3136')
            .setDescription('Gérez les paramètres de votre serveur en un clic.')
            .addFields(
                { name: '🤖 État du bot', value: serverData.enabled ? '✅ Activé' : '❌ Désactivé', inline: true },
                { name: '🔔 Rappels', value: serverData.reminders ? '✅ Activés' : '❌ Désactivés', inline: true },
                { name: '📢 Salon de bump', value: serverData.bumpChannel ? `<#${serverData.bumpChannel}>` : 'Non défini', inline: false },
                { name: '📝 Description', value: serverData.description ? `\`\`\`text\n${serverData.description.length > 300 ? serverData.description.substring(0, 300) + '...' : serverData.description}\n\`\`\`` : 'Aucune description définie.', inline: false }
            );

        if (serverData.bannerLink) {
            embed.setImage(serverData.bannerLink);
        }

        const channelSelect = new ChannelSelectMenuBuilder()
            .setCustomId('bump_config_channel')
            .setPlaceholder('Sélectionner le salon de bump')
            .setChannelTypes(ChannelType.GuildText);

        const row1 = new ActionRowBuilder().addComponents(channelSelect);

        const toggleBotBtn = new ButtonBuilder()
            .setCustomId('bump_config_toggle_bot')
            .setLabel(serverData.enabled ? 'Désactiver le Bot' : 'Activer le Bot')
            .setStyle(serverData.enabled ? ButtonStyle.Danger : ButtonStyle.Success)
            .setEmoji('🤖');

        const toggleRemindersBtn = new ButtonBuilder()
            .setCustomId('bump_config_toggle_reminders')
            .setLabel(serverData.reminders ? 'Désactiver les Rappels' : 'Activer les Rappels')
            .setStyle(serverData.reminders ? ButtonStyle.Danger : ButtonStyle.Success)
            .setEmoji('🔔');

        const editDescBtn = new ButtonBuilder()
            .setCustomId('bump_config_edit_modal')
            .setLabel('Modifier Description / Bannière')
            .setStyle(ButtonStyle.Primary)
            .setEmoji('📝');

        const row2 = new ActionRowBuilder().addComponents(toggleBotBtn, toggleRemindersBtn, editDescBtn);

        const replyOptions = { embeds: [embed], components: [row1, row2], flags: [MessageFlags.Ephemeral] };
        
        if (interaction.isMessageComponent() || interaction.isModalSubmit()) {
            await interaction.update(replyOptions);
        } else {
            await interaction.reply(replyOptions);
        }
    },

    async executeComponent(interaction, context) {
        if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
            return interaction.reply({
                content: '<:Erreur:1343303750336385185> Vous devez être administrateur pour utiliser ce menu.',
                flags: [MessageFlags.Ephemeral]
            });
        }

        const guildId = interaction.guildId;
        const serverData = context.data.servers[guildId];

        if (interaction.customId === 'bump_config_channel') {
            serverData.bumpChannel = interaction.values[0];
            context.markDataChanged();
            await this.sendDashboard(interaction, context);
        } 
        else if (interaction.customId === 'bump_config_toggle_bot') {
            serverData.enabled = !serverData.enabled;
            context.markDataChanged();
            await this.sendDashboard(interaction, context);
        }
        else if (interaction.customId === 'bump_config_toggle_reminders') {
            serverData.reminders = !serverData.reminders;
            context.markDataChanged();
            await this.sendDashboard(interaction, context);
        }
        else if (interaction.customId === 'bump_config_edit_modal') {
            const modal = new ModalBuilder()
                .setCustomId('bumpConfigModal')
                .setTitle('Configurer le Bump');
                
            const descriptionInput = new TextInputBuilder()
                .setCustomId('description')
                .setLabel("Description du bump")
                .setPlaceholder("Insérez la description du bump")
                .setStyle(TextInputStyle.Paragraph)
                .setValue(serverData.description || '')
                .setMaxLength(2000)
                .setRequired(true);
                
            const bannerInput = new TextInputBuilder()
                .setCustomId('banner')
                .setLabel('Lien de la bannière (optionnel)')
                .setPlaceholder("Insérez le lien de l'image de bannière (optionnel)")
                .setStyle(TextInputStyle.Short)
                .setValue(serverData.bannerLink || '')
                .setRequired(false);
                
            modal.addComponents(
                new ActionRowBuilder().addComponents(descriptionInput),
                new ActionRowBuilder().addComponents(bannerInput)
            );
            
            await interaction.showModal(modal);
        }
    },

    async executeModal(interaction, context) {
        const guildId = interaction.guildId;
        const serverData = context.data.servers[guildId];
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
        context.markDataChanged();
        
        await this.sendDashboard(interaction, context);
    }
};
