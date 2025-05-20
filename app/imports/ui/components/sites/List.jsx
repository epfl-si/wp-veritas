import { withTracker } from "meteor/react-meteor-data";
import React, { Component, Fragment } from "react";
import { Link } from "react-router-dom";
import { Sites, Themes, Types } from "../../../api/collections";
import { Loading } from "../Messages";
import { removeSite, getDaysFromDate } from "../../../api/methods/sites";
import Swal from "sweetalert2";
import Checkbox from "./CheckBox";
import url from "url";
import { bouncyCircle } from "../spinners"
import { AlertTriangle, Database, FileText, Globe, Info, Pencil, Tags, Trash2, X } from "lucide-react";

const SortableHeader = ({ title, className, column, currentSort, onSort }) => {
  const isActive = currentSort.column === column;
  const direction = isActive ? (currentSort.direction === 'asc' ? '↑' : '↓') : '';
  
  return (
    <th 
      className={`${className} ${isActive ? 'active-sort' : ''} cursor-pointer`} 
      scope="col"
      onClick={() => onSort(column)}
    >
      {title} {direction}
    </th>
  );
};

const Cells = (props) => (
  <tbody>
    {props.sites.map((site, index) => (
      <tr key={site._id} className="align-middle">
        <td className="align-middle pl-3">
          <a href={site.url} target="_blank" className="text-break d-flex align-items-center">
            <Globe size={16} className="mr-2" />
            <span>{site.url}</span>
          </a>
        </td>
        <td className="align-middle text-center">
          <span className={`badge p-2 type-${site.type.toLowerCase()} text-uppercase`}>
            {site.type}
          </span>
        </td>
        <td className="align-middle text-center">
          { props.monitorSiteChanging[site.url] ?
              bouncyCircle
              :
            <input
              type="checkbox"
              checked={site.monitorSite}
              title={ (site.monitorSite) ? 'Site is monitored' : 'Site is not monitored' }
              onChange={(event) => {
                props.setMonitor(event.target, site.url, !site.monitorSite);
                event.preventDefault();
              }}
            />
          }
        </td>
        <td className="align-middle text-center">
          {site.k8sDatabaseStatus === 'READY' && (
            <span className="badge d-flex align-items-center justify-content-center">
              <Database size={14} className="mr-1" />
              <span>READY</span>
            </span>
          )}
          {site.k8sDatabaseStatus === 'UNKNOWN' && (
            <span className="badge d-flex align-items-center justify-content-center">
              <AlertTriangle size={14} className="mr-1" />
              <span>UNKNOWN</span>
            </span>
          )}
          {site.k8sDatabaseStatus === 'DOWN' && (
            <span className="badge d-flex align-items-center justify-content-center">
              <X size={14} className="mr-1" />
              <span>DOWN</span>
            </span>
          )}
          {site.k8sDatabaseStatus && !['READY', 'UNKNOWN', 'DOWN'].includes(site.k8sDatabaseStatus) && (
            <span className="badge d-flex align-items-center justify-content-center">
              <X size={14} className="mr-1" />
              <span>{site.k8sDatabaseStatus}</span>
            </span>
          )}
        </td>
        <td className="align-middle text-center" data-date={site.getCreatedDate()?.toString()} title={site.getCreatedDate()?.toString()} >
          {getDaysFromDate(site.getCreatedDate())}
        </td>
        <td className="">
          <div className="d-flex flex-wrap justify-content-center">
            <Link to={`/search/${site._id}`}>
              <button
                type="button"
                className="btn btn-outline-success btn-sm mr-1 p-1 d-flex align-items-center justify-content-center"
                title="Voir les info"
                disabled={site.type === 'external'}
              >
                <Info size={20} />
              </button>
            </Link>
            <button
              type="button"
              className="btn btn-outline-success btn-sm mr-2 p-1 d-flex align-items-center justify-content-center"
              title={ (site.type === 'kubernetes') ? 'View site YAML' : 'Not a Kubernetes site' }
              onClick={() => {
                props.handleViewSiteYAML(site._id);
              }}
              disabled={site.type !== 'kubernetes'}
            >
              <FileText size={20} />
            </button>

            <Link to={`/edit/${site._id}`}>
              <button
                type="button"
                className="btn btn-outline-primary btn-sm mr-1 p-1 d-flex align-items-center justify-content-center"
                title="Éditer le site"
              >
                <Pencil size={20} />
              </button>
            </Link>
            <Link to={`/site-tags/${site._id}`}>
              <button
                type="button"
                className="btn btn-outline-primary btn-sm mr-2 p-1 d-flex align-items-center justify-content-center"
                title="Associer des tags"
              >
                <Tags size={20} />
              </button>
            </Link>

            <button
              type="button"
              className="btn btn-outline-danger btn-sm p-1 d-flex align-items-center justify-content-center"
              title="Supprimer le site"
              onClick={() => {
                props.handleClickOnDeleteButton(site._id);
              }}
            >
              <Trash2 size={20} />
            </button>
          </div>
        </td>
      </tr>
    ))}
  </tbody>
);

class List extends Component {
  constructor(props) {
    super(props);
    
    const initialSort = {
      column: 'age',
      direction: 'desc'
    };
    
    this.state = {
      searchValue: "",
      type: "kubernetes",
      theme: "no-filter",
      languagesFilter: false,
      languages: [],
      sites: props.sites ? this.applySortAndFilter(props.sites, "kubernetes", initialSort) : [],
      types: props.types || [],
      monitorSiteChanging: {},
      sort: initialSort
    };
  }

  applySortAndFilter(sites, typeFilter, sort = { column: 'url', direction: 'asc' }) {
    let filteredSites = sites;
    if (typeFilter && typeFilter !== "no-filter") {
      filteredSites = sites.filter(site => site.type === typeFilter);
    }
    
    return this.sortSites(filteredSites, sort);
  }

  sortSites(sites, sort) {
    if (!sites || !Array.isArray(sites)) {
      return [];
    }
    
    return sites.slice().sort((a, b) => {
      let valueA, valueB;

      switch(sort.column) {
        case 'url':
          valueA = (a.url || '').toLowerCase();
          valueB = (b.url || '').toLowerCase();
          break;
        case 'type':
          valueA = (a.type || '').toLowerCase();
          valueB = (b.type || '').toLowerCase();
          break;
        case 'monitored':
          valueA = a.monitorSite ? 1 : 0;
          valueB = b.monitorSite ? 1 : 0;
          break;
        case 'database':
          valueA = a.k8sDatabaseStatus || '';
          valueB = b.k8sDatabaseStatus || '';
          break;
        case 'age':
          valueA = a.getCreatedDate() ? new Date(a.getCreatedDate()).getTime() : 0;
          valueB = b.getCreatedDate() ? new Date(b.getCreatedDate()).getTime() : 0;
          break;
        default:
          valueA = a[sort.column];
          valueB = b[sort.column];
      }

      if (sort.direction === 'asc') {
        return valueA > valueB ? 1 : valueA < valueB ? -1 : 0;
      } else {
        return valueA < valueB ? 1 : valueA > valueB ? -1 : 0;
      }
    });
  }

  static getDerivedStateFromProps(props, state) {
    if (
      state.searchValue === "" &&
      state.theme === "no-filter" &&
      state.languagesFilter === false &&
      props.sites !== state.originalSites
    ) {
      const filteredSites = state.type === "no-filter" ? 
        props.sites : 
        props.sites.filter(site => site.type === state.type);
      
      return {
        sites: filteredSites.slice().sort((a, b) => {
          let valueA, valueB;
          
          switch(state.sort.column) {
            case 'url':
              valueA = (a.url || '').toLowerCase();
              valueB = (b.url || '').toLowerCase();
              break;
            case 'type':
              valueA = (a.type || '').toLowerCase();
              valueB = (b.type || '').toLowerCase();
              break;
            case 'monitored':
              valueA = a.monitorSite ? 1 : 0;
              valueB = b.monitorSite ? 1 : 0;
              break;
            case 'database':
              valueA = a.k8sDatabaseStatus || '';
              valueB = b.k8sDatabaseStatus || '';
              break;
            case 'age':
              valueA = a.getCreatedDate() ? new Date(a.getCreatedDate()).getTime() : 0;
              valueB = b.getCreatedDate() ? new Date(b.getCreatedDate()).getTime() : 0;
              break;
            default:
              valueA = a[state.sort.column];
              valueB = b[state.sort.column];
          }

          if (state.sort.direction === 'asc') {
            return valueA > valueB ? 1 : valueA < valueB ? -1 : 0;
          } else {
            return valueA < valueB ? 1 : valueA > valueB ? -1 : 0;
          }
        }),
        originalSites: props.sites
      };
    }
    return null;
  }

  handleSort = (column) => {
    this.setState(prevState => {
      const direction = prevState.sort.column === column && prevState.sort.direction === 'asc' ? 'desc' : 'asc';
      const sort = { column, direction };
      
      const sortedSites = this.sortSites(prevState.sites, sort);
      
      return { sort, sites: sortedSites };
    });
  }

  onSubmit = (e) => {
    e.preventDefault();
  }

  handleClickOnDeleteButton = (siteId) => {
    let site = Sites.findOne({ _id: siteId });

    Swal.fire({
      title: `Voulez vous vraiment supprimer le site: ${site.url} ?`,
      text: "Cette action est irréversible",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Oui",
      cancelButtonText: "Non",
    }).then((result) => {
      if (result.value) {
        this.deleteSite(siteId);
        // Delete site of state component
        let sites = this.state.sites.filter((site) => {
          return site._id !== siteId;
        });
        this.setState({ sites: sites });
      }
    });
  };

  deleteSite = async (siteId) => {
    try {
      await removeSite({ url: siteId });
    } catch (error) {
      console.error("deleteSite", error);
    }
  };

  handleViewSiteYAML = (siteId) => {
    let site = Sites.findOne({ _id: siteId });
    Swal.fire({
      title: `${site.k8sName}`,
      titleText: `${site.k8sName}`,
      icon: "info",
      html: `
<pre style="text-align: left;">
apiVersion: wordpress.epfl.ch/v2
kind: WordpressSite
metadata:
  name: ${site.k8sName}
  namespace: XXXsvc0041t-wordpress
spec:
  hostname: ${url.parse(site.url).hostname}
  owner:
    epfl:
      unitId: ${site.unitId}
  path: ${ (url.parse(site.url).path.replace(/\/$/, '') == '') ? '/' : url.parse(site.url).path.replace(/\/$/, '') }
  wordpress:
    debug: false
    title: "${site.title}"
    tagline: "${site.tagline}"
    theme: ${site.theme}
    languages:
${site.languages.map(lang => `    - ${lang}`).join('\n')}
    plugins:
      XXXepfl-menus: {}
</pre>
      `,
      showCloseButton: true,
      confirmButtonText: 'Ok!',
    });
  };

  isChecked = (langIsChecked) => {
    let find = false;
    this.state.languages.forEach(lang => {
      if (lang === langIsChecked.name) {
        find = true
      }
    })
    return find;
  }

  _createFilters = (keyword, languages, type, theme) => {
    let filters = {};

    if (keyword !== "") {
      filters.url = { $regex: ".*" + keyword + ".*", $options: "i" };
    }

    if (type !== "no-filter") {
      filters.type = type;
    }
    if (theme !== "no-filter") {
      filters.theme = theme;
    }
    if (languages.length > 0) {
      filters.languages = { $all: languages };
    }
    return filters;
  }


  search = () => {
    const type = this.refs.type.value;
    const theme = this.refs.theme.value;
    const keyword = this.refs.keyword.value;

    let languages = [];
    for (const property in this.refs) {
      if (property.startsWith('lang')) {
        if (this.refs[property].checked) {
          languages.push(this.refs[property].name);
        }
      }
    }

    const filters = this._createFilters(keyword, languages, type, theme);
    const sites = Sites.find(filters).fetch();

    let languagesFilter = true;
    if (languages.length === 0) {
      languagesFilter = false;
    }
    
    const sortedSites = this.sortSites(sites, this.state.sort);

    this.setState({
      searchValue: keyword,
      type: type,
      theme: theme,
      sites: sortedSites,
      languages: languages,
      languagesFilter: languagesFilter,
    });
  };

  setMonitor = async (eventTarget, url, status) => {
    this.setState(
      ({monitorSiteChanging}) => (
        {monitorSiteChanging: {[url]: true, ...monitorSiteChanging}}
      )
    );
    await Meteor.callAsync('setMonitor', { url, status });
    this.setState(
      ({monitorSiteChanging}) => {
        monitorSiteChanging = {...monitorSiteChanging};
        delete monitorSiteChanging[url];
        return {monitorSiteChanging}
      }
    );
  }

  export = () => {
    // Export search result
    let sites = this.state.sites;

    sites.forEach(function (site) {
      site.categories = site.categories.join(",");
      
      site.createdDate = site.getCreatedDate().toISOString()

      // let facultyTags = "";
      // let instituteTags = "";
      // let clusterTags = "";

      // site.tags.forEach(function (tag) {
      //   if (tag.type === "faculty") {
      //     if (facultyTags === "") {
      //       facultyTags += tag.name_en;
      //     } else {
      //       facultyTags += "," + tag.name_en;
      //     }
      //   } else if (tag.type === "institute") {
      //     if (instituteTags === "") {
      //       instituteTags += tag.name_en;
      //     } else {
      //       instituteTags += "," + tag.name_en;
      //     }
      //   } else if (tag.type === "field-of-research") {
      //     if (clusterTags === "") {
      //       clusterTags += tag.name_en;
      //     } else {
      //       clusterTags += "," + tag.name_en;
      //     }
      //   }
      // });

      // site.facultyTags = facultyTags;
      // site.instituteTags = instituteTags;
      // site.clusterTags = clusterTags;
    });

    const csv = Papa.unparse({
      // Define fields to export
      fields: [
        "_id",
        "url",
        "title",
        "tagline",
        "type",
        "categories",
        "theme",
        "faculty",
        "languages",
        "unitId",
        "snowNumber",
        "status",
        // "facultyTags",
        // "instituteTags",
        // "clusterTags",
        "createdDate",
      ],
      data: sites,
    });

    const blob = new Blob([csv], { type: "text/plain;charset=utf-8;" });
    const today = new Date().toISOString().split('T')[0];
    saveAs(blob, `wp-veritas_export_${today}.csv`);
  };

  componentDidMount() {
    if (this.props.sites) {
      this.setState({ originalSites: this.props.sites });
    }
  }

  render() {
    let content;

    if (this.props.loading) {
      return <Loading />;
    } else {
      const languages = [
        {
          name: "fr",
          key: "langFr",
          label: "Français",
        },
        {
          name: "en",
          key: "langEn",
          label: "Anglais",
        },
        {
          name: "de",
          key: "langDe",
          label: "Allemand",
        },
        {
          name: "it",
          key: "langIt",
          label: "Italien",
        },
        {
          name: "es",
          key: "langEs",
          label: "Espagnol",
        },
        {
          name: "el",
          key: "langGr",
          label: "Grec",
        },
        {
          name: "ro",
          key: "langRo",
          label: "Roumain",
        },
      ];
      content = (
        <Fragment>
          <h4 className="py-3 float-left">
            Source de vérité des sites WordPress
          </h4>
          <div className="mt-1 text-right">
            <button onClick={(e) => this.export(e)} className="btn btn-primary">
              Exporter CSV
            </button>
          </div>
          <form
            onSubmit={this.onSubmit}
            style={{ marginTop: "40px", marginBottom: "20px" }}
          >
            <div className="d-flex w-100 align-items-center gap-3 mb-3">
                <div style={{flex: 1}}>
                  <label htmlFor="search">Mot-clé</label>
                  <input
                    ref="keyword"
                    type="search"
                    id="search"
                    className="form-control"
                    defaultValue={this.state.searchValue}
                    onChange={this.search}
                    placeholder="Filtrer par mot-clé"
                    autoFocus
                  />
                </div>
                <div className="ml-2">
                  <label htmlFor="type-list">Type</label>
                  <select
                    ref="type"
                    name="type"
                    className="form-control"
                    onChange={this.search}
                    id="type-list"
                    defaultValue="kubernetes"
                  >
                    <option key="0" value="no-filter">Pas de filtre type</option>
                    {this.props.types.map((type) => (
                      <option key={type._id} value={type.name}>
                        {type.name.charAt(0).toUpperCase() + type.name.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="ml-2">
                  <label htmlFor="theme-list">Thème</label>
                  <select
                    ref="theme"
                    name="theme"
                    className="form-control"
                    onChange={this.search}
                    id="theme-list"
                    defaultValue={this.state.theme}
                  >
                    <option key="0" value="no-filter">Pas de filtre par thème</option>
                    {this.props.themes.map((theme) => (
                      <option key={theme._id} value={theme.name}>
                        {theme.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            <div className="form-group">
              <div className="d-flex flex-row justify-content-between" id="prout">
                <div id="languages-checkbox">
                  <label className="mb-0">Filtrer par langues :</label>
                  <div className="d-flex flex-item">
                    {languages.map((lang) => (
                      <div key={lang.key} className="form-check mr-2">
                        <input
                          className="form-check-input"
                          type="checkbox"
                          ref={lang.key}
                          name={lang.name}
                          checked={this.isChecked(lang)}
                          onChange={this.search}
                          id={`lang-${lang.key}`}
                        />
                        <label className="form-check-label" htmlFor={`lang-${lang.key}`}>
                          {lang.label}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="d-flex flex-row" id="numbers-container">
                  <div className="p-2 ml-2 text-center rounded border border-dark">
                    <b>{this.state.sites.length}</b>
                    <div>sites au total</div>
                  </div>
                  <div className="p-2 ml-2 text-center rounded border border-success">
                    <b>{this.state.sites.filter(o => o.type === 'kubernetes').length}</b>
                    <div>sites k8s</div>
                  </div>
                  <div className="p-2 ml-2 text-center rounded border border-primary">
                    <b>{this.state.sites.filter(o => o.type !== 'kubernetes').length}</b>
                    <div>sites autres</div>
                  </div>
                </div>
              </div>
            </div>
          </form>

          <div className="table-responsive">
            <table className="table table-striped">
              <thead className="table-light">
                <tr>
                  <SortableHeader 
                    title="URL" 
                    column="url"
                    currentSort={this.state.sort}
                    onSort={this.handleSort}
                    className="w-50 pl-3"
                  />
                  <SortableHeader 
                    title="Type" 
                    column="type"
                    currentSort={this.state.sort}
                    onSort={this.handleSort}
                    className="w-10 text-center"
                  />
                  <SortableHeader 
                    title="Monitored" 
                    column="monitored"
                    currentSort={this.state.sort}
                    onSort={this.handleSort}
                    className="w-10 text-center"
                  />
                  <SortableHeader 
                    title="Database" 
                    column="database"
                    currentSort={this.state.sort}
                    onSort={this.handleSort}
                    className="w-10 text-center"
                  />
                  <SortableHeader 
                    title="Age" 
                    column="age"
                    currentSort={this.state.sort}
                    onSort={this.handleSort}
                    className="w-10 text-center"
                  />
                  <th className="w-15 text-center">Actions</th>
                </tr>
              </thead>
              <Cells
                sites={this.state.sites}
                handleClickOnDeleteButton={this.handleClickOnDeleteButton}
                handleViewSiteYAML={this.handleViewSiteYAML}
                monitorSiteChanging={this.state.monitorSiteChanging}
                setMonitor={this.setMonitor}
              />
            </table>
          </div>
        </Fragment>
      );
    }
    return content;
  }
}

export default withTracker(() => {
  const handles = [
    Meteor.subscribe("sites.list"),
    Meteor.subscribe("k8ssites.list"),
    Meteor.subscribe("theme.list"),
    Meteor.subscribe("type.list"),
  ];
  return {
    loading: handles.some((handle) => !handle.ready()),
    sites: Sites.find({}).fetch(),
    themes: Themes.find({}, { sort: { name: 1 } }).fetch(),
    types: Types.find({}, { sort: { name: 1 } }).fetch(),
  };
})(List);
