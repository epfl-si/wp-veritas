import React, { useState } from "react";
import { useTracker } from "meteor/react-meteor-data";
import { useParams } from "react-router";
import { useNavigate } from "react-router-dom";
import { Sites } from "../../../api/collections";
import { Formik, Field, ErrorMessage } from "formik";
import { CustomError, CustomInput } from "../CustomFields";
import * as yup from "yup";
import { Loading } from "../Messages";
import LastModifications from "./LastModifications";
import { ExternalLink } from "lucide-react";
import { getUnitName } from "../../../api/methods/sites";

const Search_Units = new Mongo.Collection("Search_Units");

function SearchResults(props) {
  const { url } = props;

  const { loading, error, thisSite, thisUnit } = useTracker(() => {
    const thisSite = Sites.findOne({ url });

    if (!thisSite) {
      return {
        error: `SITE_NOT_FOUND`,
      };
    }

    const details = Meteor.subscribe("unit.details", thisSite.unitId, "Search_Units");
    return {
      loading: !details.ready(),
      thisSite,
      thisUnit: Search_Units.findOne({ id: thisSite.unitId }),
    };
  }, [url]);

  if (loading || !url) return <Loading />;
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
          <LastModifications siteUrl={thisSite.url} pageUrl={url} />
        </ul>
      </div>
    </div>
  );
}

export default function Search() {
  const sites = useTracker(function () {
    Meteor.subscribe("sites.list");
    Meteor.subscribe("k8ssites.list");
    return Sites.find({}, { sort: { url: 1 } }).fetch();
  });
  const { "*": queryURL_initial } = useParams();
  const [queryURL, setQueryURL] = useState(queryURL_initial);

  const navigate = useNavigate();

  const urlSchema = yup.object().shape({
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

  const submit = ({ url }, actions) => {
    if (!url.endsWith("/")) {
      url = url + "/";
    }
    setQueryURL(url);
    navigate(`${location.pathname}/${url}`);
    actions.setSubmitting(false);
    actions.resetForm();
  };

  if (sites === undefined) {
    return <Loading />;
  }
  return (
    <div className="card my-2">
      <h5 className="card-header">Trouver des info sur le site WordPress à cette URL</h5>
      <Formik
        onSubmit={submit}
        initialValues={{ url: queryURL_initial }}
        validationSchema={urlSchema}
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
            <div className="my-2">{queryURL ? <SearchResults url={queryURL} /> : <></>}</div>
          </form>
        )}
      </Formik>
    </div>
  );
}
