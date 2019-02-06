import { HTTP } from 'meteor/http';

export default getUnits = (sciper) => {

  const ACCRED_WEBSERVICE = "https://websrv.epfl.ch/cgi-bin/rwsaccred/getRights?app=wp-veritas&caller=000000&password=n2utoqeltum1&persid=";

  let url = ACCRED_WEBSERVICE + sciper;

  // Note: si on ne précise pas de fonction de callback en 3ème paramètre
  // HTTP GET est synchrone
  let response = HTTP.get(url, {});
  let admin_units = response.data.result['WordPress.Admin'];
  let editor_units = response.data.result['WordPress.Editor'];
  let units;
  if (admin_units == undefined && editor_units == undefined) {
    units = [];
  } else if (admin_units == undefined) {
    units = editor_units;
  } else if (editor_units == undefined) {
    units = admin_units;
  } else {
    units = [...admin_units, ...editor_units];
  }
  // Convert Array of Integer to Array of String
  units = units.map(String);
  return units;
}
