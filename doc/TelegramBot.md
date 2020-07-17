# Mise en place de Bot Telegram

## Principe

Lorsque un utilisateur (en général le service manager) créé un nouveau ou supprime un site de wp-veritas, un membre de l'équipe WordPress doit exécuter une commande ansible correspondante.
Afin que l'équipe WordPress soit prévenue immédiatement qu'une opération de maintenance est à effectuer un message est envoyé un bot telegram.

## Pas un bot mais 2 bots

Pour ne pas être pollué par les opérations effectuées dans l'environnement de test mais tout de même pouvoir tester l'envoi des messages depuis l'infra de test, nous avons créé 2 bots :

- wp-veritas-bot
- wp-veritas-test-bot

## Exemple d'appel HTTP pour envoyer le msg

https://api.telegram.org/bot<token>/sendMessage?chat_id=<chat-id-du-destinataire>&text=un-super-msg

