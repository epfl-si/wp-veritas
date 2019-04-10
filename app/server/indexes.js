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
        "tags.name_fr": 1
    },
    {
        name: "SitesTagFRSearchIndex"
    }
);

Sites.rawCollection().createIndex(
    {
        "tags.name_en": 1
    },
    {
        name: "SitesTagENSearchIndex"
    }
);
