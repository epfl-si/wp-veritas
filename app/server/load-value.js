import { Types } from "../imports/api/collections";

const types = [
  { name: "kubernetes", description: "Site géré par la DSI et déployé sur Kubernetes", schema: "SiteBaseSchema" },
  { name: "external", description: "Site hébergé en dehors de l'infrastructure interne", schema: "SiteBaseSchema" },
  { name: "archived", description: "Site archivé, conservé à des fins de référence", schema: "SiteBaseSchema" },
  { name: "deleted", description: "Site supprimé, hors de l'infrastructure active", schema: "SiteBaseSchema" },
  { name: "temporary", description: "Site temporaire géré par wp-klneex", schema: "SiteBaseSchema" },
];

const loadData = async () => {
  for (const type of types) {
    await Types.upsertAsync(
      { name: type.name },
      { $set: { description: type.description, schema: type.schema } }
    );
  }
};

export { loadData };
