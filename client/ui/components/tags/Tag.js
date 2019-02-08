import { withTracker } from 'meteor/react-meteor-data';
import React from 'react';
import { Tags } from '../../../../both/collections';

class Tag extends React.Component {
    render() {
        return (
            <h1>Vive les tags</h1>
        )
    }
}

export default withTracker(() => {

    Meteor.subscribe('tags.list');

    return {
      sites: Tags.find({}, {sort: {name: 1}}).fetch(),
    };
})(Tag);