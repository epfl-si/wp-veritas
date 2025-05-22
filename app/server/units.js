import { Meteor } from 'meteor/meteor'

export const getUnits = async (sciper) => {
  const url = `https://websrv.epfl.ch/cgi-bin/rwsaccred/getRights?app=wp-veritas&caller=000000&password=${Meteor.settings.accred_password}&persid=${sciper}`;
  
  const response = await fetch(url);
  const data = await response.json();
  let admin_units = data.result['WordPress.Admin'];
  let editor_units = data.result['WordPress.Editor'];
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

export const getUnitById = async (unitId) => {
  const url = `https://api.epfl.ch/v1/units/${unitId}`;
  
  const response = await fetch(url, {
    headers: {
      'Authorization': `Basic ${process.env.EFPL_API_BASIC}`,
    },
  });
  
  const data = await response.json();
  return data;
}
