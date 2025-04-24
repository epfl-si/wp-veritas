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

export { formatSiteCategories };
