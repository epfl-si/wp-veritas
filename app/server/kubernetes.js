import * as k8s from "@kubernetes/client-node";

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

export { k8sApi, k8sCustomApi, k8sWatchApi, getNamespace };
