import { withTracker } from "meteor/react-meteor-data";
import React, { Component, Fragment } from "react";
import { Link } from "react-router-dom";
import { Sites, Themes, Types } from "../../../api/collections";
import { Loading } from "../Messages";
import { removeSite } from "../../../api/methods/sites";
import Swal from "sweetalert2";
import Checkbox from "./CheckBox";

const Cells = (props) => (
  <tbody>
    {props.sites.map((site, index) => (
      <tr key={site._id} className="align-middle">
        <th scope="row" className="align-middle text-center">{index + 1}</th>
        <td className="align-middle pl-0">
          <a href={site.url} target="_blank" className="text-break">
            {site.url}
          </a>
        </td>
        <td className="align-middle text-center">
          <span className={`badge p-2 type-${site.type} text-uppercase`}>
            {site.type}
          </span>
        </td>
        <td className="">
          <div className="d-flex flex-wrap justify-content-center">
            <Link to={`/edit/${site._id}`} className="mr-2">
              <button
                type="button"
                className="btn btn-outline-primary btn-sm"
              >
                Éditer
              </button>
            </Link>
            <Link to={`/site-tags/${site._id}`} className="mr-2">
              <button
                type="button"
                className="btn btn-outline-primary btn-sm"
              >
                Associer des tags
              </button>
            </Link>
            <button
              type="button"
              className="btn btn-outline-danger btn-sm"
              onClick={() => {
                props.handleClickOnDeleteButton(site._id);
              }}
            >
              Supprimer
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
    this.state = {
      searchValue: "",
      type: "no-filter",
      theme: "no-filter",
      languagesFilter: false, // Filter language used ?
      languages: [],
      sites: props.sites,
      types: props.types,
    };
  }

  // More information here: https://alligator.io/react/get-derived-state/
  static getDerivedStateFromProps(props, state) {
    if (
      state.searchValue === "" &&
      state.type === "no-filter" &&
      state.theme === "no-filter" &&
      state.languagesFilter === false &&
      props.sites != state.sites
    ) {
      // Set state with props
      return {
        sites: props.sites,
      };
    }
    // Return null if the state hasn't changed
    return null;
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
      await removeSite({ siteId });
    } catch (error) {
      console.error("deleteSite", error);
    }
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

    this.setState({
      searchValue: keyword,
      type: type,
      theme: theme,
      sites: sites,
      languages: languages,
      languagesFilter: languagesFilter,
    });
  };

  export = () => {
    // Export search result
    let sites = this.state.sites;

    sites.forEach(function (site) {
      site.categories = site.categories
        .map((category) => category.name)
        .join(",");

      let facultyTags = "";
      let instituteTags = "";
      let clusterTags = "";

      site.tags.forEach(function (tag) {
        if (tag.type === "faculty") {
          if (facultyTags === "") {
            facultyTags += tag.name_en;
          } else {
            facultyTags += "," + tag.name_en;
          }
        } else if (tag.type === "institute") {
          if (instituteTags === "") {
            instituteTags += tag.name_en;
          } else {
            instituteTags += "," + tag.name_en;
          }
        } else if (tag.type === "field-of-research") {
          if (clusterTags === "") {
            clusterTags += tag.name_en;
          } else {
            clusterTags += "," + tag.name_en;
          }
        }
      });

      site.facultyTags = facultyTags;
      site.instituteTags = instituteTags;
      site.clusterTags = clusterTags;
    });

    const csv = Papa.unparse({
      // Define fields to export
      fields: [
        "_id",
        "url",
        "wpInfra",
        "title",
        "tagline",
        "type",
        "categories",
        "theme",
        "faculty",
        "languages",
        "unitId",
        "unitName",
        "unitNameLevel2",
        "snowNumber",
        "status",
        "facultyTags",
        "instituteTags",
        "clusterTags",
        "createdDate",
      ],
      data: sites,
    });

    const blob = new Blob([csv], { type: "text/plain;charset=utf-8;" });
    saveAs(blob, "wp-veritas.csv");
  };

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
                    value={this.state.searchValue}
                    onChange={this.search}
                    placeholder="Filtrer par mot-clé"
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
              <label className="mb-0">Filtrer par langues :</label>
              <div className="d-flex flex-wrap" id="languages-checkbox">
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
          </form>

          
          <div className="table-responsive">
            <table className="table table-striped">
              <thead className="table-light">
                <tr>
                  <th className="text-center" scope="col" style={{ width: "7%" }}>
                    # {this.props.sites.length}
                  </th>
                  <th className="w-50 pl-0" scope="col">
                    URL
                  </th>
                  <th className="w-10 text-center" scope="col">
                    Type
                  </th>
                  <th className="w-20 text-center">Actions</th>
                </tr>
              </thead>
              <Cells
                sites={this.state.sites}
                handleClickOnDeleteButton={this.handleClickOnDeleteButton}
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
    Meteor.subscribe("theme.list"),
    Meteor.subscribe("type.list"),
  ];
  return {
    loading: handles.some((handle) => !handle.ready()),
    sites: Sites.find({}, { sort: { url: 1 } }).fetch(),
    themes: Themes.find({}, { sort: { name: 1 } }).fetch(),
    types: Types.find({}, { sort: { name: 1 } }).fetch(),
  };
})(List);
