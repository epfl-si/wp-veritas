import { withTracker } from "meteor/react-meteor-data";
import React from "react";
import { Sites } from "../../../api/collections";
import { Formik, Field, ErrorMessage } from "formik";
import { CustomError, CustomInput } from "../CustomFields";
import * as yup from "yup";
import { Loading } from "../Messages";
import LastModifications from "./LastModifications";
import { ExternalLink } from "lucide-react";
import { getUnitName } from "../../../api/methods/sites";

class Search extends React.Component {
  urlSchema = yup.object().shape({
    url: yup
      .string("Champ doit être un string")
      .url("URL non valide")
      .min(12, "URL la plus courte est du genre https://x.epfl.ch")
      .test("startsWithHttps", "URL doit commencer par https://", function (value) {
        if (value && !value.startsWith("https://")) {
          return false;
        }
        return true;
      })
      .required("Champ obligatoire"),
  });

  constructor(props) {
    super(props);

    this.state = {
      site: {},
      found: false,
      queryURL: props.match.params[0] || '',
    };
  }

  componentDidMount() {
    const query = this.props.match.params[0];
    if (query) {
      this.search(query);
    }
  }

  /**
   * Cette méthode prend en entrée une URL d'une page WordPress et
   * retourne l'URL de l'instance WordPress.
   *
   * Example de base:
   * URL saisi par l'utilisateur: https://www.epfl.ch/campus/events/events/campus-events/scientific-and-educational-days/
   * URL de l'instance: https://www.epfl.ch/campus/events
   *
   * Mais attention! Il existe des exemples plus complexes
   * Par exemple:
   *
   * Existing WordPress instance:
   * - https://www.epfl.ch/campus/services/ressources
   * - https://www.epfl.ch/campus/services
   * User URL: https://www.epfl.ch/campus/services/ressources-informatiques/support-informatique/linux
   * Expected result: https://www.epfl.ch/campus/services/wp-admin
   * And not https://www.epfl.ch/campus/services/ressources/wp-admin
   */
  search = async (queryURL) => {
    let result = {
      url: ''
    }
    // queryURL must have an end slash
    if (!queryURL.endsWith('/')) {
      queryURL = queryURL + '/';
    }
    this.props.sites.forEach((currentSite) => {
      if (queryURL.startsWith(currentSite.url)) {
        if (currentSite.url.length > result.url.length) {
          if (queryURL.startsWith(currentSite.url) || queryURL == currentSite.url) {
            result = currentSite;
          }
        }
      }
    });
    if (result.url.length > 0) {
      result['unitName'] = await Meteor.callAsync('getUnitName', result.unitId)
      this.setState({ found: true, site: result, queryURL: queryURL });
    } else {
      this.setState({ queryURL: queryURL });
    }
  };

  submit = (values, actions) => {
    this.setState({ found: false, site: {}, queryURL: '' });
    this.props.history.push(`/search/${values.url}`);

    let urlSearched = values.url;
    this.search(urlSearched)
    actions.setSubmitting(false);
    actions.resetForm();
  };

  loading = () => {
    return this.props.sites === undefined;
  };

  displayResult = () => {
    let result;
    if (this.state.queryURL) {
      if (this.state.found) {
        result = (
          <div>
            <h5>Résultats</h5>
            <div className="py-1">
              L'URL <a target="_blank" href={ this.state.queryURL }>{ this.state.queryURL }</a> a pour :
              <ul>
                <li>
                  Login (pour les ayants droit) :&nbsp;
                  <a target="_blank" href={ this.state.site.url + 'wp-admin/' }>{this.state.site.url + 'wp-admin/'}</a>
                </li>
                <li>
                  Unité de rattachement :&nbsp;
                  <strong>{this.state.site.unitName}</strong>&nbsp;({this.state.site.unitId})&nbsp;
                  <a
                    target="_blank"
                    href={"https://search.epfl.ch/?filter=unit&q=" + this.state.site.unitId}
                    title={"Information de l'unité " + this.state.site.unitId + " sur search.epfl.ch"}
                  >
                    <ExternalLink size={14} />
                  </a>
                  &nbsp;
                  <a
                    target="_blank"
                    href={"https://units.epfl.ch/#/unites/" + this.state.site.unitId}
                    title={"Information de l'unité " + this.state.site.unitId + " sur units.epfl.ch"}
                  >
                    <ExternalLink size={14} color="#000" />
                  </a>
                </li>
                <LastModifications siteUrl={this.state.site.url} pageUrl={this.state.queryURL}/>
              </ul>
            </div>
          </div>
        );
      } else {
        result = (
          <div>
            <h5>Résultat</h5>
            <div className="py-1">
              Désolé, l'URL <a href={ this.state.queryURL }>{ this.state.queryURL }</a> n'est pas un site de l'infrastructure WordPress géré par la DSI.
            </div>
          </div> 
        )
      }
    }
    return result;
  };

  render() {
    let content;

    if (this.loading()) {
      content = <Loading />;
    } else {
      content = (
        <div className="card my-2">
          <h5 className="card-header">Trouver des info sur le site WordPress à cette URL</h5>
          <Formik
            onSubmit={this.submit}
            initialValues={{ url: this.props.match.params[0] || '' }}
            validationSchema={this.urlSchema}
            validateOnBlur={false}
            validateOnChange={false}
          >
            {({ handleSubmit, isSubmitting, values }) => (
              <form method="GET" onSubmit={handleSubmit} className="bg-white border p-4">
                <Field
                  placeholder="Merci de saisir une URL"
                  label="URL"
                  name="url"
                  type="text"
                  component={CustomInput}
                />
                <ErrorMessage name="url" component={CustomError} />
                <div className="my-1 text-right">
                  <button type="submit" disabled={isSubmitting} className="btn btn-primary">
                    Rechercher
                  </button>
                </div>
                <div className="my-2">
                  {this.displayResult()}
                </div>
              </form>
            )}
          </Formik>
        </div>
      );
    }
    return content;
  }
}

export default withTracker(() => {
  Meteor.subscribe("sites.list");
  Meteor.subscribe("k8ssites.list");
  return {
    sites: Sites.find({}, { sort: { url: 1 } }).fetch(),
  };
})(Search);
