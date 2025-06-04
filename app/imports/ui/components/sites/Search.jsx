import React, { useState } from "react";
import { useTracker } from "meteor/react-meteor-data";
import { useParams } from "react-router";
import { useNavigate } from "react-router-dom";
import { Sites } from "../../../api/collections";
import { Formik, Field, ErrorMessage } from "formik";
import { CustomError, CustomInput } from "../CustomFields";
import * as yup from "yup";
import { Loading } from "../Messages";
import LastChange from "./LastChange";
import { ExternalLink } from "lucide-react";
import { getUnitName } from "../../../api/methods/sites";



const Search_Units = new Mongo.Collection("Search_Units");

function SearchResults ({ queryURL, sites }) {
  const matchingSites = sites.filter((s) => queryURL.startsWith(s.url)).
    sort((a, b) => b.url.length - a.url.length);
  const site = matchingSites[0];  // Longest-prefix match

  const { loading, error, thisUnit } = useTracker(() => {
    if (! site) return { };
    const details = Meteor.subscribe("unit.details",
      site.unitId, "Search_Units");
    return {
      loading: !details.ready(),
      thisUnit: Search_Units.findOne({ id: site.unitId }),
    }
  }, [site]);

  if (loading || ! sites) return <Loading/>;
  if (error) {
    return <h1 style={{"background-color": "pink"}}>{error}</h1>
  }

  if (! matchingSites.length) {
    return <div>
      <h5>Résultat</h5>
      <div className="py-1">
        Désolé, l'URL <a href={ queryURL }>{ queryURL }</a> n'est pas un site de l'infrastructure WordPress géré par la DSI.
      </div>
    </div>;
  }

  return <div>
           <h5>Résultats</h5>
           <div className="py-1">
             L'URL <a target="_blank" href={ queryURL }>{ queryURL }</a> a pour :
             <ul>
                <li>
                  Login (pour les ayants droit) :&nbsp;
                  <a target="_blank" href={ site.url + 'wp-admin/' }>{site.url + 'wp-admin/'}</a>
                </li>
               { thisUnit ?
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
                </li> : <li>Unité de rattachement :&nbsp; inconnue &nbsp;({site.unitId})&nbsp;</li>
               }
                <li>
                  <LastChange url={site.url + 'wp-json/epfl/v1/lastchange?url=' + queryURL}/>
                </li>
              </ul>
            </div>
          </div>;
}

export default function Search () {
  const sites = useTracker (function() {
    Meteor.subscribe("sites.list");
    Meteor.subscribe("k8ssites.list");
    return Sites.find({}, { sort: { url: 1 } }).fetch();
  });
  const { "*" : queryURL_raw } = useParams();
  const safeQueryURLRaw = typeof queryURL_raw === "string" ? queryURL_raw : "";
  const queryURL_initial = safeQueryURLRaw
    ? `${safeQueryURLRaw}${safeQueryURLRaw.endsWith("/") ? "" : "/"}`
    : "";
  const [ queryURL, setQueryURL ] = useState(queryURL_initial);

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
    if (! url.endsWith('/')) {
      url = url + '/';
    }
    setQueryURL(url);
    navigate(`/search/${url}`);
    actions.setSubmitting(false);
    actions.resetForm();
  };

  if (sites === undefined) {
    return <Loading />;
  }
  return <div className="card my-2">
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
                <div className="my-2">
                  {queryURL ?
                    <SearchResults sites={sites} queryURL={queryURL}/> :
                    <></>}
                </div>
              </form>
            )}
          </Formik>
        </div>;
}
