import * as k8s from "@kubernetes/client-node";
import { Sites } from "../imports/api/collections";

import Debug from "debug";

const debug = Debug("server/publications");

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
        owner: {
          epfl: {
            unitId: parseInt(site.unitId),
          },
        },
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

export function watchWPSites({added, removed}) {
  const namespace = getNamespace();
  k8sWatchApi.watch(
    "/apis/wordpress.epfl.ch/v2/namespaces/" + namespace + "/wordpresssites",
    {},
    async (type, site) => {
      debug("Site " + type);
      if (type === "ADDED") {
        await added(site);
      } else if (type === "DELETED") {
        await removed(site);
      }
    },
    () => {
      debug("Stopping Kubernetes watch");
    });
}
