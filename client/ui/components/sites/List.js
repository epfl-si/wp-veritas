import { withTracker } from 'meteor/react-meteor-data';
import React from 'react';
import { NavLink } from 'react-router-dom';
import { Sites } from '../../../../both/collections';

class Cells extends React.Component {
    render() {
        return (
            <tbody>
                {this.props.sites.map( (site, index) => (
                    <tr key={site._id}>
                        <th scope="row">{index+1}</th>
                        <td><a href={site.url} target="_blank">{site.url}</a></td>
                        <td>{site.type}</td>
                        <td>{site.faculty}</td>
                        <td>{site.getStatus()}</td>
                        <td>
                            <NavLink className="mr-2" activeClassName="active" to={`/edit/${site._id}`}>
                                <button type="button" className="btn btn-outline-primary">Voir toutes les infos</button>
                            </NavLink>
                            <NavLink className="mr-2" activeClassName="active" to={`/edit/${site._id}`}>
                                <button type="button" className="btn btn-outline-primary">Éditer</button>
                            </NavLink>
                            <NavLink className="mr-2" activeClassName="active" to={`/site-tags/${site._id}`}>
                                <button type="button" className="btn btn-outline-primary">Associer des tags</button>
                            </NavLink>
                            <button type="button" className="btn btn-outline-primary" onClick={() => this.props.deleteSite(site._id)}>Supprimer</button>
                        </td>
                    </tr>
                ))}
            </tbody>
        )
    }
}

class List extends React.Component {

    deleteSite = (siteId) => {
        const sites = [...this.props.sites.filter(site => site._id !== siteId)];
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
       const csv = Papa.unparse({
           // Define fields to export
           fields: [
               "url",
               "title",
               "tagline",
               "openshiftEnv",
               "type",
               "theme",
               "faculty",
               "languages",
               "unitId",
               "snowNumber",
               "status",
               "comment",
               "plannedClosingDate",
               "requestedDate",
               "createdDate",
               "archivedDate",
               "trashedDate"
            ],
            data: Sites.find({}).fetch()
        });
  
        const blob = new Blob([csv], { type: "text/plain;charset=utf-8;" });
        saveAs(blob, "wp-veritas.csv");
    }

    render() {
        let content = (
            <div className="">
            
            <h4 className="py-4 float-left">Source de vérité des sites WordPress</h4>
            <div className="mt-1 text-right" >
                <button onClick={ (e) => this.export(e) } className="btn btn-primary">Exporter CSV</button>
            </div>
            <table className="table table-striped">
                <thead>
                    <tr>
                        <th scope="col">#</th>
                        <th scope="col">URL</th>
                        <th scope="col">Type</th>
                        <th scope="col">Faculté</th>
                        <th scope="col">Statut</th>
                        <th className="w-50">Actions</th>
                    </tr>
                </thead>
                <Cells sites={this.props.sites} deleteSite={ this.deleteSite }/>
            </table>
        </div>
        )
        return content;
    }
}

export default withTracker(() => {

    Meteor.subscribe('sites.list');

    return {
      sites: Sites.find({}, {sort: {url: 1}}).fetch(),
    };
})(List);