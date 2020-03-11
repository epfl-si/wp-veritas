import { withTracker } from 'meteor/react-meteor-data';
import React, { Component, Fragment } from 'react';
import { Link } from 'react-router-dom';
import { Sites } from '../../../api/collections';
import { Loading } from '../Messages';

const Cells = (props) => (
  <tbody>
    { props.sites.map( (site, index) => (
      <tr key={ site._id }>
        <th scope="row">{ index+1 }</th>
        <td><a href={ site.url } target="_blank">{ site.url }</a></td>
        <td >{ site.getWpInfra() }</td>
        <td >{ site.openshiftEnv }</td>
        <td >
          <Link className="mr-2" to={ `/edit/${ site._id }` }>
            <button type="button" style={ {marginBottom: "3px"} } className="btn btn-outline-primary">Éditer</button>
          </Link>
          <Link className="mr-2" to={ `/site-tags/${ site._id }` }>
            <button type="button" style={ {marginBottom: "3px"} } className="btn btn-outline-primary">Associer des tags</button>
          </Link>
          <Link className="mr-2" to={ `/site-professors/${ site._id }` }>
            <button type="button" className="btn btn-outline-primary">Associer des professeurs</button>
          </Link>
          <button 
            type="button" 
            className="btn btn-outline-primary" 
            onClick={ () => { if (window.confirm('Are you sure you wish to delete this item?')) props.deleteSite(site._id) }}
          >Supprimer</button>
        </td>
      </tr>
    ))}
  </tbody>
)

class List extends Component {

  deleteSite = (siteId) => {
    Meteor.call(
      'removeSite',
      siteId, 
      function(error, siteId) {
        if (error) {
          console.log(`ERROR removeSite ${error}`);
        }
      }
    );
  }

  export = () => {

    let sites = Sites.find({}).fetch();

    sites.forEach(function(site) {

      let facutyTags = "";
      let instituteTags = "";
      let clusterTags = "";

      site.tags.forEach(function (tag) {
        if (tag.type === 'faculty') {
          if (facutyTags === "") {
            facutyTags += tag.name_en;
          } else {
            facutyTags += "," + tag.name_en;
          }
        } else if (tag.type === 'institute') {
          if (instituteTags === "") {
            instituteTags += tag.name_en;
          } else {
            instituteTags += "," + tag.name_en;
          }
        } else if (tag.type === 'field-of-research') { 
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

    sites.forEach(function(site) { 
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
          "title",
          "tagline",
          "openshiftEnv",
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
          "createdDate"
        ],
        data: sites
    });
  
    const blob = new Blob([csv], { type: "text/plain;charset=utf-8;" });
    saveAs(blob, "wp-veritas.csv");
  }

  isLoading = () => {
    return this.props.sites === undefined;
  }

  render() {
    let content;
    if (this.isLoading()) {
      content = <Loading />
    } else {
      console.log(this.props.sites);
      content = (
        <Fragment>
          <h4 className="py-4 float-left">Source de vérité des sites WordPress</h4>
          <div className="mt-1 text-right" >
            <button onClick={ (e) => this.export(e) } className="btn btn-primary">Exporter CSV</button>
          </div>
          <table className="table table-striped">
            <thead>
              <tr>
                <th className="w-5" scope="col">#</th>
                <th className="w-25" scope="col">URL</th>
                <th className="w-10" scope="col">Infrastructure VPSI</th>
                <th className="w-10" scope="col">Env. Openshift</th>
                <th className="w-30" >Actions</th>
              </tr>
            </thead>
            <Cells sites={this.props.sites} deleteSite={ this.deleteSite }/>
          </table>
        </Fragment>
      )
    }
    return content;
  }
}
export default withTracker(() => {
  Meteor.subscribe('sites.list');
  return {
    sites: Sites.find({}, {sort: {url: 1}}).fetch(),
  };
})(List);