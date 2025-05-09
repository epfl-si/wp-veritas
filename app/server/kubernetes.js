import * as k8s from "@kubernetes/client-node";
import { Sites } from "../imports/api/collections";

import Debug from "debug";

const debug = Debug("server/kubernetes");

const kc = new k8s.KubeConfig();
kc.loadFromDefault();

const k8sApi = kc.makeApiClient(k8s.CoreV1Api);
const k8sCustomApi = kc.makeApiClient(k8s.CustomObjectsApi);
const k8sWatchApi = new k8s.Watch(kc);

export const getNamespace = () => {
  try {
    if (process.env.K8S_NAMESPACE) {
      return process.env.K8S_NAMESPACE;
    }

    console.warn("K8S_NAMESPACE is not set. Attempting to auto-detect...");

    const contextNamespace = kc.getContextObject(kc.currentContext)?.namespace;
    if (contextNamespace) {
      return contextNamespace;
    }
  } catch (error) {
    console.warn("Could not auto-detect namespace:", error);
  }

  console.log("K8S_NAMESPACE is not set. Defaulting to 'default' namespace.");

  return "default";
};

function makeK8sSiteName (site) {
  const url = new URL(site.url);
  let K8sWPObjectName = url.hostname;

  if (K8sWPObjectName.endsWith("epfl.ch")) {
    K8sWPObjectName = K8sWPObjectName.replace(".epfl.ch", "");
  }

  K8sWPObjectName = `${K8sWPObjectName}${url.pathname}`
  if (K8sWPObjectName && K8sWPObjectName.endsWith('/')) {
    K8sWPObjectName = K8sWPObjectName.slice(0, -1);
  }

  K8sWPObjectName = K8sWPObjectName.replaceAll("/","-");
  let index = 1;
  while (K8sWPObjectName.length >= 50) {
    K8sWPObjectName = K8sWPObjectName.split("-").slice(0, index).map(e => e[0]).concat(K8sWPObjectName.split("-").slice(index)).join("-");
    index++;
  }

  return K8sWPObjectName;
}

export async function createWPSite (site) {
  try {
    if (!site) {
      throw new Error('Site parameter is required');
    }

    const k8sName = makeK8sSiteName(site);
    if (!k8sName) {
      throw new Error('k8sName could not be generated');
    }

    const parsedPlugins = site.categories.reduce((acc, category) => {
      acc[category.name] = {};
      return acc;
    }, {});

    const url = new URL(site.url);
    const hostname = url.hostname;
    let path = url.pathname;
    if (path && path.endsWith('/')) {
      path = path.slice(0, -1);
    }

    const body = {
      metadata: {
        name: k8sName,
      },
      kind: 'WordpressSite',
      apiVersion: 'wordpress.epfl.ch/v2',
      spec: {
        hostname,
        path,
        owner: site.unitId ? {
          epfl: {
            unitId: parseInt(site.unitId),
          },
        } : undefined,
        type: site.type,
        wordpress: {
          debug: true,
          languages: site.languages,
          plugins: parsedPlugins,
          tagline: site.tagline,
          theme: site.theme,
          title: site.title,
        },
      },
    };

    const response = await k8sCustomApi.createNamespacedCustomObject(
      'wordpress.epfl.ch',
      'v2',
      getNamespace(),
      'wordpresssites',
      body,
    );

    return { url };
  } catch (err) {
    console.error('Failed to create WP Site: ', err);
    throw err;
  }
}

export async function deleteWPSite (k8sName) {
  if (process.env.KUBERNETES_FAKE) {
    console.log("deleteWPSite: Kubernetes part stubbed out for tests");
    return;
  }
  try {
    await k8sCustomApi.deleteNamespacedCustomObject(
      'wordpress.epfl.ch',
      'v2',
      getNamespace(),
      'wordpresssites',
      k8sName
    );
  } catch (err) {
    console.error('Failed to delete WP Site: ', err);
    throw err;
  }
}

export async function deleteWPSiteByURL (siteURL) {
  if (process.env.KUBERNETES_FAKE) {
    console.log("deleteWPSiteByURL: stubbed out for tests");
    return;
  }
  try {
    const listWPSites = await k8sCustomApi.listNamespacedCustomObject(
      'wordpress.epfl.ch',
      'v2',
      getNamespace(),
      'wordpresssites'
    );
    const site = listWPSites.body.items.find((site) => {
      const searchedURL = new URL('https://' + site.spec.hostname + site.spec.path);
      if (!site.spec.path.endsWith('/')) {
        searchedURL.pathname += '/';
      }
      return siteURL === searchedURL.toString();
    });
    debug('Try to delete', siteURL);
    if (!site) {
      console.log(`While deleting site ${siteURL}: not found in Kubernetes.`);
    } else {
      await deleteWPSite(site.metadata.name);
    }
  } catch (err) {
    console.error(`Failed to delete ${siteURL} in Kubernetes`, err);
    throw err;
  }
}

export function watchWPSites({added, removed, resourcesChanged}, options) {
  const namespace = getNamespace();

  const sitesByUid = {};
  const dbPingQueue = {};

  if (options?.watchDatabases) {
    async function pingOwnerOfDatabase (db) {
      if (! resourcesChanged) return;
      const uid = db.ownerWordpressSiteUid;
      if (! uid) return;
      if (sitesByUid[uid]) {
        debug("Pinging database", db, "for site", sitesByUid[uid]);
        await resourcesChanged.call({ db }, sitesByUid[uid]);
      } else {
        // We haven't seen the corresponding WordpressSite yet:
        debug("Deferring ping to database (site not yet seen)", db);
        dbPingQueue[uid] = db;
      }
    }

    k8sWatchApi.watch(
      "/apis/k8s.mariadb.com/v1alpha1/namespaces/" + namespace + "/databases",
      {},
      async (type, database) => {
        const db = new K8SDatabase(database);
        debug("Database " + type, db.ownerWordpressSiteUid);
        if (type === "ADDED") {
          await pingOwnerOfDatabase(db);
        } else if ((type === "DELETED")) {
          await pingOwnerOfDatabase(db);
        } else if ((type === "MODIFIED")) {
          await pingOwnerOfDatabase(db);
        }
      },
    () => {
      debug("Stopping Kubernetes watch");
    });
  }

  async function maybeDeferredDatabasePing (site) {
    if (resourcesChanged && site.uid && dbPingQueue[site.uid]) {
      const db = dbPingQueue[site.uid];
      delete db[site.uid];
      debug("deferred ping", db, site);
      await resourcesChanged.call({db}, site);
    }
  }

  k8sWatchApi.watch(
    "/apis/wordpress.epfl.ch/v2/namespaces/" + namespace + "/wordpresssites",
    {},
    async (type, site) => {
      site = new K8SSite(site);
      debug("Site " + type, site.uid);
      if ((type === "ADDED") && added) {
        await added(site);
        sitesByUid[site.uid] = site;
        await maybeDeferredDatabasePing(site);
      } else if ((type === "DELETED") && removed) {
        delete sitesByUid[site.uid];
        await removed(site);
      }
    },
    () => {
      debug("Stopping Kubernetes watch");
    });
}

class _K8SObject {
  constructor(k8sStruct) {
    Object.assign(this, k8sStruct);
  }

  get uid () {
    return this.metadata?.uid;
  }
}

class K8SSite extends _K8SObject {
  get url () {
    return `https://${this.spec.hostname}${this.spec.path}${!this.spec.path.endsWith("/") ? "/" : ""}`;
  }

  get title () {
    return this.spec?.wordpress?.title;
  }
}

class K8SDatabase extends _K8SObject {
  get ownerWordpressSiteUid () {
    const ownerReferences = this.metadata?.ownerReferences;
    if (ownerReferences?.length === 1 && ownerReferences[0].kind === "WordpressSite") {
      return ownerReferences[0].uid;
    }
  }

  databaseStatus () {
    for (const c of (this.status?.conditions || [])) {
      if (c.type === "Ready" && c.status) {
        return "READY"
      } else {
        // TODO: distinguish more cases.
        return "NOT_READY";
      }
    }
  }
}
