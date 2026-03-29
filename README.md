**`Mise à jour : version 1.1.4`**

# Exobump Discord Bot

Exobump est un bot Discord conçu pour aider à promouvoir les serveurs Discord en permettant aux utilisateurs de "bumper" leurs serveurs, c'est-à-dire de les faire remonter dans les listes pour plus de visibilité.

## Description

Exobump est un bot Discord qui permet aux utilisateurs de promouvoir leurs serveurs en les "bumpant". Cela envoie un message promotionnel dans des canaux dédiés sur d'autres serveurs, augmentant ainsi la visibilité et attirant de nouveaux membres. Le bot offre également des fonctionnalités de suivi des bumps, des votes, et des statistiques détaillées.

## Fonctionnalités

- **Tableau de Bord Interactif** : Configurez votre bot (activation, rappels, description, bannière, salon) depuis un seul panel interactif.
- **Statistiques** : Suivez les statistiques de bumps, de votes, et de vues publicitaires.
- **Classements** : Voir les meilleurs serveurs et utilisateurs en termes de bumps.
- **Système de Niveaux** : Gagnez de l'XP et montez de niveau en bumpant votre serveur.
- **Commandes Slash** : Utilisation de commandes slash pour interagir avec le bot.

## Prérequis

- Node.js (version 16 ou supérieure)
- Un bot Discord (créé via le [Portail Développeur Discord](https://discord.com/developers/applications))
- Une base de données MySQL
- Les permissions nécessaires pour ajouter le bot à vos serveurs

## Installation

1. Clonez ce dépôt sur votre machine locale.
2. Installez les dépendances nécessaires en exécutant `npm install`.
3. Créez un fichier `.env` à la racine du projet et ajoutez vos variables d'environnement :

```plaintext
DISCORD_TOKEN=VOTRE_TOKEN_DE_BOT
CLIENT_ID=VOTRE_CLIENT_ID
DEVELOPPER=YOU_NAME
BOT_VERSION=YOUR_VERSION
MYSQL_HOST=VOTRE_HOST_MYSQL
MYSQL_USER=VOTRE_UTILISATEUR_MYSQL
MYSQL_PASSWORD=VOTRE_MOT_DE_PASSE_MYSQL
MYSQL_DATABASE=VOTRE_BASE_DE_DONNEES_MYSQL
```

4. Exécutez le bot avec la commande `node index.js`.

## Commandes

Le bot utilise des commandes slash pour interagir avec les utilisateurs. Voici les commandes disponibles :

- `/bump` : Envoyer un bump à tous les serveurs connectés.
- `/bump_config` : Ouvre le **Tableau de Bord Interactif** pour paramétrer le bot sur votre serveur (activation, salon d'envoi, rappels, description, bannière) (admin uniquement).
- `/bump_preview` : Voir un aperçu du bump (admin uniquement).
- `/top_server` : Voir les meilleurs serveurs bumpés.
- `/top_user` : Voir les meilleurs utilisateurs bumpers.
- `/stats_bump` : Afficher les statistiques détaillées des bumps.
- `/vote` : Voter pour le serveur.
- `/help` : Affiche la liste des commandes disponibles.
- `/botinfo` : Affiche les informations du bot.

## Utilisation

1. Invitez le bot sur votre serveur Discord en utilisant le lien OAuth2 généré dans le [Portail Développeur Discord](https://discord.com/developers/applications).
2. Utilisez la commande `/bump_config` pour ouvrir le tableau de bord interactif et paramétrer entièrement le bot (salon d'envoi, description, bannière, rappels...).
3. Utilisez la commande `/bump` pour envoyer un bump promotionnel vers tous les autres serveurs du réseau.
4. Utilisez la commande `/vote` pour envoyer un vote pour votre serveur.
5. Utilisez les autres commandes pour voir les statistiques ou le classement.

## Contribution

Les contributions sont les bienvenues ! Pour contribuer à ce projet, veuillez suivre ces étapes :

1. Fork ce dépôt.
2. Créez une branche pour votre fonctionnalité (`git checkout -b feature/AmazingFeature`).
3. Commitez vos changements (`git commit -m 'Add some AmazingFeature'`).
4. Poussez vers la branche (`git push origin feature/AmazingFeature`).
5. Ouvrez une Pull Request.

## Licence

Ce projet est sous licence MIT. Voir le fichier [LICENSE](LICENSE) pour plus de détails.

## Contact

Pour toute question ou suggestion, n'hésitez pas à ouvrir une issue ou à me contacter directement.

---

## Contributions

Un grand merci à [Alexis-katabump](https://github.com/Alexis-katabump/bump-bot-discord) pour ça contribution (Amélioration du code)

---

[![Donate](https://img.shields.io/badge/paypal-donate-yellow.svg?style=flat)](https://www.paypal.me/nuggan85) [![v1.1.4](http://img.shields.io/badge/zip-v1.1.4-blue.svg)](https://github.com/NuggaN85/Exobump/archive/master.zip) [![GitHub license](https://img.shields.io/github/license/NuggaN85/Exobump)](https://github.com/NuggaN85/Exobump) ![Platform](https://img.shields.io/badge/Platform-Discord-lightgrey)

© 2025 Ludovic Rose. Tous droits réservés.
