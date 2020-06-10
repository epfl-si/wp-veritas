import { Meteor } from 'meteor/meteor';
import { withTracker } from 'meteor/react-meteor-data';
import ListSite from '../components/sites/ListSite.jsx';

const ListSiteContainer = withTracker(() => {
  const handle = Meteor.subscribe("sites.list");
  return {
    loading: !handle.ready(),
    sites: Sites.find({}, { sort: { url: 1 } }).fetch(),
  };
})(ListSite);

export default ListSiteContainer;