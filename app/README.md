# wp-veritas

Cette application a pour but de stocker la source de vérité des sites WordPress de l'EPFL.

## Lancer l'application en local 

Se positionner dans le répertoire app/ et lancer la commande :

`cd app/`

`meteor --settings settings.json`

Ensuite aller à l'adresse http://localhost:3000

Vous êtes alors redirigé sur une URL du type https://localhost:3000/?key=aop0wd1yo3abmhr0z5w1wbcz9sj6z9cc il suffit alors de supprimer le s de https://

## Lancer l'application via docker

Se positionner dans le répertoire racine et faire un : `docker-compose up`

Ensuite aller à l'adresse https://localhost:3000

## Déployer une nouvelle version sur l'environnement de test d'openshift

On commence par builder l'image :

`docker build -t epflidevelop/wp-veritas .`

On crée un tag pour cette image 

`docker tag epflidevelop/wp-veritas:latest epflidevelop/wp-veritas:0.1.10`

On pousse l'image dans dockerhub

`docker push epflidevelop/wp-veritas:0.1.10`

`docker push epflidevelop/wp-veritas:latest`

Ensuite on doit modifier la référence à cette image dans le déploiment openshift en éditant le fichier deploy-wp-veritas.yaml.

`
image: epflidevelop/wp-veritas:0.1.10
`

Maintenant on se connecte à openshift :

`oc login`

On vérifie que l'on est dans le bon projet :

`oc project`

On supprime tous les "éléments" openshift créé via le déploiement (déploiement, service, route) mais cela ne supprime pas les secrets

`oc delete -f deploy-wp-veritas.yaml`

On re-crée les éléments

`oc create -f deploy-wp-veritas.yaml`


> Il est important de noter que l'URL de MongoDB est enregistrer dans le Secret wp-veritas. A compléter


## Déployer une nouvelle version sur l'environnement de prod d'openshift

à compléter

## Importer les information de la source de vérité

Vous devez être positionné dans le répertoire app/ et avoir lancé l'application.

`meteor shell`

`importVeritas()`

## Si vous avez besoin de supprimer tous les sites avant de relancer l'import des données

Vous devez être positionné dans le répertoire app/ et avoir lancé l'application.

`meteor mongo`

`db.sites.deleteMany({})`
