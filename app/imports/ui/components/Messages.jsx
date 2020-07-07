import React from 'react';

export const AlertSuccess = (props) => (
  <div className="alert alert-success" role="alert">
    {props.message} 
  </div>
);

export const AlertSiteSuccess = (props) => (
  <div className="alert alert-success" role="alert">
    Le nouveau site <a href={"/edit/" + props.id}>{props.title}</a> a été ajouté avec succès !
  </div>
);

export const Loading = () => (
  <h1>Loading...</h1>
);
