'use strict';

import * as dotenv from 'dotenv';
import {
    Client,
    GatewayIntentBits,
    Collection,
    REST,
    Routes,
    ActivityType,
    ChannelType,
    MessageFlags,
    PermissionFlagsBits
} from 'discord.js';
import { createConnection } from 'mysql2/promise';
import schedule from 'node-schedule';
import fs from 'fs';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration et initialisation des variables d'environnement
dotenv.config();

if (!process.env.DISCORD_TOKEN || !process.env.CLIENT_ID || !process.env.DEVELOPER || !process.env.BOT_VERSION) {
    throw new Error("⚠️ Les variables d'environnement DISCORD_TOKEN, CLIENT_ID, DEVELOPER et BOT_VERSION sont obligatoires.");
}

// Configuration des intents nécessaires
const intents = [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMembers
];

// Configuration des paramètres REST
const restConfig = {
    timeout: 15000,
    retries: 3
};

// Initialisation du client avec les intents et la configuration REST
const client = new Client({
    intents: intents,
    rest: restConfig
});

client.commands = new Collection();
const commandsArray = [];

let connection;
let data = { servers: {}, reminders: {} }; // Initialisation de data
let dataChanged = false;

function markDataChanged() {
    dataChanged = true;
}

// Chargement dynamique des commandes
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    const module = await import(pathToFileURL(filePath).href);
    const command = module.default;
    
    if ('name' in command && 'execute' in command) {
        client.commands.set(command.name, command);
        commandsArray.push({
            name: command.name,
            description: command.description,
            ...(command.setDMPermission !== undefined && { setDMPermission: command.setDMPermission })
        });
    } else {
        console.log(`[WARNING] La commande dans ${filePath} est invalide (manque name ou execute).`);
    }
}

// Fonctions utilitaires
async function connectToDatabase() {
    try {
        connection = await createConnection({
            host: process.env.MYSQL_HOST,
            user: process.env.MYSQL_USER,
            password: process.env.MYSQL_PASSWORD,
            database: process.env.MYSQL_DATABASE
        });
        console.log('✅ Connecté à la base de données MySQL.');
    } catch (error) {
        console.error("⚠️ Erreur de connexion à la base de données:", error);
        process.exit(1);
    }
}

async function loadData() {
    try {
        const [serverRows] = await connection.execute('SELECT * FROM servers');
        const [userRows] = await connection.execute('SELECT * FROM users');

        data.servers = serverRows.reduce((acc, row) => {
            acc[row.guild_id] = {
                enabled: row.enabled,
                bumpChannel: row.bump_channel,
                description: row.description,
                bannerLink: row.banner_link,
                reminders: row.reminders,
                bumpCount: row.bump_count,
                bumpCountToday: row.bump_count_today,
                bumpCountWeek: row.bump_count_week,
                bumpCountMonth: row.bump_count_month,
                inviteLink: row.invite_link,
                adViews: row.ad_views,
                voteCount: row.vote_count,
                lastVote: row.last_vote,
                userData: {}
            };
            return acc;
        }, {});

        userRows.forEach(row => {
            if (data.servers[row.guild_id]) {
                data.servers[row.guild_id].userData[row.user_id] = {
                    bumpCount: row.bump_count,
                    xp: row.xp,
                    voteCount: row.vote_count
                };
            }
        });

        console.log('✅ Données chargées depuis MySQL.');
    } catch (error) {
        console.error("⚠️ Erreur lors du chargement des données depuis MySQL:", error);
        data = { servers: {}, reminders: {} };
    }
}

async function saveData() {
    try {
        if (!connection || connection.state === 'disconnected') {
            await connectToDatabase();
        }

        const serverValues = [];
        const userValues = [];

        if (data.servers && typeof data.servers === 'object') {
            for (const [guildId, serverData] of Object.entries(data.servers)) {
                const { enabled, bumpChannel, description, bannerLink, reminders, inviteLink, adViews, voteCount, lastVote, bumpCount, bumpCountToday, bumpCountWeek, bumpCountMonth } = serverData;
                serverValues.push([enabled, bumpChannel, description, bannerLink, reminders, inviteLink, adViews, voteCount, lastVote, bumpCount, bumpCountToday, bumpCountWeek, bumpCountMonth, guildId]);

                if (serverData.userData && typeof serverData.userData === 'object') {
                    for (const [userId, userData] of Object.entries(serverData.userData)) {
                        const { bumpCount, xp, voteCount } = userData;
                        userValues.push([bumpCount, xp, voteCount, guildId, userId]);
                    }
                }
            }
        }

        await connection.beginTransaction();

        if (serverValues.length > 0) {
            await connection.query(
                `INSERT INTO servers (enabled, bump_channel, description, banner_link, reminders, invite_link, ad_views, vote_count, last_vote, bump_count, bump_count_today, bump_count_week, bump_count_month, guild_id)
                VALUES ?
                ON DUPLICATE KEY UPDATE
                enabled = VALUES(enabled),
                bump_channel = VALUES(bump_channel),
                description = VALUES(description),
                banner_link = VALUES(banner_link),
                reminders = VALUES(reminders),
                invite_link = VALUES(invite_link),
                ad_views = VALUES(ad_views),
                vote_count = VALUES(vote_count),
                last_vote = VALUES(last_vote),
                bump_count = VALUES(bump_count),
                bump_count_today = VALUES(bump_count_today),
                bump_count_week = VALUES(bump_count_week),
                bump_count_month = VALUES(bump_count_month)`,
                [serverValues]
            );
        }

        if (userValues.length > 0) {
            await connection.query(
                `INSERT INTO users (bump_count, xp, vote_count, guild_id, user_id)
                VALUES ?
                ON DUPLICATE KEY UPDATE
                bump_count = VALUES(bump_count),
                xp = VALUES(xp),
                vote_count = VALUES(vote_count)`,
                [userValues]
            );
        }

        await connection.commit();
        console.log('✅ Données sauvegardées dans MySQL.');
    } catch (error) {
        if (connection && connection.state !== 'disconnected') {
            await connection.rollback();
        }
        console.error("⚠️ Erreur lors de la sauvegarde des données dans MySQL:", error);
        throw error;
    }
}

async function saveDataIfChanged() {
    if (dataChanged) {
        await saveData();
        dataChanged = false;
    }
}

async function updatePresence() {
    client.user.setActivity({ name: `${client.guilds.cache.size} serveurs`, type: ActivityType.Watching });
    client.user.setStatus('online');
}

client.once('ready', async () => {
    console.log(`✅ Bot connecté en tant que ${client.user.tag}!`);
    await connectToDatabase();
    await loadData();
    updatePresence();
    schedule.scheduleJob('*/5 * * * *', saveDataIfChanged);
    
    const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);
    try {
        console.log('🔄 Déploiement des commandes...');
        await rest.put(Routes.applicationCommands(client.user.id), { body: commandsArray });
        console.log('✅ Commandes enregistrées avec succès.');
    } catch (error) {
        console.error('⚠️ Erreur lors de l\'enregistrement des commandes :', error);
    }
    
    for (const guild of client.guilds.cache.values()) await createInviteIfNeeded(guild);
    
    schedule.scheduleJob('0 0 * * *', async () => {
        Object.values(data.servers).forEach(server => server.bumpCountToday = 0);
        dataChanged = true;
        await saveDataIfChanged();
        console.log('✅ Les comptes de bumps quotidiens ont été réinitialisés.');
    });
    schedule.scheduleJob('0 0 * * 0', async () => {
        Object.values(data.servers).forEach(server => server.bumpCountWeek = 0);
        dataChanged = true;
        await saveDataIfChanged();
        console.log('✅ Les comptes de bumps hebdomadaires ont été réinitialisés.');
    });
    schedule.scheduleJob('0 0 1 * *', async () => {
        Object.values(data.servers).forEach(server => {
            server.bumpCountMonth = 0;
            server.voteCount = 0;
        });
        dataChanged = true;
        await saveDataIfChanged();
        console.log('✅ Les comptes de bumps mensuels et les votes ont été réinitialisés.');
    });
});

client.on("guildCreate", async guild => {
    await createInviteIfNeeded(guild);
    updatePresence();
});

client.on("guildDelete", guild => {
    updatePresence();
});

client.on("inviteDelete", async invite => {
    const guild = invite.guild;
    if (guild && data.servers[guild.id] && data.servers[guild.id].inviteLink === invite.url) {
        await createInviteIfNeeded(guild);
    }
});

async function createInviteIfNeeded(guild) {
    if (!data.servers[guild.id]) {
        data.servers[guild.id] = {
            enabled: true,
            bumpChannel: null,
            description: '',
            bannerLink: '',
            reminders: false,
            bumpCount: 0,
            bumpCountToday: 0,
            bumpCountWeek: 0,
            bumpCountMonth: 0,
            lastBump: 0,
            inviteLink: '',
            adViews: 0,
            voteCount: 0,
            lastVote: 0,
            userData: {}
        };
        dataChanged = true;
    }

    const me = guild.members.me;
    if (!me) {
        console.error(`⚠️ Le bot n'est pas membre du serveur ${guild.name}.`);
        return;
    }
    const firstChannel = guild.channels.cache.find(channel =>
        channel.type === ChannelType.GuildText && channel.permissionsFor(me).has(PermissionFlagsBits.CreateInstantInvite)
    );
    if (!firstChannel) {
        console.error(`⚠️ Aucun canal de texte disponible pour créer une invitation sur le serveur ${guild.name}.`);
        return;
    }
    try {
        const invite = await guild.invites.create(firstChannel.id, { maxAge: 0, maxUses: 0 });
        data.servers[guild.id].inviteLink = invite.url;
        data.servers[guild.id].adViews = 0;
        dataChanged = true;
        await saveDataIfChanged();
    } catch (error) {
        console.error(`⚠️ Erreur lors de la création de l'invitation pour le serveur ${guild.name}:`, error);
    }
}

const rateLimit = new Collection();
const MAX_COMMANDS = 5;
const TIME_WINDOW = 60000;

function checkRateLimit(userId) {
    const now = Date.now();
    if (!rateLimit.has(userId)) {
        rateLimit.set(userId, [now]);
        return false;
    }
    const timestamps = rateLimit.get(userId);
    const filteredTimestamps = timestamps.filter(timestamp => now - timestamp < TIME_WINDOW);
    rateLimit.set(userId, [...filteredTimestamps, now]);
    return filteredTimestamps.length >= MAX_COMMANDS;
}

async function handleInteraction(interaction) {
    if (!interaction.isCommand() && !interaction.isModalSubmit()) return;
    const { commandName, guildId, user } = interaction;
    if (checkRateLimit(user.id)) {
        return interaction.reply({ content: '<:Erreur:1343303750336385185> Vous avez atteint la limite de commandes. Veuillez réessayer plus tard.', flags: [MessageFlags.Ephemeral] });
    }

    // Initialize missing server data if it doesn't exist
    if (!data.servers[guildId]) {
        data.servers[guildId] = {
            enabled: true,
            bumpChannel: null,
            description: '',
            bannerLink: '',
            reminders: false,
            bumpCount: 0,
            bumpCountToday: 0,
            bumpCountWeek: 0,
            bumpCountMonth: 0,
            lastBump: 0,
            inviteLink: '',
            adViews: 0,
            voteCount: 0,
            lastVote: 0,
            userData: {}
        };
        dataChanged = true;
    }

    const context = { client, data, markDataChanged, commandsArray };

    if (interaction.isCommand()) {
        const command = client.commands.get(commandName);
        if (!command) return;

        try {
            await command.execute(interaction, context);
        } catch (error) {
            console.error(`⚠️ Erreur lors de l'exécution de la commande ${commandName}:`, error);
            if (!interaction.replied && !interaction.deferred) {
                await interaction.reply({ content: 'Une erreur est survenue lors de l\'exécution de cette commande.', flags: [MessageFlags.Ephemeral] });
            }
        }
    } else if (interaction.isModalSubmit() && interaction.customId === 'bumpConfigModal') {
        const bumpConfigCommand = client.commands.get('bump_config');
        if (bumpConfigCommand && bumpConfigCommand.executeModal) {
            try {
                await bumpConfigCommand.executeModal(interaction, context);
            } catch (error) {
                console.error(`⚠️ Erreur lors de l'exécution du modal bump_config:`, error);
            }
        }
    }

    await saveDataIfChanged();
}

client.on('interactionCreate', handleInteraction);

client.login(process.env.DISCORD_TOKEN).then(() => {
    console.log("✅ Le bot s'est connecté avec succès à Discord et est prêt à fonctionner.");
}).catch((error) => {
    console.error("⚠️ Une erreur s'est produite lors de la tentative de connexion du bot à Discord.");
    console.error("⚠️ Vérifiez que le jeton DISCORD_TOKEN est correct et configuré dans les variables d'environnement.");
    console.error("⚠️ Détails de l'erreur :", error);
});
