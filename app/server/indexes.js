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
        "statut": 1,
        "tags.name_fr": 1
    },
    {
        name: "SitesActiveTagFRSearchIndex"
    }
);

Sites.rawCollection().createIndex(
    {
        "statut": 1,
        "tags.name_en": 1
    },
    {
        name: "SitesActiveTagENSearchIndex"
    }
);
