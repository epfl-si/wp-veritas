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

function SearchResults_(props) {
  const { url, loading, error, thisSite, thisUnit } = props;
  if (loading || !url) return "Plz wait!";
  if (error == "SITE_NOT_FOUND") {
    return (
      <div>
        <h5>Résultat</h5>
        <div className="py-1">
          Désolé, l'URL <a href={url}>{url}</a> n'est pas un site de l'infrastructure WordPress géré
          par la DSI.
        </div>
      </div>
    );
  } else if (error) {
    return <h1 style={{ "background-color": "pink" }}>{error}</h1>;
  }

  return (
    <div>
      <h5>Résultats</h5>
      <div className="py-1">
        L'URL{" "}
        <a target="_blank" href={url}>
          {url}
        </a>{" "}
        a pour :
        <ul>
          <li>
            Login (pour les ayants droit) :&nbsp;
            <a target="_blank" href={thisSite.url + "wp-admin/"}>
              {thisSite.url + "wp-admin/"}
            </a>
          </li>
          {thisUnit ? (
            <li>
              Unité de rattachement :&nbsp;
              <strong>{thisUnit.name}</strong>&nbsp;({thisUnit.id})&nbsp;
              <a
                target="_blank"
                href={"https://search.epfl.ch/?filter=unit&q=" + thisUnit.id}
                title={"Information de l'unité " + thisUnit.id + " sur search.epfl.ch"}
              >
                <ExternalLink size={14} />
              </a>
              &nbsp;
              <a
                target="_blank"
                href={"https://units.epfl.ch/#/unites/" + thisUnit.id}
                title={"Information de l'unité " + thisUnit.id + " sur units.epfl.ch"}
              >
                <ExternalLink size={14} color="#000" />
              </a>
            </li>
          ) : (
            <li>Unité de rattachement :&nbsp; inconnue &nbsp;({thisSite.unitId})&nbsp;</li>
          )}
          <li>
            <LastChange url={thisSite.url + "wp-json/epfl/v1/lastchange?url=" + url} />
          </li>
        </ul>
      </div>
    </div>
  );
}

const Search_Units = new Mongo.Collection("Search_Units");

const SearchResults = withTracker(({ url }) => {
  const thisSite = Sites.findOne({ url });

  if (!thisSite) {
    return {
      // the props of the wrapped SearchResults_; namely:
      error: `SITE_NOT_FOUND`,
    };
  }

  const details = Meteor.subscribe("unit.details", thisSite.unitId, "Search_Units");
  return {
    loading: !details.ready(),
    thisSite,
    thisUnit: Search_Units.findOne({ id: thisSite.unitId }),
  };
})(SearchResults_);

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
      queryURL: props.match.params[0] || "",
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
      url: "",
    };
    // queryURL must have an end slash
    console.log(`After parsing URL; state is now: ${JSON.stringify({ queryURL })}`);
    this.setState({ queryURL: queryURL });
  };

  submit = ({ url }, actions) => {
    if (!url.endsWith("/")) {
      url = url + "/";
    }
    this.setState({ queryURL: url });
    console.log(`After submit; state is now: ${JSON.stringify({ queryURL: url })}`);
    this.props.history.push(`/search/${url}`);
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
              L'URL{" "}
              <a target="_blank" href={this.state.queryURL}>
                {this.state.queryURL}
              </a>{" "}
              a pour :
              <ul>
                <li>
                  Login (pour les ayants droit) :&nbsp;
                  <a target="_blank" href={this.state.site.url + "wp-admin/"}>
                    {this.state.site.url + "wp-admin/"}
                  </a>
                </li>
                <li>
                  Unité de rattachement :&nbsp;
                  <strong>{this.state.site.unitName}</strong>&nbsp;({this.state.site.unitId})&nbsp;
                  <a
                    target="_blank"
                    href={"https://search.epfl.ch/?filter=unit&q=" + this.state.site.unitId}
                    title={
                      "Information de l'unité " + this.state.site.unitId + " sur search.epfl.ch"
                    }
                  >
                    <ExternalLink size={14} />
                  </a>
                  &nbsp;
                  <a
                    target="_blank"
                    href={"https://units.epfl.ch/#/unites/" + this.state.site.unitId}
                    title={
                      "Information de l'unité " + this.state.site.unitId + " sur units.epfl.ch"
                    }
                  >
                    <ExternalLink size={14} color="#000" />
                  </a>
                </li>
                <LastModifications siteUrl={this.state.site.url} pageUrl={this.state.queryURL} />
              </ul>
            </div>
          </div>
        );
      } else {
        result = (
          <div>
            <h5>Résultat</h5>
            <div className="py-1">
              Désolé, l'URL <a href={this.state.queryURL}>{this.state.queryURL}</a> n'est pas un
              site de l'infrastructure WordPress géré par la DSI.
            </div>
          </div>
        );
      }
    }
    return result;
  };

  render() {
    let content;

    if (this.props.sites === undefined) {
      content = <Loading />;
    } else {
      content = (
        <div className="card my-2">
          <h5 className="card-header">Trouver des info sur le site WordPress à cette URL</h5>
          <Formik
            onSubmit={this.submit}
            initialValues={{ url: this.props.match.params[0] || "" }}
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
                  <button type="submit" className={"btn btn-primary"}>
                    Rechercher
                  </button>
                </div>
                <div className="my-2">
                  {this.state.queryURL ? <SearchResults url={this.state.queryURL} /> : <></>}
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
