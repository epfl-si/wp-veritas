# Category to categories

## Problématique

Les catégories de wp-veritas sont utilisées pour l'installation de plugins
particuliers sur certains sites, par exemple la catégorie restauration permet
d'indiquer aux différents scripts dans `jahia2wp` et `ansible` d'installer le
plugin "EPFL-menu" (ref?).

La problématique a été mise en exergue lors de la demande d'ajout des plugins
"WPForms" et "Payonline" : dans certains cas, une catégorie unique n'est pas
suffisante, on peut vouloir utiliser `n` catégories sur un site afin d'y ajouter
plusieurs plugins.


## Discussion

Lors du daily du 10 juin 2020, nous avons disucté de cette problématique.

   - Est-ce que la terminologie "Catégories" est adaptée ?  
     Elle n'est pas idéale mais compréhensible par les utilisateurs du site.

   - Est-ce qu'un nouveau champs, nommé "Fonctionnalités" ou "Plugins", serait
     plus adapté ?  
     Oui, mais ferait double emplois avec le champs catégorie qui est exclusivement
     utilisé pour cela. De plus, les utilisateurs finaux de wp-veritas sont déjà
     habitué à ce champs.

   - Est-ce qu'il y a des catégories qui s'annulent, et ne devraient pas être
     sélectionnées en même temps ?  
     Non, du moment que les catégories résultent en l'installation de plugin sur
     un site wordpress, il n'y a pas de double emplois. Cela pourrait résulter en
     l'installation d'un plugin qui ne serait pas utilisé sur le site, bien que
     cela ne soit pas idéal, ce n'est pas bloquant.

   - Quels pourraient être les effets de bord d'un changement de catégorie à 
     catégories multiples ?  
     Il est nécessaire d'adapter les scripts de déploiement qui utilisent cette 
     information, c'est à dire `jahia2wp` et `ansible`.

### Conclusion

Tout le monde s'accorde procéder à la transformation du champs catégorie pour 
qu'il présente une UI similaire à celle des tags.
Dès lors, un site pourra avoir de 1 à N catégories.


## À faire

   - [x] Modifier la UI de wp-veritas (CRUD)
       - [x] Creation
          - [x] Modifier la page de création de site.
       - [x] Read
          - [x] Griser la sélection de catégories lors que le schéma n'est pas VPSiens.
       - [x] Delete 
          - [x] Meteor methods: s'assurer que la suppression d'une catégorie est gérée.
   - [x] Modifier l'export en CSV
   - [x] Modifier les tests de wp-veritas
   - [x] Modifier l'API de wp-veritas (à priori rien à faire si la DB change)
   - [x] Importer la catégorie de la version initiale dans les catégories.
   - [ ] GeneralPublic valeur par défaut ?
   - [ ] Modifier `jahia2wp`
   - [ ] Modifier `ansible`
   - [ ] Tester
   - [ ] Penser à supprimer l'ancien champ category dans la collection site.


<!--
pandoc \
  --variable mainfont="DejaVu Sans" \
  --variable monofont="DejaVu Sans Mono" \
  --variable fontsize=11pt \
  --variable geometry:"top=1.5cm, bottom=2.5cm, left=1.5cm, right=1.5cm" \
  --variable geometry:a4paper \
  --variable colorlinks \
  --variable linkcolor=blue \
  --variable urlcolor=blue \
  --table-of-contents \
  --number-sections \
  -f markdown CatergoryToCategories.md \
  --pdf-engine=lualatex \
  -o CategoryToCategories.pdf
-->
