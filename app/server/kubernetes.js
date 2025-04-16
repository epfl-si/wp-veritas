import * as k8s from "@kubernetes/client-node";
import { Sites } from "../imports/api/collections";

import Debug from "debug";

const debug = Debug("server/publications");

const kc = new k8s.KubeConfig();
kc.loadFromDefault();

const k8sApi = kc.makeApiClient(k8s.CoreV1Api);
const k8sCustomApi = kc.makeApiClient(k8s.CustomObjectsApi);
const k8sWatchApi = new k8s.Watch(kc);

const getNamespace = () => {
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
  // TODO:
  // - Check the k8s name's length (63)
  // - Call another function to check that the WPSite doesn't exist
  return "new-site";
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

    const body = { // Define body according to required schema
      metadata: {
        name: k8sName,
      },
      kind: 'WordpressSite',
      apiVersion: 'wordpress.epfl.ch/v2',
      spec: {
        hostname: 'wpn-test.epfl.ch',
        path: '/from-wp-veritas',
        owner: {
          epfl: {
            unitId: 13030,
          },
        },
        wordpress: {
          debug: true,
          languages: ['en', 'fr'],
          plugins: {
            'epfl-menus': {}
          },
          tagline: 'École polytechnique fédérale de Lausanne',
          theme: 'wp-theme-2018',
          title: 'from wp veritas',
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

    return { k8sName };
  } catch (err) {
    console.error('Failed to create WP Site: ', err);
    throw err;
  }
}

export async function deleteWPSite (k8sName) {
  try {
    await k8sCustomApi.deleteNamespacedCustomObject(
      'wordpress.epfl.ch',
      'v2',
      getNamespace(),
      'wordpresssites',
      k8sName
    );
  } catch (err) {
    console.error('Failed to create WP Site: ', err);
    throw err;
  }
}

Meteor.startup( () => {
  const namespace = getNamespace();
  k8sWatchApi.watch(
    "/apis/wordpress.epfl.ch/v2/namespaces/" + namespace + "/wordpresssites",
    {},
    async (type, site) => {
      debug("Site " + type);
      if (type === "ADDED") {
        await Sites.insertAsync({
          k8sName: site.metadata.name,
          url: site.spec.hostname + site.spec.path,
          title: site.spec.wordpress.title,
          tagline: site.spec.wordpress.tagline,
          openshiftEnv: "kubernetes",
          categories: [],
          theme: site.spec.wordpress.theme,
          platformTarget: "kubernetes",
          languages: site.spec.wordpress.languages,
          unitId: site.spec.owner.epfl.unitId,
          createdDate: site.metadata.creationTimestamp,
        });
      } else if (type === "DELETED") {
        const toDelete = await Sites.find({url: site.spec.hostname + site.spec.path}).fetchAsync();
        debug(`toDelete has ${toDelete.length} entries`);
        if (toDelete.length == 1) {
          await Sites.removeAsync({_id: toDelete[0]._id});
        } else if (toDelete.length > 1) {
          throw new Error(`Unexpected multiple matches on a search on ${site.metadata.name}: ${toDelete.length} items`)
        }
      }
    },
    () => {
      debug("Stopping Kubernetes watch");
    });
});
