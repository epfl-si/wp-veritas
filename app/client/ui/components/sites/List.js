import { withTracker } from 'meteor/react-meteor-data';
import React from 'react';
import { Link } from 'react-router-dom';
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
                        <td>{site.getStatus()}</td>
                        <td>{site.openshiftEnv}</td>
                        <td>
                            <Link className="mr-2" to={`/edit/${site._id}`}>
                                <button type="button" className="btn btn-outline-primary">Éditer</button>
                            </Link>
                            <Link className="mr-2" to={`/site-tags/${site._id}`}>
                                <button type="button" className="btn btn-outline-primary">Associer des tags</button>
                            </Link>
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
        
        let data = Sites.find({}).fetch();
        
        // Modify the keys of the Site object so that the resulting csv file 
        // has column names expected by j2wp
        data.forEach(site => {
            
            // url => wp_site_url
            delete Object.assign(site, { wp_site_url: site.url }).url
            
            // tagline => wp_tagline
            delete Object.assign(site, { wp_tagline: site.tagline }).tagline
            
            // title => wp_site_title
            delete Object.assign(site, { wp_site_title: site.title }).title
            
            // DELETE site_type

            // openshiftEnv => openshift_env
            delete Object.assign(site, { openshift_env: site.openshiftEnv }).openshiftEnv
            
            // category => category
            
            // theme => theme
            
            // faculty => theme_faculty
            delete Object.assign(site, { theme_faculty: site.faculty }).faculty
            
            // DELETE => status 
            // On a un champ status mais plus avec les valeurs yes, no mais created, etc
            
            // DELETE => installs_locked 
            
            // DELETE => updates_automatic
            
            // languages => langs
            delete Object.assign(site, { langs: site.languages }).languages
            
            // DELETE unit_name
            
            // unitId => unit_id
            delete Object.assign(site, { unit_id: site.unitId }).unitId
            
            // comment => comment
        
        });

        console.log(data);

        const csv = Papa.unparse({
           // Define fields to export
           fields: [
               "wp_site_url",
               "wp_site_title",
               "wp_tagline",
               "openshift_env",
               "type",
               "theme",
               "faculty",
               "langs",
               "unit_id",
               "snowNumber",
               "status",
               "comment",
               "plannedClosingDate",
               "requestedDate",
               "createdDate",
               "archivedDate",
               "trashedDate"
            ],
            data: data,
            
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
                        <th scope="col">Statut</th>
                        <th scope="col">Env. Openshift</th>
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