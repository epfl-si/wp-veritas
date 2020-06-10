import { withTracker } from "meteor/react-meteor-data";
import AddSite from "../components/sites/AddSite";
import {
  Sites,
  OpenshiftEnvs,
  Themes,
  Categories,
} from "../../api/collections";

const AddSiteContainer = withTracker((props) => {
  const handles = [
    Meteor.subscribe("openshiftEnv.list"),
    Meteor.subscribe("theme.list"),
    Meteor.subscribe("category.list"),
  ];
  const loading = handles.some((handle) => !handle.ready());

  let sites;

  if (props.match.path === "/edit/:_id") {
    Meteor.subscribe("siteById", props.match.params._id);
    sites = Sites.find({ _id: props.match.params._id }).fetch();
    return {
      loading,
      openshiftenvs: OpenshiftEnvs.find({}, { sort: { name: 1 } }).fetch(),
      themes: Themes.find({}, { sort: { name: 1 } }).fetch(),
      categories: Categories.find({}, { sort: { name: 1 } }).fetch(),
      site: sites[0],
    };
  } else {
    return {
      loading,
      openshiftenvs: OpenshiftEnvs.find({}, { sort: { name: 1 } }).fetch(),
      themes: Themes.find({}, { sort: { name: 1 } }).fetch(),
      categories: Categories.find({}, { sort: { name: 1 } }).fetch(),
    };
  }
})(AddSite);

export default AddSiteContainer;
