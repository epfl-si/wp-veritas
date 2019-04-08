import { Sites } from '../both';

Sites.rawCollection().createIndex(
    {
        "url": 1
    },
    {
        name: "SitesUrlSearchTextIndex"
    }
);

Sites.rawCollection().createIndex(
    {
        "title": "text",
        "tagline": "text",
        "tags.name_en": "text",
        "tags.name_fr": "text",
        "url": "text",
        "faculty": 1
    },
    {
        /*weights: {
            "tagline": 1,
            "title": 1,
            "tags.name_en": 1,
            "tags.name_fr": 1,
            "url": 1
        },*/
        name: "SitesGenericSearchTextIndex"
    }
);
