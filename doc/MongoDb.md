# wp-veritas

## La base de données

La base de données est une base MongoDB hébergé chez c2c.

La connection string de mongoDB est: 

```
mongodb://username:password@host/database
```

### La base de données de dev

host: test-mongodb-svc-1.epfl.ch
username: wp-veritas
pwd: on peut le retrouver dans les secrets d'openshift
 
Connection string:
```
mongodb://wp-veritas:<password>@test-mongodb-svc-1.epfl.ch/wp-veritas'
```

Et pour se connecter à la base de données de test:
```
mongo 'mongodb://wp-veritas:<password>@test-mongodb-svc-1.epfl.ch/wp-veritas'
```

### La base de données de test

host: test-mongodb-svc-1.epfl.ch
username: wp-veritas
pwd: on peut le retrouver dans les secrets d'openshift
 
Connection string:
```
mongodb://wp-veritas-test:<password>@test-mongodb-svc-1.epfl.ch/wp-veritas-test'
```

Et pour se connecter à la base de données de test:
```
mongo 'mongodb://wp-veritas-test:<password>@test-mongodb-svc-1.epfl.ch/wp-veritas-test'
```
 
### La base de données de prod
 
### Quelques commandes MongoDB
 
Une fois connecté à la BD via par exemple:
```
mongo 'mongodb://wp-veritas:<password>@mongodb-svc-1.epfl.ch/wp-veritas'
```

Pour voir les collections: 

```
show collections
```

Pour faire une requête: 

```
db.sites.find({'url':'https://www.epfl.ch'});
```


