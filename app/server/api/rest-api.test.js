import assert from "assert";
import { Sites, Tags, Categories } from "../../imports/api/collections";
import { insertCategory, removeCategory } from "../../imports/api/methods/categories";
import { insertSite, updateSite, removeSite } from "../../imports/api/methods/sites";
import { insertTag } from "../../imports/api/methods/tags";
import { resetDatabase } from "meteor/xolvio:cleaner";
import { createUser } from "../../tests/helpers";
import { loadFixtures } from "../fixtures";

const request = require('supertest');

function createTag(userId, args) {
const context = { userId };
idTag = insertTag._execute(context, args);
return Tags.findOne({_id: idTag});
}

if (Meteor.isServer) {

    describe('GET /sites', function() {
        before(function () {
            resetDatabase();
            loadFixtures();
            Categories.insert({
              name: "Inside",
            });
            Categories.insert({
              name: "Restauration",
            });
          });
      
          it("insert site", () => {
            let userId = createUser();
      
            const tagArgs1 = {
              name_fr: "Beaujolais",
              name_en: "Beaujolais",
              url_fr: "https://fr.wikipedia.org/wiki/Beaujolais",
              url_en: "https://en.wikipedia.org/wiki/Beaujolais",
              type: "field-of-research",
            };
      
            const tagArgs2 = {
              name_fr: "Vin nature",
              name_en: "Nature wine",
              url_fr: "https://fr.wikipedia.org/wiki/Vin_naturel",
              url_en: "https://en.wikipedia.org/wiki/Natural_wine",
              type: "field-of-research",
            };
      
            let tag1 = createTag(userId, tagArgs1);
            let tag2 = createTag(userId, tagArgs2);
      
            console.log(tag1);
            console.log(tag2);
      
            let tagsNumber = Tags.find({}).count();
            assert.strictEqual(tagsNumber, 2);
      
            const url = "https://www.epfl.ch/beaujolais/madame-placard";
            const title = "Ma meilleure découverte 2019";
      
            const context = { userId };
            const args = {
              url: url,
              tagline: "Yvon Métras",
              title: title,
              openshiftEnv: "www",
              category: "GeneralPublic",
              categories: Categories.find({ name: "Restauration" }).fetch(),
              theme: "wp-theme-2018",
              languages: ["en", "fr"],
              unitId: "13030",
              unitName: "IDEV-FSD",
              unitNameLevel2: "SI",
              snowNumber: "42",
              comment: "Vin nature par excellence !",
              createdDate: new Date(),
              userExperience: false,
              userExperienceUniqueLabel: "",
              tags: [tag1, tag2],
              professors: [],
              wpInfra: true,
            };
      
            insertSite._execute(context, args);
      
            let sitesNumber = Sites.find({}).count();
            let site = Sites.findOne({ url: url });
      
            assert.strictEqual(site.categories.length, 1);
            assert.strictEqual(site.categories[0].name, "Restauration");
      
            assert.strictEqual(sitesNumber, 1);
            assert.strictEqual(site.title, title);
          });


        // TODO → make this works: the idea is to use the test server to 
        //        test request on the API and validate that all endpoints
        //        and methods are OK.
        // it('return list of sites', function() {
        //   return request('http://localhost:3000')
        //     .get('/api/v1/sites')
        //     .expect(200)
        //     .expect('Content-Type',/json/)
        //     //.expect('[{"name":"ej","age":26},{"name":"jh","age":28}]')
        //     .expect('[{"name_fr": "Beaujolais"}]')
        //     //   _id: '7CvCHEa2CTBLd6JP8',
        //     //   name_fr: 'Beaujolais',
        //     //   name_en: 'Beaujolais',
        //     //   url_fr: 'https://fr.wikipedia.org/wiki/Beaujolais',
        //     //   url_en: 'https://en.wikipedia.org/wiki/Beaujolais',
        //     //   type: 'field-of-research'
        //     // }
        //     // {
        //     //   _id: 'DM3d7FHoGdddHGgw9',
        //     //   name_fr: 'Vin nature',
        //     //   name_en: 'Nature wine',
        //     //   url_fr: 'https://fr.wikipedia.org/wiki/Vin_naturel',
        //     //   url_en: 'https://en.wikipedia.org/wiki/Natural_wine',
        //     //   type: 'field-of-research'
        //     // }
                
        // })

  });
}
