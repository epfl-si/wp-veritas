const _isIterable = (obj) => {
  // checks for null and undefined
  if (obj == null) {
    return false;
  }
  return typeof obj[Symbol.iterator] === "function";
};

const formatSiteCategories = (sites) => {
  if (_isIterable(sites)) {
    for (let site of sites) {
      if (site.categories) {
        site.categories = site.categories.map((category) => category.name);
      }
    }
  } else {
    if (sites.categories) {
      sites.categories = sites.categories.map((category) => category.name);
    }
  }
  return sites;
};

/**
 * This function returns the ansible host pattern from the url of a site.
 *
 * Example:
 * URL:  https://www.epfl.ch/research/facilities/hydraulic-machines-platform
 * Ansible host: www__research__facilities__hydraulic_machines_platform
 */
const generateAnsibleHostPattern = (site) => {
  const currentURL = new URL(site.url);
  let result = currentURL.host.replace(".epfl.ch", "");

  // Delete the first '/'
  let pathName = currentURL.pathname.slice(1);

  // Delete the last '/'
  pathName = pathName.slice(0, pathName.length - 1);

  // Replace all '/' by '__'
  pathName = pathName.replace(/\//g, "__");

  if (pathName) {
    result += "__" + pathName;
  }

  // Replace all '-' by '_'
  result = result.replace(/-/g, "_");

  return result;
};

export { formatSiteCategories, generateAnsibleHostPattern };
