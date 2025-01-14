import { withTracker } from "meteor/react-meteor-data";
import React, { Component, Fragment } from "react";
import { Link } from "react-router-dom";
import { Sites, OpenshiftEnvs, Themes } from "../../../api/collections";
import { Loading } from "../Messages";
import { removeSite } from "../../../api/methods/sites";
import Swal from "sweetalert2";
import Checkbox from "./CheckBox";

const Cells = (props) => (
  <tbody>
    {props.sites.map((site, index) => (
      <tr key={site._id}>
        <th scope="row">{index + 1}</th>
        <td>
          <a href={site.url} target="_blank">
            {site.url}
          </a>
        </td>
        <td>{site.getWpInfra()}</td>
        <td>{site.openshiftEnv}</td>
        <td>
          <Link className="mr-2" to={`/edit/${site._id}`}>
            <button
              type="button"
              style={{ marginBottom: "3px" }}
              className="btn btn-outline-primary"
            >
              Éditer
            </button>
          </Link>
          <Link className="mr-2" to={`/site-tags/${site._id}`}>
            <button
              type="button"
              style={{ marginBottom: "3px" }}
              className="btn btn-outline-primary"
            >
              Associer des tags
            </button>
          </Link>
          <Link className="mr-2" to={`/site-professors/${site._id}`}>
            <button type="button" className="btn btn-outline-primary">
              Associer des professeurs
            </button>
          </Link>
          <button
            type="button"
            className="btn btn-outline-primary"
            onClick={() => {
              props.handleClickOnDeleteButton(site._id);
            }}
          >
            Supprimer
          </button>
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
      openshiftEnv: "no-filter",
      theme: "no-filter",
      languagesFilter: false, // Filter language used ?
      languages: [],
      sites: props.sites,
    };
  }

  // More information here: https://alligator.io/react/get-derived-state/
  static getDerivedStateFromProps(props, state) {
    if (
      state.searchValue === "" &&
      state.openshiftEnv === "no-filter" &&
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

  _createFilters = (keyword, languages, openshiftEnv, theme) => {
    let filters = {};

    if (keyword !== "") {
      filters.url = { $regex: ".*" + keyword + ".*", $options: "i" };
    }

    if (openshiftEnv !== "no-filter") {
      filters.openshiftEnv = openshiftEnv;
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

    const openshiftEnv = this.refs.openshiftEnv.value;
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

    const filters = this._createFilters(keyword, languages, openshiftEnv, theme);
    const sites = Sites.find(filters).fetch();

    let languagesFilter = true;
    if (languages.length === 0) {
      languagesFilter = false;
    }

    this.setState({
      searchValue: keyword,
      openshiftEnv: openshiftEnv,
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

    sites.forEach(function (site) {
      let scipers = [];
      if ("professors" in site) {
        site.professors.forEach(function (professor) {
          scipers.push(professor.sciper);
        });
      }
      site.scipers = scipers;
    });

    const csv = Papa.unparse({
      // Define fields to export
      fields: [
        "_id",
        "url",
        "wpInfra",
        "title",
        "tagline",
        "openshiftEnv",
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
        "scipers",
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
            className="form-inline"
            onSubmit={this.onSubmit}
            style={{ marginTop: "40px", marginBottom: "20px" }}
          >
            <div className="input-group md-form form-sm form-2 pl-0">
              <input
                ref="keyword"
                type="search"
                className="form-control my-0 py-1 block"
                id="search"
                className="form-control my-0 py-1"
                value={this.state.searchValue}
                onChange={this.search}
                placeholder="Filter par mot-clé"
              />
            </div>
            <div className="form-group">
              <select
                ref="openshiftEnv"
                name="openshiftEnv"
                className="form-control mt-0"
                onChange={this.search}
                id="openshift-env-list"
              >
                <option
                  key="0"
                  value="no-filter"
                  label="pas de filtre par env openshift"
                >
                  No Filter
                </option>
                {this.props.openshiftEnvs.map((openshiftEnv, index) => (
                  <option
                    key={openshiftEnv._id}
                    value={openshiftEnv.name}
                    label={openshiftEnv.name}
                  >
                    {openshiftEnv.name}
                  </option>
                ))}
              </select>
              <select
                ref="theme"
                name="theme"
                className="form-control mt-0"
                onChange={this.search}
                id="theme-list"
              >
                <option
                  key="0"
                  value="no-filter"
                  label="pas de filtre par thème"
                >
                  No Filter
                </option>
                {this.props.themes.map((theme, index) => (
                  <option key={theme._id} value={theme.name} label={theme.name}>
                    {theme.name}
                  </option>
                ))}
              </select>
              </div>

              <div id="languages-checkbox">
                <span>Filter par langues: </span>
              {languages.map((lang) => (
                <label key={lang.key} >
                  <span style={{ marginLeft: "15px" }}>{lang.label}&nbsp;</span>
                  <Checkbox ref={lang.key} name={lang.name} checked={ this.isChecked(lang) } onChange={this.search} />
                </label>
              ))}
              </div>
            
          </form>
          <table className="table table-striped">
            <thead>
              <tr>
                <th className="w-5" scope="col">
                  # {this.state.sites.length }
                </th>
                <th className="w-25" scope="col">
                  URL
                </th>
                <th className="w-10" scope="col">
                  Infrastructure VPSI
                </th>
                <th className="w-10" scope="col">
                  Env. Openshift
                </th>
                <th className="w-30">Actions</th>
              </tr>
            </thead>
            <Cells
              sites={this.state.sites}
              handleClickOnDeleteButton={this.handleClickOnDeleteButton}
            />
          </table>
        </Fragment>
      );
    }
    return content;
  }
}
export default withTracker(() => {
  const handles = [
    Meteor.subscribe("sites.list"),
    Meteor.subscribe("openshiftEnv.list"),
    Meteor.subscribe("theme.list"),
  ];
  return {
    loading: handles.some((handle) => !handle.ready()),
    sites: Sites.find({ isDeleted: false }, { sort: { url: 1 } }).fetch(),
    openshiftEnvs: OpenshiftEnvs.find({}, { sort: { name: 1 } }).fetch(),
    themes: Themes.find({}, { sort: { name: 1 } }).fetch(),
  };
})(List);
