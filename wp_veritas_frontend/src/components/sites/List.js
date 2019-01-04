import React from 'react';
import apiWPSite from '../../conf/api.wp_site';

class Cells extends React.Component {
    render() {
        return (
            <tbody>
                {this.props.sites.map( (site, index) => (
                    <tr key={site._id}>
                        <th scope="row">{index}</th>
                        <td>{site.url}</td>
                        <td>{site.openshift_env}</td>
                    </tr>
                ))}
            </tbody>
        )
    }
}

export default class List extends React.Component {
    
    constructor(props){
        super(props);
        this.state = {
            sites: []
        }
    }

    componentDidMount() {
        apiWPSite.get('/sites')
          .then( response => response.data )
          .then( sites => {
              this.setState(
                  {sites: sites}
              )
            }
          )
          .catch( err => console.log(err));
      }

    render() {
        return (
            <div className="container">
                <h2 className="p-4">Source de vérité des sites WordPress</h2>
                <table className="table table-striped">
                    <thead>
                        <tr>
                            <th scope="col">#</th>
                            <th scope="col">URL</th>
                            <th scope="col">OpenShift Env</th>
                        </tr>
                    </thead>
                    <Cells sites={this.state.sites} />
                </table>
            </div>
        );
    }
}