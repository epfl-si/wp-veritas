import { withTracker } from "meteor/react-meteor-data";
import React, { Component, Fragment } from "react";
import { Link } from "react-router-dom";
import { Sites } from "../../../api/collections";
import { Loading } from "../Messages";
import { removeSite } from "../../../api/methods/sites";
import Swal from 'sweetalert2'

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
      sites: props.sites
    };
  }

  // More information here: https://alligator.io/react/get-derived-state/
  static getDerivedStateFromProps(props, state) {
    if (props.sites != state.sites) {
      // Set state with props
      return {
        sites: props.sites,
      }
    }
    // Return null if the state hasn't changed
    return null;
  }

  handleClickOnDeleteButton = (siteId) => {

    let site = Sites.findOne({_id: siteId});

    Swal.fire({
      title: `Voulez vous vraiment supprimer le site: ${ site.url } ?`,
      text: 'Cette action est irréversible',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Oui',
      cancelButtonText: 'Non'
    }).then((result) => {
      if(result.value){
        this.deleteSite(siteId);
        // Delete site of state component
        let sites = this.state.sites.filter((site) => { return site._id !== siteId });
        this.setState({sites: sites});
      }
    })
  }

  deleteSite = (siteId) => {
    removeSite.call({ siteId }, function (error, siteId) {
      if (error) {
        console.log(`ERROR removeSite ${error}`);
      }
    });
  };

  search = (event) => {
    const keyword = event.target.value;
    const sites = Sites.find({"url": {$regex: ".*" + keyword + ".*", '$options' : 'i'}}).fetch();
    this.setState({ searchValue: keyword, sites: sites });
  };

  export = () => {
    let sites = Sites.find({}).fetch();

    sites.forEach(function (site) {
      let facutyTags = "";
      let instituteTags = "";
      let clusterTags = "";

      site.tags.forEach(function (tag) {
        if (tag.type === "faculty") {
          if (facutyTags === "") {
            facutyTags += tag.name_en;
          } else {
            facutyTags += "," + tag.name_en;
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

      site.facutyTags = facutyTags;
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
        "category",
        "theme",
        "faculty",
        "languages",
        "unitId",
        "unitName",
        "unitNameLevel2",
        "snowNumber",
        "status",
        "facutyTags",
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
    
    if (this.props.loading && this.state.sites.lenght == 0) {
      return <Loading />;
    } else {
      content = (
        <Fragment>
          <h4 className="py-4 float-left">
            Source de vérité des sites WordPress
          </h4>
          <div className="mt-1 text-right">
            <button onClick={(e) => this.export(e)} className="btn btn-primary">
              Exporter CSV
            </button>
          </div>
          <form onSubmit={this.onSubmit}>
            <div className="input-group md-form form-sm form-2 pl-0">
              <input
                type="search"
                className="form-control my-0 py-1"
                value={ this.state.searchValue }
                onChange={this.search}
                placeholder="Filter par mot-clé"
              />
            </div>
          </form>
          <table className="table table-striped">
            <thead>
              <tr>
                <th className="w-5" scope="col">
                  #
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
            <Cells sites={this.state.sites} handleClickOnDeleteButton={this.handleClickOnDeleteButton} />
          </table>
        </Fragment>
      );
    }
    return content;
  }
}
export default withTracker(() => {
  const handle = Meteor.subscribe("sites.list");
  return {
    loading: !handle.ready(),
    sites: Sites.find({}, { sort: { url: 1 } }).fetch(),
  };
})(List);
