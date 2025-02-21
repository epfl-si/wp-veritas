# wp-veritas

## Bases de données

Les bases de données MongoDB sont hébergées chez ISAS-FSD.

La connection string de mongoDB est :

```
mongodb://username:password@host/database
```

### Test et production

On peut retrouver les infos dans les secrets d'OpenShift.

### Quelques commandes MongoDB

Une fois connecté à la BD via par exemple:

```
mongo 'mongodb://wp-veritas-test:<password>@mongodb-test/wp-veritas-test'
```

Pour voir les collections :

```
show collections
```

Pour faire une requête :

```
db.sites.find({'url':'https://www.epfl.ch'});
```
