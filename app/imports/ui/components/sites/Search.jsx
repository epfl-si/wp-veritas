import { withTracker } from "meteor/react-meteor-data";
import React from "react";
import { Sites } from "../../../api/collections";
import { Formik, Field, ErrorMessage } from "formik";
import { CustomError, CustomInput } from "../CustomFields";
import * as yup from "yup";
import { Loading } from "../Messages";

class Search extends React.Component {
  urlSchema = yup.object().shape({
    url: yup
      .string("Champ doit être un string")
      .url("URL non valide")
      .min(17, "URL la plus courte est du genre https://x.epfl.ch")
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
      queryURL: '',
    };
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
  search = (queryURL) => {
    let result = {
      url: ''
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
      this.setState({ found: true, site: result, queryURL: queryURL });
    } else {
      this.setState({ queryURL: queryURL });
    }
  };

  submit = (values, actions) => {
    this.setState({ found: false, site: {}, queryURL: '' });
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
      if (this.state.found && this.state.site.wpInfra) {
        result = (
          <div className="card my-2">
            <div className="card-header">Résultat</div>
            <div className="card-body">
              <div className="py-1">
                L'URL <a target="_blank" href={ this.state.queryURL }>{ this.state.queryURL }</a> a pour:
              </div>
              <div className="py-1">
                - Instance WordPress: <a target="_blank" href={ this.state.site.url }>{this.state.site.url}</a>
              </div>
              <div className="py-1">
                - Unité de rattachement: <strong>{this.state.site.unitName} ({this.state.site.unitId})</strong>
              </div>
            </div>
          </div>
        );
      } else {
          result = (
            <div className="card my-2">
              <div className="card-header">Résultat</div>
              <div className="card-body">
                <div className="py-1">
                  L'URL <a href={ this.state.queryURL }>{ this.state.queryURL }</a> n'est pas un site de l'infrastructure WordPress géré par la VPSI
                </div>
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
        <div className="">
          <h4 className="py-4">Quelle est l'instance WordPress de cette URL ?</h4>
          <Formik
            onSubmit={this.submit}
            initialValues={{ url: "" }}
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
              </form>
            )}
          </Formik>

          {this.displayResult()}
        </div>
      );
    }
    return content;
  }
}

export default withTracker(() => {
  Meteor.subscribe("sites.list");
  return {
    sites: Sites.find({ isDeleted: false }, { sort: { url: 1 } }).fetch(),
  };
})(Search);
