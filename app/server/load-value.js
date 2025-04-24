import { Types } from "../imports/api/collections";

const types = [
  { name: "kubernetes", description: "Site géré par la DSI et déployé sur Kubernetes", schema: "siteWPSchema" },
  { name: "external", description: "Site hébergé en dehors de l'infrastructure interne", schema: "siteExternal" },
  { name: "archived", description: "Site archivé, conservé à des fins de référence", schema: "siteWPSchema" },
  { name: "deleted", description: "Site supprimé, hors de l'infrastructure active", schema: null },
  { name: "temporary", description: "Site temporaire géré par wp-klneex", schema: null },
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
