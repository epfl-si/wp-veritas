import { Sites, Professors, Tags } from '../../imports/api/collections';

let BreakException = {};
let unknowedClusters = [];

displayLine = (line) => {
  console.log("---------------------------");
  console.log("-- INFOS CSV FILE:       --")
  console.log(line);
  console.log("---------------------------");
}

getTags = (line) => {
  let tags = [];
  if (line.clusters !== undefined) {
    let clusters = line.clusters.split("|");
    for (const cluster of clusters) {

      let tag = Tags.findOne({name_en: cluster, type: "field-of-research"});
      
      if (tag === undefined) {
        console.log("ERROR");
        if (!unknowedClusters.includes(cluster)) {
          unknowedClusters.push(cluster);
        }
      } else {
        tags.push(tag);
      }
      // console.log(tag);
    }
  }
  return tags;
}

getProfessor = (line) => {

  let professor = null;
  console.log("-- Gestion du professeur");

  // Créer le professeur
  if (line.sciper === '') {
    console.log(`ERROR sciper ${line.sciper}`);
  } else  {
      
    // Est ce que ce sciper ...
    let nbProfs = Professors.find({sciper: line.sciper}).count();

    // ... existe ?
    if (nbProfs == 1) {
      console.log("Professor already exist");
      professor = Professors.findOne({sciper: line.sciper});
    
    // ... n'existe pas donc on doit l'insérer
    } else if (nbProfs == 0) {

      // récupère les infos du LDAP
      let LDAPprof = Meteor.call('getLDAPInformations', line.sciper);

      let professorDocument = {
        sciper: line.sciper,
        displayName: LDAPprof.displayName,
      };
      
      console.log("Info LDAP : ")
      console.log(professorDocument);
      
      // Insérer le nouveau prof
      let newProfessorId = Professors.insert(professorDocument);

      // MAJ de la liste des 
      professor = Professors.findOne({_id: newProfessorId});
    }
  }
  return professor;
}

associateTagsToSite = (line, tags) => {

  console.log("---------------------------");
  console.log("-- Association des tags au site --");


  let nbSites = Sites.find({url: line.siteUrl}).count();
  if (nbSites == 1) {

    // Récupère le site en fonction de l'URL
    let site = Sites.findOne({url: line.siteUrl});
    console.log(site);

    let tagsToInsert = [];

    for (let tagToInsert of tags) {
      let tagExist = false;
      for (let tag of site.tags) {
        if (tagToInsert._id == tag._id) {
          tagExist = true;
          console.log("break");
          break;
        }
      }
      console.log(`Exist ?: ${ tagExist }`);
      if (!tagExist) {
        console.log(`PUSH ${tagToInsert}`);
        tagsToInsert.push(tagToInsert);
      }
    }
    console.log("Tags à ajouter");
    console.log(tagsToInsert);

    console.log("Tags déjà présents");
    console.log(site.tags);
    
    console.log("Merge des tags");
    let mergeTags = [...new Set([...tagsToInsert ,...site.tags])];
    console.log(mergeTags);

    // prépare la MAJ du site
    let siteDocument = {
      tags: mergeTags,
    }          

    // Mise à jour du site
    Sites.update(
      {_id: site._id}, 
      { $set: siteDocument}
    );

    let siteAfterUpdate = Sites.findOne({_id: site._id});
    console.log(siteAfterUpdate.tags);

  }
}

associateProfToSite = (line, professor) => {

  console.log("---------------------------");
  console.log("-- Association du prof au site --");

  // Associer les profs au site
  let nbSites = Sites.find({url: line.siteUrl}).count();
  console.log(nbSites);

  if (nbSites > 1) {
    console.log("ERROR: cette URL correspond a plusieurs sites");
  
  } else if (nbSites == 0) {
    console.log(`ERROR: cette URL ${ line.siteUrl } n'existe pas`);
  
  } else if (nbSites == 1) {

  // Récupère le site en fonction de l'URL
  let site = Sites.findOne({url: line.siteUrl});
  console.log("Site avant l'association prof to site");
  console.log(site);

  let professors;

  // Récupère la liste des profs
  if ('professors' in site) {
    professors = site.professors;
  } else {
    professors = [];
  }          
  console.log(professors);

  // Ajoute le nouveau prof
  if (professor !== null) {
    let profExist = false;
    console.log(professors);
    for (let prof in professors) {
      console.log(`Sciper courant: ${prof.sciper}`);
      console.log(`Sciper à ajouter: ${professor.sciper}`);

      if (prof.sciper === professor.sciper) {
        profExist = true;
        console.log("break");
        break;
      }
    }
    console.log(`Prof existe : ${profExist}`);
    if (!profExist) {
      professors.push(professor);
    }
  }
  console.log(professors);
            
  // prépare la MAJ du site
  let siteDocument = {
    professors: professors,
  }          

  // Mise à jour du site
  Sites.update(
    {_id: site._id}, 
    { $set: siteDocument}
  );

    let siteAfterUpdate = Sites.findOne({_id: site._id});
    console.log(siteAfterUpdate);

    console.log("Le prof a été associé au site avec succès");
  }
  console.log("---------------------------");
}

manageLine = (line, index) => {
  
  let currentSite = Sites.findOne({url: line.siteUrl});
  
  if (index == 0 && currentSite != undefined && 'professors' in currentSite) {
    // on va pas faire une 2ème exécution
    throw BreakException;
  } else {
    
    displayLine(line);
    let professor = getProfessor(line);
    associateProfToSite(line, professor);

    let tags = getTags(line);
    associateTagsToSite(line, tags);

  }
}

importSciperAndClustersBySite = () => {

  const path = 'site-prof-clusters.csv';
  const file = Assets.getText(path);

  Papa.parse(file, {
    delimiter: ";",
    header: true,
    complete: function(results) {
      let data = JSON.parse(JSON.stringify(results.data));
      
      try {
        data.forEach(
          (line, index) => {
            if (line.doublon !== "1") {
              manageLine(line, index);
            }
/*            if (index == 4) {
              throw BreakException;
            }*/
          }
        )
        console.log(unknowedClusters);
      } catch (e) {
        if (e !== BreakException) throw e;
      }
    }
  });
}

export { importSciperAndClustersBySite }