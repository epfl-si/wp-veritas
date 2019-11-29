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
 * Cette méthode est asynchrone grâce au mot clé async
 * Dès que cette méthode async/await fera un return,
 * elle retournera une promesse.
 * 
 */
var getPosts = async function() {
  var response = await get('https://jsonplaceholder.typicode.com/users');
  var users = JSON.parse(response);
  var posts = await get('https://jsonplaceholder.typicode.com/comments?userId=' + users[0].id);
  var posts = JSON.parse(response);
  return posts;
}

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
