import { withTracker } from "meteor/react-meteor-data";
import { Meteor } from "meteor/meteor";
import React, { Component, Fragment } from "react";
import { Link } from "react-router-dom";
import { Loading } from "../Messages";
import { restoreSite } from "../../../api/methods/sites";
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
          <button
            type="button"
            className="btn btn-outline-primary"
              onClick={() => {
                  props.handleClickOnRestoreButton(site._id);
              }}
          >
            Restaurer
          </button>
        </td>
      </tr>
    ))}
  </tbody>
);

class Trash extends Component {

  handleClickOnRestoreButton = (siteId) => {

    let site = Sites.findOne({_id: siteId});

    Swal.fire({
      title: `Voulez vous vraiment restaurer le site: ${ site.url } ?`,
      text: 'Cette action est irréversible',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Oui',
      cancelButtonText: 'Non'
    }).then((result) => {
      if(result.value){
        this.restoreSite(siteId);
      }
    })
  }

  restoreSite = (siteId) => {
    restoreSite.call({ siteId }, function (error, siteId) {
      if (error) {
        console.log(`ERROR restoreSite ${error}`);
      }
    });
  };

  render() {
    let content;
    if (this.props.loading) {
      return <Loading />;
    } else {
      content = (
        <Fragment>
          <h4 className="py-4 float-left">
            Corbeille
          </h4>
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
            <Cells
              sites={this.props.sites}
              handleClickOnRestoreButton={this.handleClickOnRestoreButton}
            />
          </table>
        </Fragment>
      );
      return content;
    }
  }
}

export default withTracker(() => {
  const handle = Meteor.subscribe("deleteSites.list");
  return {
    loading: !handle.ready(),
    sites: Sites.find({ isDeleted: true }, { sort: { url: 1 } }).fetch(),
  };
})(Trash);
