# wp-veritas

[![Build Status](https://travis-ci.org/epfl-si/wp-veritas.svg?branch=master)](https://travis-ci.org/epfl-si/wp-veritas)

Cette application a pour but de stocker et permettre l'édition de la **source de vérité** des sites WordPress de l'EPFL :
- la liste des sites, avec leurs attributs techniques et fonctionnels;
- la liste des **environnements OpenShift**, des unités techniques d'allocation des ressources et de routage dans lesquelles se classent les sites,
- et d'autres listes connexes (liste des professeurs, liste des *tags*).

<!-- TOC titleSize:2 tabSpaces:3 depthFrom:1 depthTo:6 withLinks:1 updateOnSave:1 orderedList:0 skip:1 title:1 charForUnorderedList:* -->
## Table of Contents
* [Local](#local)
   * [Lancer l'application en local](#lancer-lapplication-en-local)
   * [Lancer l'application via docker](#lancer-lapplication-via-docker)
   * [Lancer l'application via docker pour le développment](#lancer-lapplication-via-docker-pour-le-développment)
      * [Commandes et informations supplémentaires](#commandes-et-informations-supplémentaires)
* [veritas-cli](#veritas-cli)
* [Déploiement](#déploiement)
   * [Déployer une nouvelle version OpenShift](#déployer-une-nouvelle-version-openshift)
   * [Procédure de mise en prod](#procédure-de-mise-en-prod)
   * [Référence sur Dockerhub](#référence-sur-dockerhub)
* [Manipulation des données](#manipulation-des-données)
   * [Importer les informations de la source de vérité](#importer-les-informations-de-la-source-de-vérité)
   * [Si vous avez besoin de supprimer tous les sites avant de relancer l'import des données](#si-vous-avez-besoin-de-supprimer-tous-les-sites-avant-de-relancer-limport-des-données)
* [Autentification Tequila et rôles](#autentification-tequila-et-rôles)
* [Notes](#notes)
   * [Mise à jour de l'image](#mise-à-jour-de-limage)
   * [Comment exécuter les tests](#comment-exécuter-les-tests)
   * [Mise à jour de paquet alanning:roles](#mise-à-jour-de-paquet-alanningroles)
<!-- /TOC -->


# Local

## Lancer l'application en local 

Se positionner dans le répertoire app/ et lancer la commande :

`cd app/`

`env WP_VERITAS_BOT_TOKEN=$WP_VERITAS_BOT_TOKEN_TEST WP_VERITAS_ALERTS_TELEGRAM_IDS=$WP_VERITAS_ALERTS_TELEGRAM_IDS_TEST meteor --settings meteor-settings.json`

Ensuite aller à l'adresse http://localhost:3000

Vous êtes alors redirigé sur une URL du type https://localhost:3000/?key=aop0wd1yo3abmhr0z5w1wbcz9sj6z9cc il suffit alors de supprimer le s de https://

## Lancer l'application via docker

Se positionner dans le répertoire racine et faire un : `docker-compose up`

Ensuite aller à l'adresse https://localhost

## Lancer l'application via docker pour le développment

Afin de garantir que l'environnement node, meteor et mongodb soit
similaire pour tout les développeurs, et pour éviter la gestion de
version de ces environnements sur l'hôte, il est possible d'utiliser
[docker-compose-dev.yml](./docker-compose-dev.yml).

  1. Construire l'image docker avec :  
     `docker-compose -f docker-compose-dev.yml build`
  1. Lancer l'image docker avec :  
     `docker-compose -f docker-compose-dev.yml up`

### Commandes et informations supplémentaires

Il est possible de lancer des commandes directement dans le container, 
par exemple :  
`docker run -it --entrypoint bash --rm wp-veritas_app -c "meteor --version"`

De même, il est possible de rentrer dans le container avec :  
`docker exec -it --user root wp-veritas_meteor bash`

Note: la spécification de l'utilisateur root n'est pas nécessaire, mais le
[docker-compose-dev.yml](./docker-compose-dev.yml) tente de faire matcher
un utilisateur du système avec celui dans le container. Il se peut que votre
utilisateur ait l'identificant 1000, ce qui correspond à l'utilisateur "node"
dans le container. Dans ce cas, les commandes "root" ne fonctionneront pas sans
spécifier l'utiliser à l'aide de l'option `--user root`.

L'application se trouve dans le dossier `/app` du container. Néanmoins, tous les
fichiers du projet sont également disponible dans le container, dans le dossier
`/src`. Cela permet par exemple de tester et d'utiliser `veritas-cli`. Pour ce
faire, se rendre dans `/src/cli` et suivre les indications ci-dessous.


# veritas-cli

Pour installer le CLI en local, il faut:
- Se placer dans le répetoire `cli/`
- Faire un `npm install`
- Faire un `npm install -g ./`

Lorsque le CLI est installé :
- Se placer à la racine du projet wp-veritas
- On peut maintenant faire un `veritas-cli --help`

```
greg@epfl:~/workspace-idevfsd/wp-veritas$ veritas-cli --help
Usage: veritas-cli [options] [command]

Options:
  -h, --help           output usage information

Commands:
  clean-all-documents  Delete all documents from the local MongoDB
  restore-test-db      Restore the test MongoDB on local MongoDB
  restore-prod-db      Restore the production MongoDB on local MongoDB
```


# Déploiement

## Déployer une nouvelle version OpenShift

On se place à la racine du projet :

1. Changer la version dans `package.json` (et lancer `npm i` pour mettre à jour `package-lock.json`). Le plus simple est d'utiliser la commande `make version-major`.
2. La suite des opérations est regénérer l'API, de builder l'image, de la tagger, et de la pousser sur docker hub. Ces opérations sont faites avec la commande `make publish`,
3. Les commande `make deploy-dev`, `make deploy-test`, `make deploy-prod` permettent de déployer l'application respectivement sur <wp-veritas.128.178.222.83.nip.io>, <wp-veritas-test.epfl.ch> et 
<wp-veritas.epfl.ch>.


## Procédure de mise en prod
Lancer le déploiement => ce qui va exécuter `updateRoles` qui supprime la
collection `roles` et qui supprime l'attribut roles dans chaque user. La
collection est re-créée par les fixtures.

## Référence sur Dockerhub

https://hub.docker.com/repository/docker/epflsi/wp-veritas


# Manipulation des données

## Importer les informations de la source de vérité

(Obsolète, utiliser veritas-cli)

Vous devez être positionné dans le répertoire app/ et avoir lancé l'application.

`meteor shell`

`importVeritas()`

## Si vous avez besoin de supprimer tous les sites avant de relancer l'import des données

Vous devez être positionné dans le répertoire app/ et avoir lancé l'application.

`meteor mongo`

`db.sites.deleteMany({})`

`docker push epflsi/wp-veritas:latest`

# Autentification Tequila et rôles

- Pour se connecter à l'application, il se faut s'authentifier Tequila.
- Pour obtenir le rôle 'admin' il faut appartenir au groupe 'wp-veritas-admins' de l'application groups.epfl.ch
- Pour obtenir le rôle 'editor' il faut appartenir au groupe 'wp-veritas-editors' de l'application groups.epfl.ch


# Notes

## Mise à jour de l'image
ATTENTION :
Pour mettre à jour l'image avec FROM node:10.19-alpine 
On a du utiliser node version 10 car avec la 12 on avait un prob avec Fiber 
FROM node:10.19-alpine

## Comment exécuter les tests
make test

## Mise à jour de paquet alanning:roles
La mise à jour du paquet `alanning:roles` de la version 1 à la version 3 a necessité des changements en DB.
En effet, il faut supprimer la collection `roles` et la re-créée via le fichier server/fixtures.js
De plus, le user n'a plus d'attributs roles mais une nouvelle collection `role-assignement`
