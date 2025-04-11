# Development

## Prérequis

Infrastructure :

- Être membre du groupe EPFL `vra_p_svc0041`.
- Être membre de l'équipe Keybase `epfl_wpveritas`.

Tequila et rôles :

- Pour se connecter à l'application, il faut s'authentifier Tequila.
- Pour obtenir le rôle 'admin' il faut appartenir au groupe EPFL `wp-veritas-admins`.
- Pour obtenir le rôle 'editor' il faut appartenir au groupe EPFL `wp-veritas-editors`.

## Local

Lancer les commandes :

```sh
cd app/
meteor npm install
cd ..
make meteor
```

Ensuite aller à l'adresse http://localhost:3000

Vous êtes alors redirigé sur une URL du type https://localhost:3000/?key=aop0wd1yo3abmhr0z5w1wbcz9sj6z9cc il suffit alors de supprimer le s de https://

Pour lancer les tests : `make test`.

## Docker

Afin de garantir que l'environnement node, meteor et mongodb soit similaire
pour tout les développeurs, et pour éviter la gestion de version de ces
environnements sur l'hôte, il est possible d'utiliser
[docker-compose-dev.yml](./docker-compose-dev.yml).

1. Construire l'image docker avec : `make dev-build`.
1. Lancer l'image docker avec : `make dev-up`.

Il est possible de rentrer dans le container avec : `make dev-exec`.

Il est possible de lancer des commandes directement dans le container,
par exemple :  
`docker run -it --entrypoint bash --rm wp-veritas-app -c "meteor --version"`

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

Il est aussi possible de lancer l'image production avec :

```sh
docker compose build
docker compose up
```

## veritas-cli

Pour installer la CLI en local, il faut:

- Se placer dans le répetoire `cli/`.
- Faire un `npm i`.
- Faire un `npm i -g .`.

Lorsque la CLI est installé :

- Se placer à la racine du projet wp-veritas.
- On peut maintenant faire un `veritas-cli --help`.

Pour installer la CLI dans docker : `make dev-cli`.

```sh
veritas-cli --help
Usage: veritas-cli [options] [command]

Options:
  -h, --help                       output usage information

Commands:
  clean-all-documents              Delete all documents from the local MongoDB
  restore-test-db                  Restore the test MongoDB on local MongoDB
  restore-prod-db                  Restore the production MongoDB on local MongoDB
  restore-prod-db-on-dev           Restore the production MongoDB on dev MongoDB
  restore-prod-db-on-test          Restore the production MongoDB on test MongoDB
  load-tests-data-on-localhost-db  Load tests data on localhost MongoDB
  load-tests-data-on-dev-db        Load tests data on dev MongoDB
  load-tests-data-on-test-db       Load tests data on test MongoDB
```

## Déploiement

Les instances sont accessibles ici :

- wp-veritas-test.epfl.ch
- wp-veritas.epfl.ch

On se place à la racine du projet :

1. Le plus simple est d'utiliser la commande `make version-major` ou
   `make version-minor` ou `make version-patch`.
1. Pour cette nouvelle version, il faut créer un tag et publier une nouvelle
   release dans GitHub. Une nouvelle image sera automatiquement créée et
   poussée dans Quay.
1. Une fois le build terminé, lancer`./ansible/wpveritasible --prod`.
   Automatiquement wp-veritas.epfl.ch redémarrera.

Lancer le déploiement va exécuter `updateRoles` qui supprime la collection
`roles` et qui supprime l'attribut roles dans chaque user. La collection est
re-créée par les fixtures.

## Notes

La mise à jour du paquet `alanning:roles` de la version 1 à la version 3 a
necessité des changements en DB. En effet, il faut supprimer la collection
`roles` et la re-créée via le fichier server/fixtures.js De plus, le user n'a
plus d'attributs roles mais une nouvelle collection `role-assignement`.
