/**
 * Le but de cet exemple est de montrer comment exécuter 
 * "séquentiellement" 2 actions asynchrones avec des promesses.
 */

/**
 * Définition de la méthode get().
 * 
 * Cette méthode asynchrone permet d'interroger l'API 
 * en fonction de l'URL donné en paramètre
 * 
 * @param {*} url: URL de l'api à appeler
 */
var get = function (url) {

  return new Promise(

    function(resolve, reject){
      var XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest;
      var xhr = new XMLHttpRequest();
      xhr.onreadystatechange = function() {
        if (xhr.readyState === 4) {
          if (xhr.status === 200) {
            resolve(xhr.responseText)
          } else {
            reject(xhr)
          }   
        }
      }
      xhr.open('GET', url, true)
      xhr.send()
    }

  )
}

/**
 * Définition de la méthode getPosts().
 * 
 * Cette méthode est asynchrone et returne en cas de succès
 * tous les articles du 1er utilisateur
 * 
 * @param {*} success: En cas de succès, on retourne les articles du 1er user.
 * @param {*} error: En cas d'erreur, on affiche l'erreur.
 */
var getPosts = function() {

  return get('https://jsonplaceholder.typicode.com/users').then(
    function (response) {
      var users = JSON.parse(response);
      return get('https://jsonplaceholder.typicode.com/comments?userId=' + users[0].id)
    }
  ).then(
    function(response) {
      var posts = JSON.parse(response);
      return posts;
    }
  )
}


// Appel de la fonction getPosts
// en lui passant 2 fonctions de callback
// - la 1ère en cas de succès 
// - la deuxième en cad d'erreur
getPosts().then(
  function(posts) {
    // en cas de succès, j'affiche le 1er post
    console.log("Le premier post: ", posts[0]);
  }
).catch(
  function(error) {
    // en cas d'erreur, j'affiche l'erreur
    console.error(error);
  }
)
